const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const { filter = 'overall', college, course, skill, limit = 50 } = req.query;

    const [usersSnap, profilesSnap, analyticsSnap, careerSnap] = await Promise.all([
      db.collection("users").where("role", "==", "student").where("is_active", "==", true).get(),
      db.collection("profiles").get(),
      db.collection("analytics").get(),
      db.collection("careerProfiles").get()
    ]);

    // Build lookup maps
    const profiles = {};
    profilesSnap.docs.forEach(d => profiles[d.id] = d.data());
    
    const analytics = {};
    analyticsSnap.docs.forEach(d => analytics[d.id] = d.data());
    
    const careers = {};
    careerSnap.docs.forEach(d => careers[d.id] = d.data());

    let students = [];
    usersSnap.docs.forEach((doc) => {
      const u = doc.data();
      const p = profiles[doc.id] || {};
      const a = analytics[doc.id] || {};
      const c = careers[doc.id] || {};

      // Apply filtering
      if (college && p.college !== college) return;
      if (course && p.branch !== course) return;
      if (skill && !(c.skills || []).includes(skill)) return;

      const points = a.profile_score || 0; // Simplified for now
      const profileCompletion = a.profile_completion || 0;
      
      const badges = [];
      if (points > 1000) badges.push({ name: '🏆 Top Performer', color: 'text-yellow-400 bg-yellow-500/10' });
      if (a.placement_score >= 90) badges.push({ name: '🎯 Placement Ready', color: 'text-green-400 bg-green-500/10' });
      if (profileCompletion === 100) badges.push({ name: '⭐ All-Star', color: 'text-blue-400 bg-blue-500/10' });

      students.push({
        id: doc.id,
        name: p.name || u.name || 'Anonymous Student',
        avatar_url: p.avatar_url || null,
        college: p.college || 'Unknown College',
        course: p.branch || 'Unknown Course',
        skills: c.skills || [],
        points: points,
        total_points: points,
        placement_score: a.placement_score || 0,
        profile_completion: profileCompletion,
        streak_count: a.streak_count || 0,
        badges: badges
      });
    });

    // Sort by points DESC
    students.sort((a, b) => b.points - a.points);
    
    // Assign ranks
    students = students.map((s, index) => ({ ...s, rank: index + 1 }));

    // Return top N
    const topStudents = students.slice(0, parseInt(limit));

    // Fetch counts for only the top N students (performance optimization)
    const enrichedStudents = await Promise.all(topStudents.map(async (s) => {
      const [appsSnap, projectsSnap, certsSnap] = await Promise.all([
        db.collection("applications").where("user_id", "==", s.id).count().get(),
        db.collection("projects").where("student_id", "==", s.id).count().get(),
        db.collection("certificates").where("student_id", "==", s.id).count().get()
      ]);
      return {
        ...s,
        applications_count: appsSnap.data().count,
        projects_count: projectsSnap.data().count,
        certificates_count: certsSnap.data().count
      };
    }));

    // Find current user's rank
    let currentUser = students.find(s => s.id === req.user.id);
    if (currentUser) {
      const [appsSnap, projectsSnap, certsSnap] = await Promise.all([
        db.collection("applications").where("user_id", "==", currentUser.id).count().get(),
        db.collection("projects").where("student_id", "==", currentUser.id).count().get(),
        db.collection("certificates").where("student_id", "==", currentUser.id).count().get()
      ]);
      currentUser.applications_count = appsSnap.data().count;
      currentUser.projects_count = projectsSnap.data().count;
      currentUser.certificates_count = certsSnap.data().count;
    }

    res.json({
      leaderboard: enrichedStudents,
      currentUser: currentUser || null,
      totalStudents: students.length
    });

  } catch (err) {
    console.error("Leaderboard error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
