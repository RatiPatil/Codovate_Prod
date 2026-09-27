const express = require('express');
const router = express.Router();

// Public system health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'codovate-api',
    database: 'Cloud Firestore'
  });
});

// Lightweight ping check
router.get('/ping', (req, res) => {
  res.send('pong');
});

module.exports = router;
