import { WebSocketServer } from 'ws';

// Map: ws client → { nickname, userId }
const clients = new Map();

let wss = null;

/**
 * 初始化 WebSocket 服务器，挂载到 HTTP server 上
 */
export function initWebSocket(httpServer) {
  wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // 从 URL 参数中提取 token 做身份标识
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token') || '';

    clients.set(ws, {
      token,
      connectedAt: Date.now(),
    });

    console.log(`[WS] 客户端已连接 (在线 ${clients.size} 人)`);

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[WS] 客户端已断开 (在线 ${clients.size} 人)`);
    });

    // Ping/pong 保活
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    // 连接时发送当前在线人数
    send(ws, { type: 'connected', online: clients.size });
  });

  // 每 30 秒检测断线客户端
  const interval = setInterval(() => {
    wss.clients.forEach(ws => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(interval));

  console.log('[WS] WebSocket 服务器已就绪');
}

/**
 * 向所有客户端广播事件
 * @param {string} type - 事件类型 (order_added, order_removed, orders_cleared, recipe_added, recipe_updated, recipe_deleted)
 * @param {object} payload - 事件负载
 */
export function broadcast(type, payload = {}) {
  if (!wss) return;

  const message = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });

  let sentCount = 0;
  wss.clients.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
      sentCount++;
    }
  });

  if (sentCount > 0) {
    console.log(`[WS] 广播 ${type} → ${sentCount} 个客户端`);
  }
}

/**
 * 向单个客户端发送消息
 */
export function send(ws, data) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

/**
 * 获取当前在线人数
 */
export function getOnlineCount() {
  return clients.size;
}
