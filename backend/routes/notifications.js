const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

// Get all notifications
router.get("/", auth, async (req, res) => {
  try {
    const [userSnapshot, globalSnapshot] = await Promise.all([
      db.collection("notifications").where("user_id", "==", req.user.id).get(),
      db.collection("notifications").where("is_global", "==", true).where("target_role", "in", ["all", req.user.role || 'student']).get()
    ]);
      
    let notifications = [];
    
    userSnapshot.forEach(doc => {
      const data = doc.data();
      data.id = doc.id;
      notifications.push(data);
    });
    
    globalSnapshot.forEach(doc => {
      const data = doc.data();
      data.id = doc.id;
      data.is_read = true; // For MVP, treat global announcements as read so they don't clutter
      notifications.push(data);
    });
    
    // Sort and limit in memory since we aren't using composite indexes for MVP
    notifications.sort((a, b) => {
      const timeA = a.created_at?.toMillis ? a.created_at.toMillis() : new Date(a.created_at).getTime();
      const timeB = b.created_at?.toMillis ? b.created_at.toMillis() : new Date(b.created_at).getTime();
      return timeB - timeA;
    });
    
    res.json(notifications.slice(0, 20));
  } catch (err) {
    console.error("Get notifications error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Mark as read
router.put("/:id/read", auth, async (req, res) => {
  try {
    const notifRef = db.collection("notifications").doc(req.params.id);
    const notifDoc = await notifRef.get();
    
    if (notifDoc.exists && notifDoc.data().user_id === req.user.id) {
      await notifRef.update({ is_read: true });
    }
    res.json({ message: "Marked as read." });
  } catch (err) {
    console.error("Mark read error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Mark all as read
router.put("/read/all", auth, async (req, res) => {
  try {
    const snapshot = await db.collection("notifications")
      .where("user_id", "==", req.user.id)
      .where("is_read", "==", false)
      .get();
      
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { is_read: true });
    });
    
    await batch.commit();
    res.json({ message: "All marked as read." });
  } catch (err) {
    console.error("Mark all read error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Unread count
router.get("/unread/count", auth, async (req, res) => {
  try {
    const snapshot = await db.collection("notifications")
      .where("user_id", "==", req.user.id)
      .where("is_read", "==", false)
      .get();
      
    res.json({ count: snapshot.size });
  } catch (err) {
    console.error("Unread count error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;