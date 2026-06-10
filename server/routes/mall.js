import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/mall/items
 * 获取商城商品列表，可按分类筛选，仅返回上架商品
 */
router.get('/mall/items', (req, res) => {
  const { category } = req.query;

  let sql = 'SELECT * FROM mall_items WHERE is_active = 1';
  const params = [];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  sql += ' ORDER BY category, id';

  const items = db.prepare(sql).all(...params);
  const parsed = items.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    points: item.points,
    stock: item.stock,
    image: item.image,
    category: item.category,
    isActive: !!item.is_active,
  }));

  res.json(parsed);
});

/**
 * GET /api/mall/items/:id
 * 获取单个商品详情
 */
router.get('/mall/items/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM mall_items WHERE id = ? AND is_active = 1').get(req.params.id);
  if (!item) return res.status(404).json({ error: '商品不存在或已下架' });

  res.json({
    id: item.id,
    name: item.name,
    description: item.description,
    points: item.points,
    stock: item.stock,
    image: item.image,
    category: item.category,
    isActive: !!item.is_active,
  });
});

/**
 * GET /api/mall/my-points
 * 获取当前用户积分余额
 */
router.get('/mall/my-points', (req, res) => {
  const user = db.prepare('SELECT points FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  res.json({ points: user.points || 0 });
});

/**
 * POST /api/mall/redeem
 * 兑换商品（事务操作：校验积分→扣积分→扣库存→写记录）
 */
router.post('/mall/redeem', (req, res) => {
  const { itemId } = req.body;
  if (!itemId) return res.status(400).json({ error: '请选择要兑换的商品' });

  // 查询商品信息
  const item = db.prepare('SELECT * FROM mall_items WHERE id = ? AND is_active = 1').get(itemId);
  if (!item) return res.status(404).json({ error: '商品不存在或已下架' });

  // 查询用户积分
  const user = db.prepare('SELECT points FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const currentPoints = user.points || 0;

  // 校验积分
  if (currentPoints < item.points) {
    return res.status(400).json({ error: '积分不足' });
  }

  // 校验库存（-1 表示无限库存）
  if (item.stock !== -1 && item.stock <= 0) {
    return res.status(400).json({ error: '商品库存不足' });
  }

  // 事务操作
  let record;
  const redeem = db.transaction(() => {
    // 扣减积分（COALESCE 兼容已有用户 points 为 NULL 的情况）
    db.prepare('UPDATE users SET points = COALESCE(points, 100) - ? WHERE id = ?').run(item.points, req.user.id);

    // 扣减库存（仅有限库存需要扣减）
    if (item.stock !== -1) {
      db.prepare("UPDATE mall_items SET stock = stock - 1, updated_at = datetime('now', 'localtime') WHERE id = ? AND stock > 0").run(itemId);
    }

    // 写入兑换记录
    const result = db.prepare(`
      INSERT INTO redemption_records (user_id, item_id, points_spent, item_name)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, itemId, item.points, item.name);

    record = {
      id: result.lastInsertRowid,
      itemId: itemId,
      itemName: item.name,
      pointsSpent: item.points,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };
  });

  try {
    redeem();
    res.json(record);
  } catch (e) {
    console.error('兑换失败:', e);
    res.status(500).json({ error: '兑换失败，请重试' });
  }
});

/**
 * GET /api/mall/records
 * 获取当前用户的兑换记录（按时间倒序）
 */
router.get('/mall/records', (req, res) => {
  const records = db.prepare(`
    SELECT * FROM redemption_records WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.user.id);

  const parsed = records.map(r => ({
    id: r.id,
    itemId: r.item_id,
    itemName: r.item_name,
    pointsSpent: r.points_spent,
    status: r.status,
    createdAt: r.created_at,
  }));

  res.json(parsed);
});

export default router;
