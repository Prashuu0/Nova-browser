require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { errorHandler } = require('./middleware/errorHandler');
const { initWebSocket } = require('./services/websocket');
const { pool } = require('./db/pool');

const authRoutes = require('./routes/auth');
const syncRoutes = require('./routes/sync');
const searchRoutes = require('./routes/search');
const extensionRoutes = require('./routes/extensions');
const feedbackRoutes = require('./routes/feedback');
const driveRoutes = require('./routes/drive');
const emailRoutes = require('./routes/email');
const vpnRoutes = require('./routes/vpn');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 200, standardHeaders: true }));

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'nova-cloud', version: '1.0.0', time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', error: 'Database unavailable' });
  }
});

app.get('/', (_req, res) => {
  res.json({
    name: 'Nova Cloud API',
    version: '1.0.0',
    docs: '/api',
    admin: '/admin',
    endpoints: {
      auth: '/api/auth',
      sync: '/api/sync',
      search: '/api/search',
      extensions: '/api/extensions',
      feedback: '/api/feedback',
      drive: '/api/drive',
      email: '/api/email',
      vpn: '/api/vpn',
      websocket: '/ws/sync'
    }
  });
});

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/extensions', extensionRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/drive', driveRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/vpn', vpnRoutes);

app.use(errorHandler);

const server = http.createServer(app);
initWebSocket(server);

server.listen(config.port, () => {
  console.log(`[Nova Cloud] API running on http://localhost:${config.port}`);
  console.log(`[Nova Cloud] Admin dashboard: http://localhost:${config.port}/admin`);
});

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});
