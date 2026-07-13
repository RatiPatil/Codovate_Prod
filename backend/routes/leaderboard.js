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
    // If filters are applied, orderBy might fail without composite indexes.
    // To gracefully degrade, if no filters, use native orderBy limit for instant performance.
    // If filters are used, we fallback to memory sorting, BUT this will be rare.
    let studentsSnapshot;
    const hasFilters = college || course || skill;
    
    if (!hasFilters) {
      // 🚀 FAST PATH: No filters, rely entirely on native indexing and limiting!
      query = query.orderBy(sortField, "desc").limit(parseInt(limit));
      studentsSnapshot = await query.get();
    } else {
      // 🐢 SLOW PATH: Filters applied, might need memory sort if composite indexes are missing
      studentsSnapshot = await query.get();
    }

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

    if (hasFilters) {
      // Sort in memory only if filters were applied
      students.sort((a, b) => b.points - a.points);
      students = students.slice(0, parseInt(limit));
    }
    
    // Assign ranks
    students = students.map((s, index) => ({ ...s, rank: index + 1 }));

    // Fetch counts for only the top N students (performance optimization)
    // NOTE: Using Promise.all to fetch apps, projects, certs for Top 50 is okay, 
    // but caching these on the student doc in the future would be even better.
    const enrichedStudents = await Promise.all(students.map(async (s) => {
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

    // Find current user's rank globally (not just in the Top 50)
    let currentUser = enrichedStudents.find(s => s.id === req.user.id);
    
    if (!currentUser) {
      // Current user is not in the Top 50, fetch them explicitly
      const userDoc = await db.collection("students").doc(req.user.id).get();
      if (userDoc.exists) {
        const u = userDoc.data();
        const uPoints = u[sortField] || 0;
        
        let uRank = '—';
        try {
          const higher = await db.collection("students")
            .where("is_active", "==", true)
            .where(sortField, ">", uPoints)
            .count()
            .get();
          uRank = higher.data().count + 1;
        } catch(e) {
          // Ignore count error
        }
        
        const [appsSnap, projectsSnap, certsSnap] = await Promise.all([
          db.collection("applications").where("user_id", "==", req.user.id).get(),
          db.collection("projects").where("student_id", "==", req.user.id).get(),
          db.collection("certificates").where("student_id", "==", req.user.id).get()
        ]);
        
        currentUser = {
          id: req.user.id,
          name: u.profile_data?.name || 'Anonymous Student',
          points: uPoints,
          total_points: u.total_points || 0,
          rank: uRank,
          applications_count: appsSnap.size,
          projects_count: projectsSnap.size,
          certificates_count: certsSnap.size
        };
      }
    }

    res.json({
      leaderboard: enrichedStudents,
      currentUser: currentUser || null,
      totalStudents: enrichedStudents.length // Just return the loaded size to save a query
    });

  } catch (err) {
    console.error("Leaderboard error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
