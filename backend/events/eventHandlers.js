const { query } = require('../config/postgres');

async function recordEvent(eventType, userId = null, payload = {}) {
  try {
    const candidates = [
      ['analytics_events', 'user_id'],
      ['audit_logs', 'user_id']
    ];

    for (const [table, userColumn] of candidates) {
      try {
        if (table === 'analytics_events') {
          await query(
            `INSERT INTO app.analytics_events (user_id, event_type, metadata, created_at)
             VALUES ($1, $2, $3::jsonb, NOW())`,
            [userId, eventType, JSON.stringify(payload)]
          );
          return true;
        }

        if (table === 'audit_logs') {
          await query(
            `INSERT INTO app.audit_logs (user_id, action, details, created_at)
             VALUES ($1, $2, $3::jsonb, NOW())`,
            [userId, eventType, JSON.stringify(payload)]
          );
          return true;
        }
      } catch (err) {
        continue;
      }
    }

    return false;
  } catch (err) {
    console.error('❌ Event recording error:', err.message);
    return false;
  }
}

async function initializeEventHandlers(io) {
  console.log('✅ PostgreSQL event handlers initialized');

  if (!io) return;

  io.on('connection', socket => {
    socket.on('codovate:event', async event => {
      try {
        const userId = socket.user?.id || socket.user?.uid || null;
        const type = event?.type || 'unknown';
        const payload = event?.payload || {};

        await recordEvent(type, userId, payload);

        socket.emit('codovate:event:ack', {
          success: true,
          type,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('❌ Realtime event error:', err.message);
        socket.emit('codovate:event:ack', {
          success: false,
          error: 'Event processing failed'
        });
      }
    });
  });
}

module.exports = {
  initializeEventHandlers,
  recordEvent
};
