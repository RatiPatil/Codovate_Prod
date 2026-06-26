const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

// Get all mentors
router.get("/", auth, async (req, res) => {
  try {
    const mentorsSnapshot = await db.collection("mentors").where("is_active", "==", true).get();
    
    const mentors = await Promise.all(mentorsSnapshot.docs.map(async (doc) => {
      const m = doc.data();
      m.id = doc.id;
      
      const userDoc = await db.collection("users").doc(m.user_id).get();
      if (userDoc.exists) {
        m.name = userDoc.data().name;
        m.email = userDoc.data().email;
      }
      return m;
    }));
    
    res.json(mentors);
  } catch (err) {
    console.error("Get mentors error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Book a mentor
router.post("/:id/book", auth, async (req, res) => {
  const { scheduled_time, notes } = req.body;
  if (!scheduled_time) return res.status(400).json({ message: "Time is required." });

  try {
    const newBookingRef = db.collection("mentor_bookings").doc();
    const booking = {
      id: newBookingRef.id,
      mentor_id: req.params.id,
      student_id: req.user.id,
      scheduled_time,
      notes: notes || "",
      created_at: new Date()
    };
    
    await newBookingRef.set(booking);
    res.json(booking);
  } catch (err) {
    console.error("Book mentor error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Get pending requests for the logged-in mentor
router.get("/requests", auth, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ message: "Mentor access required." });
    }

    const snapshot = await db.collection("mentor_bookings")
      .where("mentor_id", "==", req.user.id)
      .where("status", "==", "pending")
      .get();

    const requests = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const studentDoc = await db.collection("users").doc(data.student_id).get();
      return {
        id: doc.id,
        ...data,
        studentName: studentDoc.exists ? studentDoc.data().name : "Unknown Student"
      };
    }));

    res.json(requests);
  } catch (err) {
    console.error("Get mentor requests error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Update request status (accept/reject)
router.put("/requests/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ message: "Mentor access required." });
    }

    const { status } = req.body; // 'accepted' or 'rejected'
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    await db.collection("mentor_bookings").doc(req.params.id).update({
      status,
      updated_at: new Date()
    });

    res.json({ message: `Request ${status}` });
  } catch (err) {
    console.error("Update request error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
