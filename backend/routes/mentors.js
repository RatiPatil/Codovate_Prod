const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

// Get all mentors
router.get("/", auth, async (req, res) => {
  try {
    console.log(`[GET /mentors] Fetching mentors for user ${req.user.id}`);
    const mentorsSnapshot = await db.collection("mentors").get();
    console.log(`[GET /mentors] Found ${mentorsSnapshot.size} total mentors in DB.`);
    
    // Filter active mentors in-memory to catch those with status 'active' but missing is_active flag
    const activeDocs = mentorsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.is_active === true || data.status === 'active';
    });
    console.log(`[GET /mentors] Filtered to ${activeDocs.length} active mentors.`);

    const mentors = await Promise.all(activeDocs.map(async (doc) => {
      const m = doc.data();
      m.id = doc.id;
      
      const userDoc = await db.collection("users").doc(m.user_id).get();
      if (userDoc.exists) {
        m.name = userDoc.data().name;
        m.email = userDoc.data().email;
      }
      return m;
    }));
    
    console.log(`[GET /mentors] Returning ${mentors.length} mentors to client.`);
    res.json(mentors);
  } catch (err) {
    console.error("[GET /mentors] Error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Book a mentor
router.post("/:id/book", auth, async (req, res) => {
  const { scheduled_time, mode, topic } = req.body;
  if (!scheduled_time) return res.status(400).json({ message: "Time is required." });

  try {
    const newBookingRef = db.collection("mentor_bookings").doc();
    const booking = {
      id: newBookingRef.id,
      mentor_id: req.params.id,
      student_id: req.user.id,
      student_name: req.user.name || 'Student',
      scheduled_time,
      mode: mode || "Online",
      topic: topic || "",
      created_at: new Date(),
      status: 'Scheduled'
    };
    
    await newBookingRef.set(booking);

    // Notify mentor and student via socket
    if (req.io) {
      req.io.to(`user_${req.user.id}`).emit('new_booking', booking);
      req.io.to(`admin_mentor_${req.params.id}`).emit('new_booking', booking);
    }

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

    const mentorDocs = await db.collection("mentors").where("user_id", "==", req.user.id).get();
    if (mentorDocs.empty) {
      return res.json([]);
    }

    const mentorId = mentorDocs.docs[0].id;

    const snapshot = await db.collection("mentor_bookings")
      .where("mentor_id", "==", mentorId)
      .where("status", "==", "pending")
      .get();

    const requests = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const studentDoc = await db.collection("students").doc(data.student_id).get();
      const s = studentDoc.exists ? studentDoc.data() : {};
      const sp = s.profile_data || {};
      return {
        id: doc.id,
        ...data,
        studentName: sp.name || "Unknown Student"
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

// ── Get user's mentor sessions ──────────────────────────────────────────────
router.get("/my-sessions", auth, async (req, res) => {
  try {
    const snap = await db.collection("mentor_bookings")
      .where("student_id", "==", req.user.id)
      .get();

    const sessions = await Promise.all(snap.docs.map(async (doc) => {
      const b = doc.data();
      let mentorData = { name: "Unknown Mentor", expertise: [], hourly_rate: 0 };
      
      if (b.mentor_id) {
        const mentorDoc = await db.collection("mentors").doc(b.mentor_id).get();
        if (mentorDoc.exists) {
          const md = mentorDoc.data();
          const userDoc = await db.collection("users").doc(md.user_id).get();
          mentorData = {
            name: userDoc.exists ? userDoc.data().name : "Unknown",
            expertise: md.expertise || [],
            hourly_rate: md.hourly_rate || 0,
            bio: md.bio || "",
          };
        }
      }

      return {
        id: doc.id,
        ...b,
        mentor: mentorData,
        scheduled_time: b.scheduled_time || b.created_at, // Fallback
      };
    }));

    // Sort by scheduled time descending
    sessions.sort((a, b) => new Date(b.scheduled_time) - new Date(a.scheduled_time));

    res.json(sessions);
  } catch (err) {
    console.error("Get my sessions error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
