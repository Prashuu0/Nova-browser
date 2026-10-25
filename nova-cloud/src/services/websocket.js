const { WebSocketServer } = require('ws');
const { verifyAccessToken } = require('../utils/tokens');

const userSockets = new Map();

function initWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws/sync' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');
    let userId = null;

    try {
      const payload = verifyAccessToken(token);
      userId = payload.sub;
    } catch {
      ws.close(4001, 'Unauthorized');
      return;
    }

    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(ws);

    ws.send(JSON.stringify({ type: 'connected', userId, at: Date.now() }));

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', at: Date.now() }));
        }
        if (msg.type === 'sync:request') {
          broadcastToUser(userId, { type: 'sync:pull-request', from: msg.deviceId, at: Date.now() }, ws);
        }
      } catch {}
    });

    ws.on('close', () => {
      userSockets.get(userId)?.delete(ws);
      if (userSockets.get(userId)?.size === 0) userSockets.delete(userId);
    });
  });

  console.log('[Nova Cloud] WebSocket sync server ready at /ws/sync');
  return wss;
}

function broadcastToUser(userId, message, excludeWs = null) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  const payload = JSON.stringify(message);
  for (const ws of sockets) {
    if (ws !== excludeWs && ws.readyState === 1) {
      ws.send(payload);
    }
  }
}

module.exports = { initWebSocket, broadcastToUser };
