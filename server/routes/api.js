import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { broadcast } from '../ws.js';

const router = Router();

// All business routes require authentication
router.use(authMiddleware);

// ==================== 菜谱 API ====================

// 获取所有菜谱
router.get('/recipes', (req, res) => {
  const { category, search } = req.query;
  let sql = 'SELECT * FROM recipes';
  const conditions = [];
  const params = [];

  if (category && category !== '全部') {
    conditions.push('category = ?');
    params.push(category);
  }
  if (search) {
    conditions.push('(name LIKE ? OR description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY id DESC';

  const recipes = db.prepare(sql).all(...params);
  // Parse ingredients JSON string
  const parsed = recipes.map(r => ({
    ...r,
    ingredients: JSON.parse(r.ingredients || '[]')
  }));
  res.json(parsed);
});

// 获取单个菜谱
router.get('/recipes/:id', (req, res) => {
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  if (!recipe) return res.status(404).json({ error: '菜谱不存在' });
  recipe.ingredients = JSON.parse(recipe.ingredients || '[]');
  res.json(recipe);
});

// 添加菜谱
router.post('/recipes', (req, res) => {
  const { name, category, image, description, ingredients, cookTime, difficulty } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: '菜名和分类不能为空' });
  }

  const result = db.prepare(`
    INSERT INTO recipes (name, category, image, description, ingredients, cookTime, difficulty)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, category, image || '', description || '', JSON.stringify(ingredients || []), cookTime || 30, difficulty || '简单');

  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(result.lastInsertRowid);
  recipe.ingredients = JSON.parse(recipe.ingredients || '[]');
  broadcast('recipe_added', recipe);
  res.status(201).json(recipe);
});

// 更新菜谱
router.put('/recipes/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '菜谱不存在' });

  const { name, category, image, description, ingredients, cookTime, difficulty } = req.body;
  db.prepare(`
    UPDATE recipes 
    SET name = ?, category = ?, image = ?, description = ?, ingredients = ?, cookTime = ?, difficulty = ?,
        updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(
    name ?? existing.name,
    category ?? existing.category,
    image ?? existing.image,
    description ?? existing.description,
    ingredients ? JSON.stringify(ingredients) : existing.ingredients,
    cookTime ?? existing.cookTime,
    difficulty ?? existing.difficulty,
    req.params.id
  );

  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  recipe.ingredients = JSON.parse(recipe.ingredients || '[]');
  broadcast('recipe_updated', recipe);
  res.json(recipe);
});
router.delete('/recipes/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '菜谱不存在' });

  db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id);
  broadcast('recipe_deleted', { id: Number(req.params.id) });
  res.json({ success: true });
});

// ==================== 今日菜单 API ====================

// 获取今日菜单（仅返回今天的）
router.get('/orders', (req, res) => {
  const orders = db.prepare(`
    SELECT d.id as order_id, r.*, d.created_at as order_time, d.nickname
    FROM daily_orders d
    JOIN recipes r ON d.recipe_id = r.id
    WHERE date(d.created_at) = date('now', 'localtime')
    ORDER BY d.id DESC
  `).all();

  const parsed = orders.map(o => ({
    ...o,
    ingredients: JSON.parse(o.ingredients || '[]')
  }));
  res.json(parsed);
});

// 点菜（添加到今日菜单，昵称来自登录用户）
router.post('/orders', (req, res) => {
  const { recipeId } = req.body;
  if (!recipeId) return res.status(400).json({ error: '请指定菜品' });

  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
  if (!recipe) return res.status(404).json({ error: '菜谱不存在' });

  const nickname = req.user.nickname;

  // 同一个人的同一道菜不重复点（允许不同人点同一道菜）
  const existing = db.prepare(
    'SELECT * FROM daily_orders WHERE recipe_id = ? AND nickname = ? AND date(created_at) = date(\'now\', \'localtime\')'
  ).get(recipeId, nickname);
  if (existing) {
    return res.status(409).json({ error: '你已经点过这道菜了' });
  }

  db.prepare('INSERT INTO daily_orders (recipe_id, nickname) VALUES (?, ?)').run(recipeId, nickname);

  const order = db.prepare(`
    SELECT d.id as order_id, r.*, d.created_at as order_time, d.nickname
    FROM daily_orders d
    JOIN recipes r ON d.recipe_id = r.id
    WHERE d.id = ?
  `).get(db.prepare('SELECT last_insert_rowid() as id').get().id);

  order.ingredients = JSON.parse(order.ingredients || '[]');
  broadcast('order_added', order);
  res.status(201).json(order);
});

// 取消点菜
router.delete('/orders/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM daily_orders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '该订单不存在' });

  db.prepare('DELETE FROM daily_orders WHERE id = ?').run(req.params.id);
  broadcast('order_removed', { order_id: Number(req.params.id) });
  res.json({ success: true });
});

// 按菜谱 ID 取消点菜
router.delete('/orders/recipe/:recipeId', (req, res) => {
  db.prepare('DELETE FROM daily_orders WHERE recipe_id = ?').run(req.params.recipeId);
  res.json({ success: true });
});

// 清空今日菜单
router.delete('/orders', (req, res) => {
  db.prepare("DELETE FROM daily_orders WHERE date(created_at) = date('now', 'localtime')").run();
  broadcast('orders_cleared');
  res.json({ success: true });
});

// ==================== 历史记录 API ====================

// 获取历史日期列表（去重日期，按日期倒序）
router.get('/history/dates', (req, res) => {
  const dates = db.prepare(`
    SELECT DISTINCT date(created_at) as date
    FROM daily_orders
    ORDER BY date DESC
    LIMIT 90
  `).all()
  res.json(dates.map(d => d.date))
})

// 获取指定日期的点菜记录
router.get('/history/:date', (req, res) => {
  const { date } = req.params
  // 简单校验日期格式 YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: '日期格式错误，应为 YYYY-MM-DD' })
  }
  const orders = db.prepare(`
    SELECT d.id as order_id, r.*, d.created_at as order_time, d.nickname
    FROM daily_orders d
    JOIN recipes r ON d.recipe_id = r.id
    WHERE date(d.created_at) = ?
    ORDER BY d.id ASC
  `).all(date)
  const parsed = orders.map(o => ({
    ...o,
    ingredients: JSON.parse(o.ingredients || '[]')
  }))
  res.json(parsed)
})

export default router;
