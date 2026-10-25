const express = require('express');
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const SERVERS_FILE = path.join(__dirname, '../../data/vpn-servers.json');

function loadServers() {
  try {
    if (fs.existsSync(SERVERS_FILE)) {
      return JSON.parse(fs.readFileSync(SERVERS_FILE, 'utf8'));
    }
  } catch {}
  return [];
}

router.get('/servers', requireAuth, (_req, res) => {
  const servers = loadServers().map((s) => ({
    id: s.id,
    name: s.name,
    country: s.country,
    city: s.city,
    load: s.load || 0,
    premium: !!s.premium
  }));
  res.json({ servers });
});

router.get('/config/:id', requireAuth, (req, res) => {
  const server = loadServers().find((s) => s.id === req.params.id);
  if (!server?.config) {
    return res.status(404).json({ error: 'Server not found' });
  }
  res.json({
    id: server.id,
    name: server.name,
    config: server.config,
    filename: `${server.id}.conf`
  });
});

module.exports = router;
