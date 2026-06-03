import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

// Register
router.post('/register', (req, res) => {
  const { username, password, nickname } = req.body;

  if (!username || !password || !nickname) {
    return res.status(400).json({ error: '用户名、密码和昵称不能为空' });
  }
  if (username.length < 2 || username.length > 20) {
    return res.status(400).json({ error: '用户名需要 2-20 个字符' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: '密码至少需要 4 个字符' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: '该用户名已被注册' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, password_hash, nickname) VALUES (?, ?, ?)'
  ).run(username, passwordHash, nickname);

  const user = db.prepare('SELECT id, username, nickname FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = generateToken(user);

  res.status(201).json({ token, user });
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: { id: user.id, username: user.username, nickname: user.nickname }
  });
});

// Get current user
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, nickname FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json(user);
});

export default router;
