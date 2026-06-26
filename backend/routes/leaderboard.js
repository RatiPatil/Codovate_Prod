const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");

router.get("/", async (req, res) => {
  try {
    const usersSnapshot = await db.collection("users")
      .where("role", "==", "student")
      .where("is_active", "==", true)
      .get();
    
    const students = await Promise.all(usersSnapshot.docs.map(async (doc) => {
      const u = doc.data();
      const profileDoc = await db.collection("student_profiles").doc(u.id).get();
      const sp = profileDoc.exists ? profileDoc.data() : {};
      
      // Calculate Activity Points
      // 1. Profile completion gives base points (up to 1000)
      const completionPoints = (sp.profile_completion || 0) * 10;
      
      // 2. Active applications give points
      const appsSnapshot = await db.collection("applications").where("student_id", "==", u.id).get();
      const appPoints = appsSnapshot.size * 50;
      
      const totalPoints = completionPoints + appPoints + (sp.profile_score || 0);
      
      // Generate some badges based on activity
      const badges = [];
      if (appsSnapshot.size >= 3) badges.push('🔥 Top Applicant');
      if (sp.profile_completion === 100) badges.push('⭐ Profile All-Star');
      
      return {
        id: u.id,
        name: u.name,
        college: sp.college || 'Unknown College',
        points: totalPoints,
        badges: badges
      };
    }));
    
    // Sort by highest points
    students.sort((a, b) => b.points - a.points);
    
    res.json(students.slice(0, 50)); // Return top 50
  } catch (err) {
    console.error("Leaderboard error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
