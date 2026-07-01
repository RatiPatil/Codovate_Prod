const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  if (!["admin", "super_admin", "college_admin", "company_admin"].includes(req.user.role)) return res.status(403).json({ message: "Admin only." });
  try {
    const usersSnapshot = await db.collection("users").where("role", "==", "student").get();
    
    const students = await Promise.all(usersSnapshot.docs.map(async (doc) => {
      const u = doc.data();
      const profileDoc = await db.collection("student_profiles").doc(u.id).get();
      const sp = profileDoc.exists ? profileDoc.data() : {};

      // Safely serialize Firestore Timestamp
      let joinedAt = null;
      if (u.created_at) {
        if (typeof u.created_at.toDate === 'function') {
          joinedAt = u.created_at.toDate().toISOString();
        } else {
          joinedAt = new Date(u.created_at).toISOString();
        }
      }
      
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        created_at: joinedAt,
        college: sp.college || null,
        branch: sp.branch || null,
        year: sp.year || null,
        skills: sp.skills || [],
        profile_completion: sp.profile_completion || 0,
        onboarding_done: u.onboarding_done || false
      };
    }));

    // Sort by created_at DESC (simulated in memory since Firestore can't do complex joins + sorts easily without composite indexes)
    students.sort((a, b) => {
      const timeA = a.created_at?.toMillis ? a.created_at.toMillis() : new Date(a.created_at).getTime();
      const timeB = b.created_at?.toMillis ? b.created_at.toMillis() : new Date(b.created_at).getTime();
      return timeB - timeA;
    });

    res.json(students);
  } catch (err) {
    console.error("Get all students error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

router.get("/profile", auth, async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found." });
    }

    const u = userDoc.data();
    const profileDoc = await db.collection("student_profiles").doc(req.user.id).get();
    const sp = profileDoc.exists ? profileDoc.data() : {};

    res.json({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      created_at: u.created_at,
      ...sp // Spread all student_profiles fields
    });
  } catch (err) {
    console.error("Get profile error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

router.put("/profile", auth, async (req, res) => {
  const { name, college, branch, year, skills, bio, resume_url, github_url, linkedin_url, avatar_url } = req.body;

  try {
    if (name) {
      await db.collection("users").doc(req.user.id).update({ name });
    }

    // Calculate basic profile completion on backend
    let completedFields = 0;
    const totalFields = 8;
    if (name) completedFields++;
    if (college) completedFields++;
    if (branch) completedFields++;
    if (year) completedFields++;
    if (skills && skills.length > 0) completedFields++;
    if (bio) completedFields++;
    if (resume_url) completedFields++;
    if (github_url || linkedin_url) completedFields++;
    
    const profile_completion = Math.round((completedFields / totalFields) * 100);

    const updateData = {
      college,
      branch,
      year: year || null,
      skills: skills || [],
      bio,
      resume_url,
      github_url,
      linkedin_url,
      avatar_url,
      profile_completion
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await db.collection("student_profiles").doc(req.user.id).set(updateData, { merge: true });

    res.json({ message: "Profile updated successfully." });
  } catch (err) {
    console.error("Update profile error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ── Get recent activity for dashboard ─────────────────────────────────────
router.get("/activity", auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const activities = [];

    // Applications
    const appsSnap = await db.collection("applications").where("student_id", "==", uid).get();
    appsSnap.docs.forEach(doc => {
      const d = doc.data();
      const ts = d.applied_at?.toDate ? d.applied_at.toDate() : new Date(d.applied_at || 0);
      activities.push({ type: 'application', title: `Applied to ${d.title || 'an opportunity'}`, company: d.company, time: ts, icon: '📨' });
    });

    // Team joins
    const teamsSnap = await db.collection("team_members").where("user_id", "==", uid).get();
    for (const doc of teamsSnap.docs) {
      const tm = doc.data();
      const teamDoc = await db.collection("teams").doc(tm.team_id).get();
      const teamName = teamDoc.exists ? teamDoc.data().name : 'a team';
      const ts = tm.joined_at?.toDate ? tm.joined_at.toDate() : new Date(tm.joined_at || 0);
      activities.push({ type: 'team_join', title: `Joined team "${teamName}"`, time: ts, icon: '🤝' });
    }

    // Mentor bookings
    const bookSnap = await db.collection("mentor_bookings").where("student_id", "==", uid).get();
    for (const doc of bookSnap.docs) {
      const b = doc.data();
      const mentorDoc = b.mentor_id ? await db.collection("mentors").doc(b.mentor_id).get() : null;
      let mentorName = 'a mentor';
      if (mentorDoc?.exists) {
        const userDoc = await db.collection("users").doc(mentorDoc.data().user_id).get();
        mentorName = userDoc.exists ? userDoc.data().name : 'a mentor';
      }
      const ts = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at || 0);
      activities.push({ type: 'mentor_booking', title: `Booked session with ${mentorName}`, time: ts, icon: '👨‍🏫' });
    }

    // Sort by most recent
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json(activities.slice(0, 10));
  } catch (err) {
    console.error("Activity error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ── Get aggregated stats for profile ──────────────────────────────────────
router.get("/stats", auth, async (req, res) => {
  try {
    const uid = req.user.id;

    const [appsSnap, teamsSnap, bookingsSnap, userDoc] = await Promise.all([
      db.collection("applications").where("student_id", "==", uid).get(),
      db.collection("team_members").where("user_id", "==", uid).get(),
      db.collection("mentor_bookings").where("student_id", "==", uid).get(),
      db.collection("users").doc(uid).get(),
    ]);

    // Calculate leaderboard rank
    const allUsersSnap = await db.collection("users").where("role", "==", "student").where("is_active", "==", true).get();
    let userPoints = 0;
    const allPoints = [];

    for (const doc of allUsersSnap.docs) {
      const u = doc.data();
      const profileDoc = await db.collection("student_profiles").doc(u.id).get();
      const sp = profileDoc.exists ? profileDoc.data() : {};
      const completionPts = (sp.profile_completion || 0) * 10;
      const appsForUser = await db.collection("applications").where("student_id", "==", u.id).get();
      const appPts = appsForUser.size * 50;
      const teamsForUser = await db.collection("team_members").where("user_id", "==", u.id).get();
      const teamPts = teamsForUser.size * 100;
      const total = completionPts + appPts + teamPts + (sp.profile_score || 0);
      allPoints.push({ id: u.id, points: total });
      if (u.id === uid) userPoints = total;
    }

    allPoints.sort((a, b) => b.points - a.points);
    const rank = allPoints.findIndex(p => p.id === uid) + 1;

    const joinedAt = userDoc.exists ? (userDoc.data().created_at?.toDate ? userDoc.data().created_at.toDate() : new Date(userDoc.data().created_at || Date.now())) : new Date();
    const daysOnPlatform = Math.max(1, Math.ceil((Date.now() - new Date(joinedAt).getTime()) / (1000 * 60 * 60 * 24)));

    res.json({
      applications: appsSnap.size,
      teams: teamsSnap.size,
      mentorSessions: bookingsSnap.size,
      rank: rank || '—',
      points: userPoints,
      daysOnPlatform,
      selected: appsSnap.docs.filter(d => d.data().status === 'Selected').length,
    });
  } catch (err) {
    console.error("Stats error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;