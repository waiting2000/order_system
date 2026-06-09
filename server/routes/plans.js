import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { broadcast } from '../ws.js';

const router = Router();
router.use(authMiddleware);

// Helper: get Monday of current week (or specified week)
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Get weekly plan
router.get('/plans', (req, res) => {
  const { weekStart } = req.query;

  // Get current local date
  const now = new Date();
  const todayLocal = now.toISOString().split('T')[0];

  const mondayDate = weekStart || getMonday(todayLocal);

  // Get planned days
  const plans = db.prepare(`
    SELECT p.id, p.week_start, p.day_of_week, p.recipe_id, p.created_by, p.created_at,
           r.id as recipe_id, r.name, r.category, r.image, r.description, r.ingredients, r.cookTime, r.difficulty
    FROM weekly_plans p
    LEFT JOIN recipes r ON p.recipe_id = r.id
    WHERE p.week_start = ?
    ORDER BY p.day_of_week ASC
  `).all(mondayDate);

  // Parse ingredients for each plan
  const days = plans.map(p => ({
    ...p,
    ingredients: JSON.parse(p.ingredients || '[]'),
  }));

  res.json({
    weekStart: mondayDate,
    days,
  });
});

// Get today's plan (for integration with TodayMenu)
router.get('/plans/today', (req, res) => {
  const now = new Date();
  const todayLocal = now.toISOString().split('T')[0];

  // Calculate day of week (0=Monday, 6=Sunday)
  const jsDay = now.getDay(); // 0=Sunday, 1=Monday, ... 6=Saturday
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // Convert to 0=Monday, 6=Sunday

  const mondayDate = getMonday(todayLocal);

  const plan = db.prepare(`
    SELECT p.*, r.name, r.category, r.image, r.description, r.ingredients, r.cookTime, r.difficulty
    FROM weekly_plans p
    LEFT JOIN recipes r ON p.recipe_id = r.id
    WHERE p.week_start = ? AND p.day_of_week = ?
  `).get(mondayDate, dayOfWeek);

  if (plan) {
    plan.ingredients = JSON.parse(plan.ingredients || '[]');
    plan.todayDate = todayLocal;
    plan.dayLabel = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][dayOfWeek];
  }

  res.json({ plan: plan || null, todayDate: todayLocal, dayOfWeek, dayLabel: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][dayOfWeek] });
});

// Set plan for a specific day
router.put('/plans/:weekStart/:dayOfWeek', (req, res) => {
  const { weekStart, dayOfWeek } = req.params;
  const { recipeId } = req.body;
  const dayNum = parseInt(dayOfWeek, 10);

  if (isNaN(dayNum) || dayNum < 0 || dayNum > 6) {
    return res.status(400).json({ error: '无效的星期 (0-6)' });
  }

  if (!recipeId) {
    return res.status(400).json({ error: '请指定菜谱' });
  }

  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
  if (!recipe) {
    return res.status(404).json({ error: '菜谱不存在' });
  }

  // Upsert: delete existing then insert (handles the UNIQUE constraint)
  db.prepare('DELETE FROM weekly_plans WHERE week_start = ? AND day_of_week = ?').run(weekStart, dayOfWeek);
  db.prepare(`
    INSERT INTO weekly_plans (week_start, day_of_week, recipe_id, created_by)
    VALUES (?, ?, ?, ?)
  `).run(weekStart, dayNum, recipeId, req.user.nickname);

  recipe.ingredients = JSON.parse(recipe.ingredients || '[]');
  broadcast('plan_updated', { weekStart, dayOfWeek: dayNum, recipe });

  res.json({ weekStart, dayOfWeek: dayNum, recipe });
});

// Clear plan for a specific day
router.delete('/plans/:weekStart/:dayOfWeek', (req, res) => {
  const { weekStart, dayOfWeek } = req.params;
  const dayNum = parseInt(dayOfWeek, 10);

  const result = db.prepare('DELETE FROM weekly_plans WHERE week_start = ? AND day_of_week = ?').run(weekStart, dayNum);

  broadcast('plan_updated', { weekStart, dayOfWeek: dayNum, recipeId: null });

  res.json({ success: true, changes: result.changes });
});

export default router;
