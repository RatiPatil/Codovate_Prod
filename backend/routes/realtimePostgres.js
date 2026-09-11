const express = require('express');

const router = express.Router();

let pool = null;

try {
  const postgres = require('../config/postgres');
  pool = postgres.pool || postgres;
} catch (err) {
  console.error('[RealtimePostgres] PostgreSQL module unavailable:', err.message);
}

function getFirebaseUid(req) {
  return req.user?.uid || req.user?.firebase_uid || req.user?.firebaseUid || null;
}

function requirePool(res) {
  if (!pool || typeof pool.query !== 'function') {
    res.status(503).json({
      message: 'PostgreSQL unavailable.',
      code: 'DATABASE_UNAVAILABLE'
    });
    return false;
  }
  return true;
}

router.get('/health', async (req, res, next) => {
  try {
    if (!requirePool(res)) return;

    const result = await pool.query('SELECT 1 AS ok');

    res.json({
      success: true,
      service: 'realtime',
      database: result.rows[0]?.ok === 1 ? 'connected' : 'unknown'
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    const firebaseUid = getFirebaseUid(req);

    if (!firebaseUid) {
      return res.status(401).json({
        message: 'Authenticated Firebase user not available.',
        code: 'AUTH_USER_MISSING'
      });
    }

    if (!requirePool(res)) return;

    const result = await pool.query(
      `SELECT id, firebase_uid, email, full_name, account_status
       FROM app.users
       WHERE firebase_uid = $1
       LIMIT 1`,
      [firebaseUid]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        message: 'Authenticated PostgreSQL user not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
