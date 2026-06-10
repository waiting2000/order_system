import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/profile
 * 获取当前用户的完整档案信息（含积分余额、饮食偏好摘要、最近 10 条兑换记录）
 */
router.get('/profile', (req, res) => {
  const user = db.prepare('SELECT id, username, nickname, points, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(req.user.id);
  const preferences = prefs
    ? {
      allergies: JSON.parse(prefs.allergies || '[]'),
      dislikes: JSON.parse(prefs.dislikes || '[]'),
      dietaryType: prefs.dietary_type || '',
    }
    : { allergies: [], dislikes: [], dietaryType: '' };

  // 最近 10 条兑换记录
  const redemptions = db.prepare(`
    SELECT id, item_id, item_name, points_spent, status, created_at
    FROM redemption_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 10
  `).all(req.user.id);

  const recentRedemptions = redemptions.map(r => ({
    id: r.id,
    itemId: r.item_id,
    itemName: r.item_name,
    pointsSpent: r.points_spent,
    status: r.status,
    createdAt: r.created_at,
  }));

  res.json({
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    points: user.points ?? 0,
    createdAt: user.created_at,
    preferences,
    recentRedemptions,
  });
});

/**
 * GET /api/version-logs
 * 获取全部版本更新日志，按发布日期倒序
 */
router.get('/version-logs', (req, res) => {
  const logs = db.prepare('SELECT * FROM version_logs ORDER BY release_date DESC').all();
  const parsed = logs.map(log => ({
    id: log.id,
    version: log.version,
    releaseDate: log.release_date,
    changes: JSON.parse(log.changes || '[]'),
    createdAt: log.created_at,
  }));
  res.json(parsed);
});

export default router;
