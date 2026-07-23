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
      
      if (m.user_id) {
        const userDoc = await db.collection("users").doc(m.user_id).get();
        if (userDoc.exists) {
          m.name = userDoc.data().name;
          m.email = userDoc.data().email;
        }
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

// AI Mentor Recommendation
router.get("/ai-recommend", auth, async (req, res) => {
  try {
    // Get student profile
    const studentDoc = await db.collection("students").doc(req.user.id).get();
    if (!studentDoc.exists) return res.status(404).json({ message: "Student profile not found" });
    const studentData = studentDoc.data();
    const currentSkills = (studentData.skills || []).map(s => typeof s === 'string' ? s : (s.name || ''));
    const careerGoal = studentData.career_goal || '';

    // Fetch active mentors
    const mentorsSnapshot = await db.collection("mentors").get();
    const activeDocs = mentorsSnapshot.docs.filter(doc => doc.data().is_active === true || doc.data().status === 'active');
    
    if (activeDocs.length === 0) return res.json({ recommended: null });

    const mentors = await Promise.all(activeDocs.map(async (doc) => {
      const m = doc.data();
      m.id = doc.id;
      if (m.user_id) {
        const userDoc = await db.collection("users").doc(m.user_id).get();
        if (userDoc.exists) {
          m.name = userDoc.data().name;
        }
      }
      return m;
    }));

    // Define AI payload
    const { model } = require("../utils/aiConfig");
    const prompt = `
    You are an AI Mentor Matchmaker.
    Student Profile:
    - Career Goal: ${careerGoal}
    - Current Skills: ${currentSkills.join(', ')}

    Available Mentors:
    ${JSON.stringify(mentors.map(m => ({ id: m.id, name: m.name, expertise: m.expertise, years_of_experience: m.years_of_experience, rating: m.rating, company: m.company, designation: m.designation })), null, 2)}

    Based on what the student is learning and their career goal, pick the SINGLE best mentor for them.
    Return ONLY a valid JSON object in this exact shape:
    {
      "mentor_id": "mentor_id_string",
      "reasoning": "You are learning [Skill]. We recommend [Mentor Name] because [reason]."
    }
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.startsWith("\`\`\`json")) text = text.slice(7, -3);
    else if (text.startsWith("\`\`\`")) text = text.slice(3, -3);

    const aiMatch = JSON.parse(text);
    const recommendedMentor = mentors.find(m => m.id === aiMatch.mentor_id);
    
    if (recommendedMentor) {
      recommendedMentor.ai_reasoning = aiMatch.reasoning;
      res.json({ recommended: recommendedMentor });
    } else {
      res.json({ recommended: null });
    }
  } catch (err) {
    console.error("AI Recommend Mentor Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Book a mentor
router.post("/:id/book", auth, async (req, res) => {
  const { scheduled_time, mode, topic } = req.body;
  if (!scheduled_time) return res.status(400).json({ message: "Time is required." });
  if (!topic || topic.trim().length < 10) return res.status(400).json({ message: "Topic must be at least 10 characters long." });

  try {
    // Check for scheduling conflicts
    const conflict = await db.collection("mentorSessions")
      .where("mentor_id", "==", req.params.id)
      .where("scheduled_time", "==", scheduled_time)
      .where("status", "in", ["Pending", "Scheduled"])
      .get();
      
    if (!conflict.empty) {
      return res.status(409).json({ message: "This time slot is already booked. Please choose another time." });
    }
    const newBookingRef = db.collection("mentorSessions").doc();
    const booking = {
      id: newBookingRef.id,
      mentor_id: req.params.id,
      student_id: req.user.id,
      student_name: req.user.name || 'Student',
      scheduled_time,
      duration: parseInt(req.body.duration) || 30,
      mode: mode || "Online",
      topic: topic || "",
      meeting_link: mode !== 'Offline' ? `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}` : null,
      created_at: new Date(),
      status: 'Pending'
    };
    
    await newBookingRef.set(booking);

    // Notify mentor and student via socket
    if (req.io) {
      req.io.to(`user_${req.user.id}`).emit('new_booking', booking);
      const mDoc = await db.collection("mentors").doc(req.params.id).get();
      if (mDoc.exists && mDoc.data().user_id) {
        req.io.to(`admin_mentor_${mDoc.data().user_id}`).emit('new_booking', booking);
      }
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

    const snapshot = await db.collection("mentorSessions")
      .where("mentor_id", "==", mentorId)
      .where("status", "==", "Pending")
      .get();

    const requests = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const studentDoc = await db.collection("profiles").doc(data.student_id).get();
      const s = studentDoc.exists ? studentDoc.data() : {};
      const userDoc = await db.collection("users").doc(data.student_id).get();
      const u = userDoc.exists ? userDoc.data() : {};
      return {
        id: doc.id,
        ...data,
        studentName: s.personalInfo?.name || u.name || "Unknown Student"
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

    const newStatus = status === 'accepted' ? 'Scheduled' : 'Cancelled';

    const bookingRef = db.collection("mentorSessions").doc(req.params.id);
    await bookingRef.update({
      status: newStatus,
      updated_at: new Date()
    });

    const updatedDoc = (await bookingRef.get()).data();
    
    if (req.io && status === 'accepted') {
      req.io.to(`user_${updatedDoc.student_id}`).emit('student_booking_confirmed', {
        mentorName: req.user.name || 'Your mentor',
        ...updatedDoc
      });
    }

    res.json({ message: `Request ${status}` });
  } catch (err) {
    console.error("Update request error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ── Get user's mentor sessions ──────────────────────────────────────────────
router.get("/my-sessions", auth, async (req, res) => {
  try {
    const snap = await db.collection("mentorSessions")
      .where("student_id", "==", req.user.id)
      .get();

    const sessions = await Promise.all(snap.docs.map(async (doc) => {
      const b = doc.data();
      let mentorData = { name: "Unknown Mentor", expertise: [], hourly_rate: 0 };
      
      if (b.mentor_id) {
        const mentorDoc = await db.collection("mentors").doc(b.mentor_id).get();
        if (mentorDoc.exists) {
          const md = mentorDoc.data();
          let name = "Unknown";
          if (md.user_id) {
            const userDoc = await db.collection("users").doc(md.user_id).get();
            name = userDoc.exists ? userDoc.data().name : "Unknown";
          }
          mentorData = {
            name,
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

// Follow/Unfollow a mentor
router.post("/:id/follow", auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const mentorId = req.params.id;
    
    const followRef = db.collection("mentor_followers").doc(`${studentId}_${mentorId}`);
    const doc = await followRef.get();
    
    if (doc.exists) {
      // Unfollow
      await followRef.delete();
      res.json({ message: "Unfollowed mentor", isFollowing: false });
    } else {
      // Follow
      await followRef.set({
        student_id: studentId,
        mentor_id: mentorId,
        created_at: new Date()
      });
      res.json({ message: "Following mentor", isFollowing: true });
    }
  } catch (err) {
    console.error("Follow mentor error:", err);
    res.status(500).json({ message: "Server error." });
  }
});
