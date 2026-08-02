const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const { mapDoc } = require("../utils/firestoreMapper");

// ─── GET /api/public/stats ────────────────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const [oppsCount, teamsCount, usersCount, coursesCount] = await Promise.all([
      db.collection("opportunities").where("is_active", "==", true).count().get().catch(() => ({ data: () => ({ count: 0 }) })),
      db.collection("teams").where("status", "==", "Recruiting").count().get().catch(() => ({ data: () => ({ count: 0 }) })),
      db.collection("users").where("role", "==", "student").count().get().catch(() => ({ data: () => ({ count: 0 }) })),
      db.collection("courses").count().get().catch(() => ({ data: () => ({ count: 0 }) })),
    ]);

    res.json({
      opportunities: oppsCount.data().count || 0,
      teams: teamsCount.data().count || 0,
      students: usersCount.data().count || 0,
      courses: coursesCount.data().count || 0
    });
  } catch (err) {
    console.error("Public stats error:", err.message);
    res.json({ opportunities: 0, teams: 0, students: 0, courses: 0 });
  }
});

// ─── GET /api/public/opportunities ───────────────────────────────────────────
router.get("/opportunities", async (req, res) => {
  try {
    const snapshot = await db.collection("opportunities")
      .where("is_active", "==", true)
      .limit(3)
      .get();

    const opportunities = snapshot.docs.map(doc => {
      const data = mapDoc(doc);
      return {
        id: doc.id,
        title: data.title || "Software Engineering Intern",
        company: data.company || "Codovate Partner",
        location: data.location || "Remote",
        type: data.type || "Internship",
        salary: data.salary || data.stipend || "Competitive",
        required_skills: (data.required_skills || ["React", "Node.js"]).slice(0, 3),
        created_at: data.created_at || new Date()
      };
    });

    res.json(opportunities);
  } catch (err) {
    console.error("Public opportunities preview error:", err.message);
    res.json([]);
  }
});

module.exports = router;
