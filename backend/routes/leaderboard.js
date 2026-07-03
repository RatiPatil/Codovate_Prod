const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");

router.get("/", async (req, res) => {
  try {
    const studentsSnapshot = await db.collection("students")
      .where("is_active", "==", true)
      .get();
    
    const students = await Promise.all(studentsSnapshot.docs.map(async (doc) => {
      const s = doc.data();
      const sp = s.profile_data || {};
      
      // Calculate Points
      const completionPoints = (sp.profile_completion || 0) * 10;
      
      const [appsSnap, teamsSnap, mentorsSnap] = await Promise.all([
        db.collection("applications").where("student_id", "==", doc.id).get(),
        db.collection("team_members").where("user_id", "==", doc.id).get(),
        db.collection("mentor_bookings").where("student_id", "==", doc.id).get(),
      ]);

      const appPoints = appsSnap.size * 50;
      const teamPoints = teamsSnap.size * 100;
      const mentorPoints = mentorsSnap.size * 25;
      
      const totalPoints = completionPoints + appPoints + teamPoints + mentorPoints + (sp.profile_score || 0);
      
      // Activity Score calculation (more recent engagement = higher activity)
      // For now, simpler derived score based on dynamic actions
      const activityScore = appPoints + teamPoints + mentorPoints;

      // Badges
      const badges = [];
      if (appsSnap.size >= 3) badges.push('🔥 Top Applicant');
      if (teamsSnap.size >= 2) badges.push('🤝 Team Player');
      if (sp.profile_completion === 100) badges.push('⭐ All-Star');
      
      return {
        id: doc.id,
        name: sp.name || 'Anonymous Student',
        college: sp.college || 'Unknown College',
        skills: sp.skills || [],
        points: totalPoints,
        activity_score: activityScore,
        badges: badges
      };
    }));
    
    // Sort by highest points
    students.sort((a, b) => b.points - a.points);
    
    res.json(students.slice(0, 100)); // Return top 100
  } catch (err) {
    console.error("Leaderboard error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
