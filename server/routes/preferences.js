import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Get current user's dietary preferences
router.get('/users/preferences', (req, res) => {
  let prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(req.user.id);
  if (!prefs) {
    // Auto-create empty preferences if somehow missing
    db.prepare('INSERT INTO user_preferences (user_id) VALUES (?)').run(req.user.id);
    prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(req.user.id);
  }
  res.json({
    allergies: JSON.parse(prefs.allergies || '[]'),
    dislikes: JSON.parse(prefs.dislikes || '[]'),
    dietaryType: prefs.dietary_type || '',
  });
});

// Update user's dietary preferences
router.put('/users/preferences', (req, res) => {
  const { allergies, dislikes, dietaryType } = req.body;

  const existing = db.prepare('SELECT id FROM user_preferences WHERE user_id = ?').get(req.user.id);
  if (existing) {
    db.prepare(`
      UPDATE user_preferences
      SET allergies = ?, dislikes = ?, dietary_type = ?,
          updated_at = datetime('now', 'localtime')
      WHERE user_id = ?
    `).run(
      JSON.stringify(allergies || []),
      JSON.stringify(dislikes || []),
      dietaryType || '',
      req.user.id
    );
  } else {
    db.prepare(`
      INSERT INTO user_preferences (user_id, allergies, dislikes, dietary_type)
      VALUES (?, ?, ?, ?)
    `).run(
      req.user.id,
      JSON.stringify(allergies || []),
      JSON.stringify(dislikes || []),
      dietaryType || ''
    );
  }

  res.json({
    allergies: allergies || [],
    dislikes: dislikes || [],
    dietaryType: dietaryType || '',
  });
});

export default router;
