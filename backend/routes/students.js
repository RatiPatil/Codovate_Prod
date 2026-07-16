const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");
const { awardPoints, updatePlacementScore } = require("../utils/scoring");

router.get("/", auth, async (req, res) => {
  if (!["admin", "super_admin", "college_admin", "company_admin"].includes(req.user.role)) return res.status(403).json({ message: "Admin only." });
  try {
    const [profilesSnap, usersSnap, analyticsSnap, careerSnap] = await Promise.all([
      db.collection("profiles").get(),
      db.collection("users").where("role", "==", "student").get(),
      db.collection("analytics").get(),
      db.collection("careerProfiles").get()
    ]);

    const profiles = {};
    profilesSnap.docs.forEach(d => profiles[d.id] = d.data());
    
    const analytics = {};
    analyticsSnap.docs.forEach(d => analytics[d.id] = d.data());
    
    const careers = {};
    careerSnap.docs.forEach(d => careers[d.id] = d.data());

    const students = usersSnap.docs.map(doc => {
      const u = doc.data();
      const p = profiles[doc.id] || {};
      const a = analytics[doc.id] || {};
      const c = careers[doc.id] || {};

      let joinedAt = null;
      if (u.createdAt) {
        if (typeof u.createdAt.toDate === 'function') {
          joinedAt = u.createdAt.toDate().toISOString();
        } else {
          joinedAt = new Date(u.createdAt).toISOString();
        }
      }
      
      return {
        id: doc.id,
        name: p.name || u.name || '',
        email: u.email || '',
        phone: u.phone || '',
        created_at: joinedAt,
        college: p.college || null,
        branch: p.branch || null,
        year: p.year || null,
        skills: c.skills || [],
        profile_completion: a.profile_completion || 0,
        onboarding_done: a.onboarding_completed || false,
        claimed: u.claimed || false
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
    const uid = req.user.id;
    const [userDoc, profileDoc, careerDoc, analyticsDoc] = await Promise.all([
      db.collection("users").doc(uid).get(),
      db.collection("profiles").doc(uid).get(),
      db.collection("careerProfiles").doc(uid).get(),
      db.collection("analytics").doc(uid).get()
    ]);
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found." });
    }

    const u = userDoc.data();
    const p = profileDoc.exists ? profileDoc.data() : {};
    const c = careerDoc.exists ? careerDoc.data() : {};
    const a = analyticsDoc.exists ? analyticsDoc.data() : {};

    res.json({
      id: uid,
      email: u.email,
      phone: u.phone,
      role: u.role || 'student',
      created_at: u.createdAt,
      claimed: u.claimed,
      providers: u.providers,
      // Spread profile and career data
      ...p,
      ...c,
      // Specific analytics
      profile_completion: a.profile_completion || 0,
      profile_score: a.profile_score || 0
    });
  } catch (err) {
    console.error("Get profile error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

router.put("/profile", auth, async (req, res) => {
  const { name, college, branch, year, bio, resume_url, github_url, linkedin_url, avatar_url, skills, desired_roles, achievements, seeking, passionate_about, projects, certificates } = req.body;

  try {
    const uid = req.user.id;
    const profileRef = db.collection("profiles").doc(uid);
    const careerRef = db.collection("careerProfiles").doc(uid);
    const analyticsRef = db.collection("analytics").doc(uid);
    
    const [profileDoc, careerDoc, analyticsDoc] = await Promise.all([
      profileRef.get(),
      careerRef.get(),
      analyticsRef.get()
    ]);
    
    const currentProfile = profileDoc.exists ? profileDoc.data() : {};
    const currentCareer = careerDoc.exists ? careerDoc.data() : {};
    
    // Group fields for profiles
    const profileUpdates = {
      name: name !== undefined ? name.trim().toUpperCase() : currentProfile.name,
      college: college !== undefined ? college : currentProfile.college,
      branch: branch !== undefined ? branch : currentProfile.branch,
      year: year !== undefined ? year : currentProfile.year,
      bio: bio !== undefined ? bio : currentProfile.bio,
      resume_url: resume_url !== undefined ? resume_url : currentProfile.resume_url,
      github_url: github_url !== undefined ? github_url : currentProfile.github_url,
      linkedin_url: linkedin_url !== undefined ? linkedin_url : currentProfile.linkedin_url,
      avatar_url: avatar_url !== undefined ? avatar_url : currentProfile.avatar_url
    };
    
    // Group fields for careerProfiles
    const careerUpdates = {
      skills: skills !== undefined ? skills : currentCareer.skills,
      desired_roles: desired_roles !== undefined ? desired_roles : currentCareer.desired_roles,
      achievements: achievements !== undefined ? achievements : currentCareer.achievements,
      seeking: seeking !== undefined ? seeking : currentCareer.seeking,
      passionate_about: passionate_about !== undefined ? passionate_about : currentCareer.passionate_about,
      projects: projects !== undefined ? projects : currentCareer.projects,
      certificates: certificates !== undefined ? certificates : currentCareer.certificates
    };
    
    // Remove undefined fields
    Object.keys(profileUpdates).forEach(key => profileUpdates[key] === undefined && delete profileUpdates[key]);
    Object.keys(careerUpdates).forEach(key => careerUpdates[key] === undefined && delete careerUpdates[key]);

    // Calculate basic profile completion on backend
    let completedFields = 0;
    const totalFields = 10;
    if (profileUpdates.name) completedFields++;
    if (profileUpdates.college) completedFields++;
    if (profileUpdates.branch) completedFields++;
    if (profileUpdates.year) completedFields++;
    if (careerUpdates.skills && careerUpdates.skills.length > 0) completedFields++;
    if (profileUpdates.bio) completedFields++;
    if (profileUpdates.resume_url) completedFields++;
    if (profileUpdates.github_url || profileUpdates.linkedin_url) completedFields++;
    if (careerUpdates.projects && careerUpdates.projects.length > 0) completedFields++;
    if (careerUpdates.certificates && careerUpdates.certificates.length > 0) completedFields++;
    
    const profile_completion = Math.round((completedFields / totalFields) * 100);

    const batch = db.batch();
    batch.set(profileRef, profileUpdates, { merge: true });
    batch.set(careerRef, careerUpdates, { merge: true });
    batch.set(analyticsRef, { profile_completion }, { merge: true });
    
    // Check if name changed to sync with users
    if (name !== undefined && name.trim().toUpperCase() !== currentProfile.name) {
      batch.update(db.collection("users").doc(uid), { name: name.trim().toUpperCase() });
    }
    
    await batch.commit();

    // Scoring Engine Integration
    if (profile_completion === 100) {
      await awardPoints(uid, 'profile_complete', 100);
    }
    if (profileUpdates.resume_url && !currentProfile.resume_url) {
      await awardPoints(uid, 'resume_upload', 50);
    }
    
    // Update Placement Score
    await updatePlacementScore(uid);

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
    const bookSnap = await db.collection("mentorSessions").where("student_id", "==", uid).get();
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

    const [appsSnap, teamsSnap, bookingsSnap, userDoc, analyticsDoc] = await Promise.all([
      db.collection("applications").where("student_id", "==", uid).get(),
      db.collection("team_members").where("user_id", "==", uid).get(),
      db.collection("mentorSessions").where("student_id", "==", uid).get(),
      db.collection("users").doc(uid).get(),
      db.collection("analytics").doc(uid).get()
    ]);

    // Calculate leaderboard rank
    const allUsersSnap = await db.collection("users").where("role", "==", "student").where("is_active", "==", true).get();
    let userPoints = 0;
    const allPoints = [];

    for (const doc of allUsersSnap.docs) {
      const aDoc = await db.collection("analytics").doc(doc.id).get();
      const a = aDoc.exists ? aDoc.data() : {};
      
      const completionPts = (a.profile_completion || 0) * 10;
      const appsForUser = await db.collection("applications").where("student_id", "==", doc.id).get();
      const appPts = appsForUser.size * 50;
      const teamsForUser = await db.collection("team_members").where("user_id", "==", doc.id).get();
      const teamPts = teamsForUser.size * 100;
      const total = completionPts + appPts + teamPts + (a.profile_score || 0);
      allPoints.push({ id: doc.id, points: total });
      if (doc.id === uid) userPoints = total;
    }

    allPoints.sort((a, b) => b.points - a.points);
    const rank = allPoints.findIndex(p => p.id === uid) + 1;

    let joinedAt = new Date();
    if (userDoc.exists) {
      const d = userDoc.data();
      if (d.createdAt) {
        joinedAt = d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt);
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

// ── Dashboard V4 Workspace Data ──────────────────────────────────────
router.get("/workspace", auth, async (req, res) => {
  try {
    const uid = req.user.id;
    
    const [userDoc, profileDoc, careerDoc, analyticsDoc] = await Promise.all([
      db.collection("users").doc(uid).get(),
      db.collection("profiles").doc(uid).get(),
      db.collection("careerProfiles").doc(uid).get(),
      db.collection("analytics").doc(uid).get()
    ]);
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found." });
    }

    const u = userDoc.data();
    const p = profileDoc.exists ? profileDoc.data() : {};
    const c = careerDoc.exists ? careerDoc.data() : {};
    const a = analyticsDoc.exists ? analyticsDoc.data() : {};

    // 1. Fetch Real Data Counts
    const [appsSnap, teamsSnap, bookingsSnap] = await Promise.all([
      db.collection("applications").where("student_id", "==", uid).get(),
      db.collection("team_members").where("user_id", "==", uid).get(),
      db.collection("mentorSessions").where("student_id", "==", uid).get(),
    ]);

    const appsCount = appsSnap.size;
    const teamsCount = teamsSnap.size;
    const mentorsCount = bookingsSnap.size;

    // Calculate real points based on stats
    const profilePoints = (a.profile_completion || 0) * 10;
    const appPoints = appsCount * 50;
    const teamPoints = teamsCount * 100;
    const totalPoints = profilePoints + appPoints + teamPoints + (a.profile_score || 0);

    // 2. Real Actionable Tasks (Today's Focus)
    const tasks = [];
    if (!p.resume_url) {
      tasks.push({ id: 'resume', title: 'Upload Resume', type: 'profile', actionUrl: '/profile' });
    }
    if ((a.profile_completion || 0) < 100) {
      tasks.push({ id: 'profile', title: 'Complete Profile Details', type: 'profile', actionUrl: '/profile' });
    }
    if (appsCount === 0) {
      tasks.push({ id: 'apply', title: 'Apply to an Opportunity', type: 'action', actionUrl: '/opportunities' });
    }
    
    const mission = { tasks };

    // 3. AI Recommendations (Opportunities)
    const oppsSnap = await db.collection("opportunities").where("status", "==", "Active").limit(2).get();
    const recommendations = [];
    oppsSnap.forEach(doc => recommendations.push({ id: doc.id, ...doc.data() }));

    // Resolve Joined Date
    let joinedAt = new Date();
    if (u.createdAt) {
      joinedAt = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
    }

    // Compile Dashboard Data
    res.json({
      profile: {
        id: uid,
        name: p.name || u.name || '',
        career_goal: c.desired_roles?.[0] || 'Software Engineer',
        profile_completion: a.profile_completion || 0,
        has_resume: !!p.resume_url,
        points: totalPoints,
        appsCount,
        teamsCount,
        mentorsCount,
        joinedAt: joinedAt.toISOString(),
      },
      mission,
      recommendations
    });

  } catch (err) {
    console.error("Workspace error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ── Gamification: Daily Missions & XP ──────────────────────────────────────
router.get("/mission", auth, async (req, res) => {
  res.json({ date: new Date().toISOString().split('T')[0], tasks: [], completed: false });
});

router.post("/mission/complete", auth, async (req, res) => {
  res.json({ message: "Gamification disabled in V4" });
});

module.exports = router;