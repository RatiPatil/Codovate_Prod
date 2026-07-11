const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const { filter = 'overall', college, course, skill, limit = 50 } = req.query;

    let query = db.collection("students").where("is_active", "==", true);

    // Apply filtering
    if (college) query = query.where("profile_data.college", "==", college);
    if (course) query = query.where("profile_data.branch", "==", course);
    if (skill) query = query.where("profile_data.skills", "array-contains", skill);

    // Sort based on timeframe
    let sortField = "total_points";
    if (filter === "weekly") sortField = "weekly_points";
    else if (filter === "monthly") sortField = "monthly_points";

    // Firestore requires an index if combining where and orderBy on different fields.
    // For simplicity, we fetch them and sort manually if there are many filters, 
    // OR we use orderBy if it's just the basic query.
    // Assuming we have basic indexes or we just sort in memory if the dataset isn't huge.
    // To be perfectly robust for thousands without complex composite indexes on every combination, 
    // we fetch filtered and sort in memory if filters are applied, or rely on orderBy if no filters.

    const studentsSnapshot = await query.get();

    let students = studentsSnapshot.docs.map((doc) => {
      const s = doc.data();
      const sp = s.profile_data || {};

      const points = s[sortField] || 0;
      
      // Calculate dynamic badges based on existing scores
      const badges = [];
      if (points > 1000) badges.push({ name: '🏆 Top Performer', color: 'text-yellow-400 bg-yellow-500/10' });
      if (s.placement_score >= 90) badges.push({ name: '🎯 Placement Ready', color: 'text-green-400 bg-green-500/10' });
      if (sp.profile_completion === 100) badges.push({ name: '⭐ All-Star', color: 'text-blue-400 bg-blue-500/10' });
      if (s.streak_count >= 7) badges.push({ name: '🔥 Consistency Star', color: 'text-orange-400 bg-orange-500/10' });

      return {
        id: doc.id,
        name: sp.name || 'Anonymous Student',
        avatar_url: sp.avatar_url || null,
        college: sp.college || 'Unknown College',
        course: sp.branch || 'Unknown Course',
        skills: sp.skills || [],
        points: points,
        total_points: s.total_points || 0,
        placement_score: s.placement_score || 0,
        profile_completion: sp.profile_completion || 0,
        streak_count: s.streak_count || 0,
        badges: badges
      };
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
        db.collection("applications").where("user_id", "==", s.id).get(),
        db.collection("projects").where("student_id", "==", s.id).get(),
        db.collection("certificates").where("student_id", "==", s.id).get()
      ]);
      return {
        ...s,
        applications_count: appsSnap.size,
        projects_count: projectsSnap.size,
        certificates_count: certsSnap.size
      };
    }));

    // Find current user's rank
    let currentUser = students.find(s => s.id === req.user.id);
    if (currentUser) {
      const [appsSnap, projectsSnap, certsSnap] = await Promise.all([
        db.collection("applications").where("user_id", "==", currentUser.id).get(),
        db.collection("projects").where("student_id", "==", currentUser.id).get(),
        db.collection("certificates").where("student_id", "==", currentUser.id).get()
      ]);
      currentUser.applications_count = appsSnap.size;
      currentUser.projects_count = projectsSnap.size;
      currentUser.certificates_count = certsSnap.size;
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
