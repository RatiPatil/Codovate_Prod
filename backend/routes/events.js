const express = require('express');
const router = express.Router();
const { db, FieldValue } = require('../config/firebase');
const auth = require('../middleware/auth');
const admin = require('firebase-admin');

// GET /api/events
router.get('/', auth, async (req, res) => {
  try {
    const snapshot = await db.collection('events').orderBy('date', 'desc').limit(50).get();
    const events = [];
    
    // Also fetch saved events and rsvp status for the user
    const userDoc = await db.collection('students').doc(req.user.id).get();
    const savedEvents = userDoc.data()?.saved_events || [];
    const rsvpEvents = userDoc.data()?.rsvp_events || [];
    
    snapshot.forEach(doc => {
      events.push({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate().toISOString() : doc.data().date,
        is_saved: savedEvents.includes(doc.id),
        is_rsvp: rsvpEvents.includes(doc.id)
      });
    });

    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ message: "Server error fetching events" });
  }
});

// POST /api/events/:id/rsvp
router.post('/:id/rsvp', auth, async (req, res) => {
  try {
    const eventRef = db.collection('events').doc(req.params.id);
    const userRef = db.collection('students').doc(req.user.id);
    
    const [eventDoc, userDoc] = await Promise.all([eventRef.get(), userRef.get()]);
    if (!eventDoc.exists) return res.status(404).json({ message: "Event not found" });
    
    const rsvpEvents = userDoc.data()?.rsvp_events || [];
    const isRSVP = rsvpEvents.includes(req.params.id);
    
    if (isRSVP) {
      // Un-RSVP
      await eventRef.update({ attendees: FieldValue.increment(-1) });
      await userRef.update({ rsvp_events: FieldValue.arrayRemove(req.params.id) });
      res.json({ message: "RSVP cancelled", is_rsvp: false });
    } else {
      // RSVP
      await eventRef.update({ attendees: FieldValue.increment(1) });
      await userRef.update({ rsvp_events: FieldValue.arrayUnion(req.params.id) });
      
      // Also log Activity Feed
      await db.collection("activityLogs").add({
        uid: req.user.id,
        type: "event_rsvp",
        title: `Registered for ${eventDoc.data().title}`,
        createdAt: new Date()
      });
      
      res.json({ message: "RSVP successful", is_rsvp: true });
    }
  } catch (err) {
    console.error("RSVP error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/events/:id/save
router.post('/:id/save', auth, async (req, res) => {
  try {
    const userRef = db.collection('students').doc(req.user.id);
    const userDoc = await userRef.get();
    
    const savedEvents = userDoc.data()?.saved_events || [];
    const isSaved = savedEvents.includes(req.params.id);
    
    if (isSaved) {
      await userRef.update({ saved_events: FieldValue.arrayRemove(req.params.id) });
      res.json({ message: "Event removed from saved list", is_saved: false });
    } else {
      await userRef.update({ saved_events: FieldValue.arrayUnion(req.params.id) });
      res.json({ message: "Event saved", is_saved: true });
    }
  } catch (err) {
    console.error("Save event error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
