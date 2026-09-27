// NOTE: Event recording writes to the Firestore `auditLogs` collection,
// consistent with the auditLog.js middleware.

const { db } = require('../config/firebase');

async function recordEvent(eventType, userId = null, payload = {}) {
  try {
    await db.collection('auditLogs').add({
      action: eventType,
      userId: userId,
      details: payload,
      source: 'socket',
      timestamp: new Date(),
    });
    return true;
  } catch (err) {
    console.error('Event recording error:', err.message);
    return false;
  }
}

async function initializeEventHandlers(io) {
  console.log('Firestore event handlers initialized');

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
        console.error('Realtime event error:', err.message);
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
