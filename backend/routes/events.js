const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// GET /api/events
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('events').orderBy('date', 'desc').limit(20).get();
    const events = [];
    
    snapshot.forEach(doc => {
      events.push({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate().toISOString() : doc.data().date
      });
    });

    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ message: "Server error fetching events" });
  }
});

module.exports = router;
