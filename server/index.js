import http from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import authRoutes from './routes/auth.js';
import { shareRoutes, sharedRoutes } from './routes/shares.js';
import preferencesRoutes from './routes/preferences.js';
import plansRoutes from './routes/plans.js';
import votesRoutes from './routes/votes.js';
import noticesRoutes from './routes/notices.js';
import profileRoutes from './routes/profile.js';
import mallRoutes from './routes/mall.js';
import db from './db.js';
import { initWebSocket } from './ws.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// JSON body parser（50MB 上限，支持 Base64 图片）
app.use(express.json({ limit: '50mb' }));

// Auth routes（无需认证）
app.use('/api/auth', authRoutes);

// Share public routes（无需认证）
app.use('/api', sharedRoutes);

// Share management routes（需要认证，必须在 apiRoutes 之前，否则会被 apiRoutes 的 authMiddleware 拦截）
app.use('/api/shares', shareRoutes);

// User preferences routes（需要认证）
app.use('/api', preferencesRoutes);

// Weekly plans routes（需要认证）
app.use('/api', plansRoutes);

// Voting routes（需要认证）
app.use('/api', votesRoutes);

// Notices routes（需要认证）
app.use('/api', noticesRoutes);

// Profile & version-logs routes（需要认证）
app.use('/api', profileRoutes);

// Mall routes（需要认证）
app.use('/api', mallRoutes);

// Business API routes（需要认证）
app.use('/api', apiRoutes);

// Serve frontend static files
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback — all non-API routes serve index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API 不存在' });
  res.sendFile(path.join(distPath, 'index.html'));
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

// 初始化 WebSocket（共享 HTTP Server）
initWebSocket(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  🏠 家年华 - 家庭综合应用');
  console.log(`  Server: http://localhost:${PORT}`);
  console.log(`  API:    http://localhost:${PORT}/api`);
  console.log(`  WS:     ws://localhost:${PORT}/ws`);
  console.log(`  Data:   SQLite (data/family-menu.db)`);
  console.log('');
});
