import express from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// ---- 初始化表结构 ----
db.exec(`
  CREATE TABLE IF NOT EXISTS notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    type TEXT DEFAULT 'public',
    done INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
`)

// 获取公告列表（全家可见）
router.get('/notices', authMiddleware, (req, res) => {
  const notices = db.prepare(`
    SELECT * FROM notices WHERE type = 'public' ORDER BY created_at DESC LIMIT 50
  `).all()
  res.json(notices)
})

// 获取个人待办（仅自己可见）
router.get('/notices/todos', authMiddleware, (req, res) => {
  const todos = db.prepare(`
    SELECT * FROM notices WHERE type = 'todo' AND author = ? ORDER BY done ASC, created_at DESC
  `).all(req.user.nickname || req.user.username)
  res.json(todos)
})

// 新增公告 or 待办
router.post('/notices', authMiddleware, (req, res) => {
  const { content, type = 'public' } = req.body
  if (!content?.trim()) return res.status(400).json({ error: '内容不能为空' })
  const author = req.user.nickname || req.user.username
  const result = db.prepare(`
    INSERT INTO notices (content, author, type) VALUES (?, ?, ?)
  `).run(content.trim(), author, type)
  const item = db.prepare('SELECT * FROM notices WHERE id = ?').get(result.lastInsertRowid)
  res.json(item)
})

// 切换待办完成状态
router.patch('/notices/:id/toggle', authMiddleware, (req, res) => {
  const { id } = req.params
  const notice = db.prepare('SELECT * FROM notices WHERE id = ?').get(id)
  if (!notice) return res.status(404).json({ error: '不存在' })
  const author = req.user.nickname || req.user.username
  if (notice.type === 'todo' && notice.author !== author) {
    return res.status(403).json({ error: '无权操作' })
  }
  db.prepare('UPDATE notices SET done = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?')
    .run(notice.done ? 0 : 1, id)
  const updated = db.prepare('SELECT * FROM notices WHERE id = ?').get(id)
  res.json(updated)
})

// 删除
router.delete('/notices/:id', authMiddleware, (req, res) => {
  const { id } = req.params
  const notice = db.prepare('SELECT * FROM notices WHERE id = ?').get(id)
  if (!notice) return res.status(404).json({ error: '不存在' })
  const author = req.user.nickname || req.user.username
  if (notice.author !== author) return res.status(403).json({ error: '无权删除' })
  db.prepare('DELETE FROM notices WHERE id = ?').run(id)
  res.json({ ok: true })
})

export default router
