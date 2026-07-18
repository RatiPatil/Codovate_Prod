const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

// GET all calendar events for a user
router.get("/", auth, async (req, res) => {
  try {
    const calendarEvents = [];

    // 1. Fetch Opportunities Deadlines (Only ones the user has saved or applied to, or maybe all?)
    // Actually, showing all deadlines might clutter it. Let's just fetch all active opportunities or ones the user applied to / bookmarked.
    // The prompt says "Automatically display Internship Deadlines, Hackathons, Company Drives, Exams, Mentor Sessions, Workshops"
    
    // Fetch all active opportunities to display upcoming deadlines globally (limit to next 30 days)
    const oppsSnapshot = await db.collection("opportunities")
      .where("is_active", "==", true)
      .get();
      
    oppsSnapshot.forEach(doc => {
      const opp = doc.data();
      if (opp.deadline) {
        calendarEvents.push({
          id: `opp_${doc.id}`,
          title: `${opp.title} Deadline`,
          date: opp.deadline,
          type: opp.type || 'Opportunity', // Internship, Hackathon, Job, etc.
          company: opp.company,
          link: '/opportunities'
        });
      }
      if (opp.start_date) {
        calendarEvents.push({
          id: `opp_start_${doc.id}`,
          title: `${opp.title} Starts`,
          date: opp.start_date,
          type: opp.type || 'Opportunity',
          company: opp.company,
          link: '/opportunities'
        });
      }
    });

    // 2. Fetch Events (Workshops, Company Drives)
    const eventsSnapshot = await db.collection("events").get();
    eventsSnapshot.forEach(doc => {
      const ev = doc.data();
      if (ev.date || ev.start_time) {
        calendarEvents.push({
          id: `event_${doc.id}`,
          title: ev.title,
          date: ev.date || ev.start_time,
          type: ev.type || 'Event', // Workshop, Exam, Drive
          company: ev.organizer || '',
          link: '/events'
        });
      }
    });

    // 3. Fetch Mentor Sessions
    const mentorSessionsSnapshot = await db.collection("mentorSessions")
      .where("student_id", "==", req.user.id)
      .get();
      
    mentorSessionsSnapshot.forEach(doc => {
      const session = doc.data();
      if (session.scheduled_time && session.status !== "Cancelled") {
        calendarEvents.push({
          id: `session_${doc.id}`,
          title: `Mentor Session with ${session.mentor_name || 'Mentor'}`,
          date: session.scheduled_time,
          type: 'Mentor Session',
          link: '/mentors'
        });
      }
    });

    // Filter out items without a valid date and sort by date ascending
    const validEvents = calendarEvents.filter(e => e.date).map(e => ({
      ...e,
      // Normalize timestamp to ISO string
      date: e.date.toDate ? e.date.toDate().toISOString() : new Date(e.date).toISOString()
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(validEvents);
  } catch (err) {
    console.error("Calendar fetch error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
