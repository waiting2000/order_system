import { Router } from 'express';
import crypto from 'crypto';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

// 需要认证的分享接口
const authRouter = Router();
authRouter.use(authMiddleware);

authRouter.post('/', (req, res) => {
  const { recipeId } = req.body;
  if (!recipeId) return res.status(400).json({ error: '请指定菜谱' });

  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
  if (!recipe) return res.status(404).json({ error: '菜谱不存在' });

  // 已有有效分享则复用
  const existing = db.prepare('SELECT * FROM shares WHERE recipe_id = ?').get(recipeId);
  if (existing) {
    return res.json({ token: existing.token, created_at: existing.created_at });
  }

  const token = crypto.randomBytes(12).toString('hex');
  db.prepare('INSERT INTO shares (recipe_id, token) VALUES (?, ?)').run(recipeId, token);

  res.status(201).json({ token });
});

authRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM shares WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// 公开接口（无需认证）
const publicRouter = Router();

publicRouter.get('/shared/:token', (req, res) => {
  const share = db.prepare('SELECT * FROM shares WHERE token = ?').get(req.params.token);
  if (!share) return res.status(404).json({ error: '分享链接无效或已过期' });

  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(share.recipe_id);
  if (!recipe) return res.status(404).json({ error: '菜谱已被删除' });

  recipe.ingredients = JSON.parse(recipe.ingredients || '[]');
  res.json(recipe);
});

export { authRouter as shareRoutes, publicRouter as sharedRoutes };
