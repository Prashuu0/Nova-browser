const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/pool');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/feedback
router.post('/feedback', optionalAuth, async (req, res, next) => {
  try {
    const { email, category, message, rating, appVersion, platform } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message required' });

    await query(
      `INSERT INTO feedback (id, user_id, email, category, message, rating, app_version)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [uuidv4(), req.user?.id || null, email || req.user?.email, category || 'general', message, rating, appVersion]
    );
    res.json({ success: true, message: 'Thank you for your feedback!' });
  } catch (err) {
    next(err);
  }
});

// POST /api/feedback/crash
router.post('/crash', optionalAuth, async (req, res, next) => {
  try {
    const { errorMessage, stackTrace, appVersion, platform, osVersion } = req.body;
    await query(
      `INSERT INTO crash_reports (id, user_id, error_message, stack_trace, app_version, platform, os_version)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [uuidv4(), req.user?.id || null, errorMessage, stackTrace, appVersion, platform, osVersion]
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/feedback/event — analytics event
router.post('/event', optionalAuth, async (req, res, next) => {
  try {
    const { eventType, eventData, appVersion, platform } = req.body;
    if (!eventType) return res.status(400).json({ error: 'eventType required' });
    await query(
      `INSERT INTO analytics_events (id, user_id, event_type, event_data, app_version, platform)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), req.user?.id || null, eventType, JSON.stringify(eventData || {}), appVersion, platform]
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/feedback/analytics — admin dashboard (auth required)
router.get('/analytics', authMiddleware, async (req, res, next) => {
  try {
    const [users, searches, crashes, aiUsage, feedback] = await Promise.all([
      query('SELECT COUNT(*) AS count FROM users'),
      query(`SELECT COUNT(*) AS count FROM search_analytics WHERE created_at > NOW() - INTERVAL '7 days'`),
      query(`SELECT COUNT(*) AS count FROM crash_reports WHERE created_at > NOW() - INTERVAL '7 days'`),
      query(`SELECT COUNT(*) AS count FROM analytics_events WHERE event_type LIKE 'ai:%' AND created_at > NOW() - INTERVAL '7 days'`),
      query(`SELECT COUNT(*) AS count FROM feedback WHERE created_at > NOW() - INTERVAL '7 days'`)
    ]);
    res.json({
      activeUsers: parseInt(users.rows[0].count),
      searchesLast7d: parseInt(searches.rows[0].count),
      crashesLast7d: parseInt(crashes.rows[0].count),
      aiUsageLast7d: parseInt(aiUsage.rows[0].count),
      feedbackLast7d: parseInt(feedback.rows[0].count)
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
