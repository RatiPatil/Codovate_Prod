const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  if (!["admin", "super_admin", "college_admin", "company_admin"].includes(req.user.role)) return res.status(403).json({ message: "Admin only." });
  try {
    const studentsSnapshot = await db.collection("students").where("is_active", "==", true).get();
    
    const students = studentsSnapshot.docs.map((doc) => {
      const s = doc.data();
      const sp = s.profile_data || {};

      // Safely serialize Firestore Timestamp
      let joinedAt = null;
      if (s.created_at) {
        if (typeof s.created_at.toDate === 'function') {
          joinedAt = s.created_at.toDate().toISOString();
        } else {
          joinedAt = new Date(s.created_at).toISOString();
        }
      }
      
      return {
        id: doc.id,
        name: sp.name || '',
        email: s.email,
        phone: s.phone || '',
        created_at: joinedAt,
        college: sp.college || null,
        branch: sp.branch || null,
        year: sp.year || null,
        skills: sp.skills || [],
        profile_completion: sp.profile_completion || 0,
        onboarding_done: sp.onboarding_completed || false,
        claimed: s.claimed || false
      };
    });

    // Sort by created_at DESC (simulated in memory)
    students.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
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
    const studentDoc = await db.collection("students").doc(req.user.id).get();
    
    if (!studentDoc.exists) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    const s = studentDoc.data();
    const sp = s.profile_data || {};

    res.json({
      id: req.user.id,
      email: s.email,
      phone: s.phone,
      role: s.role || 'student',
      created_at: s.created_at,
      claimed: s.claimed,
      providers: s.providers,
      ...sp // Spread all profile_data fields
    });
  } catch (err) {
    console.error("Get profile error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

router.put("/profile", auth, async (req, res) => {
  const { name, college, branch, year, skills, bio, resume_url, github_url, linkedin_url, avatar_url, desired_roles, achievements, seeking, passionate_about } = req.body;

  try {
    const studentRef = db.collection("students").doc(req.user.id);
    const studentDoc = await studentRef.get();
    if (!studentDoc.exists) return res.status(404).json({ message: "Student record not found." });

    const currentProfileData = studentDoc.data().profile_data || {};

    // Calculate basic profile completion on backend
    let completedFields = 0;
    const totalFields = 8;
    if (name || currentProfileData.name) completedFields++;
    if (college || currentProfileData.college) completedFields++;
    if (branch || currentProfileData.branch) completedFields++;
    if (year || currentProfileData.year) completedFields++;
    if ((skills && skills.length > 0) || (currentProfileData.skills && currentProfileData.skills.length > 0)) completedFields++;
    if (bio || currentProfileData.bio) completedFields++;
    if (resume_url || currentProfileData.resume_url) completedFields++;
    if (github_url || linkedin_url || currentProfileData.github_url || currentProfileData.linkedin_url) completedFields++;
    
    const profile_completion = Math.round((completedFields / totalFields) * 100);

    const updateData = {
      name: name !== undefined ? name : currentProfileData.name,
      college: college !== undefined ? college : currentProfileData.college,
      branch: branch !== undefined ? branch : currentProfileData.branch,
      year: year !== undefined ? year : currentProfileData.year,
      skills: skills !== undefined ? skills : currentProfileData.skills,
      bio: bio !== undefined ? bio : currentProfileData.bio,
      resume_url: resume_url !== undefined ? resume_url : currentProfileData.resume_url,
      github_url: github_url !== undefined ? github_url : currentProfileData.github_url,
      linkedin_url: linkedin_url !== undefined ? linkedin_url : currentProfileData.linkedin_url,
      avatar_url: avatar_url !== undefined ? avatar_url : currentProfileData.avatar_url,
      desired_roles: desired_roles !== undefined ? desired_roles : currentProfileData.desired_roles,
      achievements: achievements !== undefined ? achievements : currentProfileData.achievements,
      seeking: seeking !== undefined ? seeking : currentProfileData.seeking,
      passionate_about: passionate_about !== undefined ? passionate_about : currentProfileData.passionate_about,
      profile_completion
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await studentRef.set({ profile_data: updateData }, { merge: true });

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

    const [appsSnap, teamsSnap, bookingsSnap, studentDoc] = await Promise.all([
      db.collection("applications").where("student_id", "==", uid).get(),
      db.collection("team_members").where("user_id", "==", uid).get(),
      db.collection("mentor_bookings").where("student_id", "==", uid).get(),
      db.collection("students").doc(uid).get(),
    ]);

    // Calculate leaderboard rank
    const allStudentsSnap = await db.collection("students").where("is_active", "==", true).get();
    let userPoints = 0;
    const allPoints = [];

    for (const doc of allStudentsSnap.docs) {
      const s = doc.data();
      const sp = s.profile_data || {};
      const completionPts = (sp.profile_completion || 0) * 10;
      const appsForUser = await db.collection("applications").where("student_id", "==", doc.id).get();
      const appPts = appsForUser.size * 50;
      const teamsForUser = await db.collection("team_members").where("user_id", "==", doc.id).get();
      const teamPts = teamsForUser.size * 100;
      const total = completionPts + appPts + teamPts + (sp.profile_score || 0);
      allPoints.push({ id: doc.id, points: total });
      if (doc.id === uid) userPoints = total;
    }

    allPoints.sort((a, b) => b.points - a.points);
    const rank = allPoints.findIndex(p => p.id === uid) + 1;

    let joinedAt = new Date();
    if (studentDoc.exists) {
      const d = studentDoc.data();
      if (d.created_at) {
        joinedAt = d.created_at.toDate ? d.created_at.toDate() : new Date(d.created_at);
      }
    }
    
    const daysOnPlatform = Math.max(1, Math.ceil((Date.now() - joinedAt.getTime()) / (1000 * 60 * 60 * 24)));

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