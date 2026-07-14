const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");
const { awardPoints, updatePlacementScore } = require("../utils/scoring");

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
      name: name !== undefined ? name.trim().toUpperCase() : currentProfileData.name,
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

    // Scoring Engine Integration
    if (profile_completion === 100) {
      await awardPoints(req.user.id, 'profile_complete', 100);
    }
    if (updateData.resume_url) {
      await awardPoints(req.user.id, 'resume_upload', 50);
    }
    
    // Update Placement Score
    await updatePlacementScore(req.user.id);

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

    const [appsSnap, teamsSnap, bookingsSnap, studentDoc] = await Promise.all([
      db.collection("applications").where("student_id", "==", uid).get(),
      db.collection("team_members").where("user_id", "==", uid).get(),
      db.collection("mentorSessions").where("student_id", "==", uid).get(),
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

// ── Dashboard V4 Workspace Data ──────────────────────────────────────
router.get("/workspace", auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const studentRef = db.collection("students").doc(uid);
    const studentDoc = await studentRef.get();
    
    if (!studentDoc.exists) {
      return res.status(404).json({ message: "Student profile not found." });
    }

    const s = studentDoc.data();
    const sp = s.profile_data || {};

    // 1. Placement Readiness Calculation (Dynamic)
    let placementReadiness = 0;
    if (sp.profile_completion === 100) placementReadiness += 25;
    else placementReadiness += (sp.profile_completion || 0) * 0.25;
    if (sp.resume_url) placementReadiness += 25;
    if (sp.skills && sp.skills.length > 3) placementReadiness += 25;
    // Add logic for projects or learning if they exist later
    placementReadiness += 10; // base score for being active
    
    // Cap at 100
    placementReadiness = Math.min(100, Math.round(placementReadiness));

    // 2. Daily Mission (Today's Focus)
    const today = new Date().toISOString().split('T')[0];
    let mission = sp.daily_mission;
    if (!mission || mission.date !== today) {
      // Generate new mission based on real data
      const tasks = [];
      if (!sp.resume_url) tasks.push({ id: 'resume', title: 'Upload Resume', completed: false, xp: 50, type: 'profile' });
      if (sp.profile_completion < 100) tasks.push({ id: 'profile', title: 'Complete Profile', completed: false, xp: 50, type: 'profile' });
      if (sp.skills && sp.skills.length > 0) tasks.push({ id: 'skill', title: `Practice ${sp.skills[0]}`, completed: false, xp: 30, type: 'learning' });
      else tasks.push({ id: 'skill', title: 'Add your top skills', completed: false, xp: 30, type: 'profile' });
      
      // Pad with default task if less than 3
      if (tasks.length < 3) {
        tasks.push({ id: 'apply', title: 'Apply to one Internship', completed: false, xp: 40, type: 'action' });
      }

      mission = { date: today, tasks, completed: false };
      await studentRef.update({ 'profile_data.daily_mission': mission });
    }

    // 3. AI Recommendations (Opportunities)
    // For now, fetch top 2 opportunities as a mock "recommendation"
    const oppsSnap = await db.collection("opportunities").where("status", "==", "Active").limit(2).get();
    const recommendations = [];
    oppsSnap.forEach(doc => recommendations.push({ id: doc.id, ...doc.data() }));

    // Compile Dashboard V4 Data
    res.json({
      profile: {
        id: uid,
        name: sp.name || '',
        career_goal: sp.career_goal || sp.desired_roles?.[0] || 'Software Engineer',
        level: sp.level || 1,
        xp: sp.xp || 0,
        streak: sp.streak || 0,
        profile_completion: sp.profile_completion || 0,
        resume_score: sp.resume_url ? 85 : 0, // Mock ATS score based on presence
        placement_readiness: placementReadiness,
        learning_progress: 34, // Mock for now until learning module exists
        roadmap_progress: 12, // Mock for now until roadmap module exists
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
  try {
    const uid = req.user.id;
    const studentRef = db.collection("students").doc(uid);
    const studentDoc = await studentRef.get();
    
    if (!studentDoc.exists) return res.status(404).json({ message: "Student not found" });
    
    const sp = studentDoc.data().profile_data || {};
    const today = new Date().toISOString().split('T')[0];
    
    // Check if mission exists for today
    if (sp.daily_mission && sp.daily_mission.date === today) {
      return res.json(sp.daily_mission);
    }
    
    // Generate new mission
    const firstSkill = sp.skills?.[0] || 'Basics';
    const newMission = {
      date: today,
      tasks: [
        { id: 'task1', title: `Practice ${firstSkill}`, completed: false, xp: 50 },
        { id: 'task2', title: 'Solve 2 Coding Problems', completed: false, xp: 40 },
        { id: 'task3', title: 'Upload Resume', completed: false, xp: 30 }
      ],
      completed: false
    };
    
    await studentRef.update({
      'profile_data.daily_mission': newMission,
      'profile_data.xp': sp.xp || 0,
      'profile_data.streak': sp.streak || 0,
      'profile_data.level': sp.level || 1
    });
    
    res.json(newMission);
  } catch (err) {
    console.error("Mission Get error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

router.post("/mission/complete", auth, async (req, res) => {
  try {
    const { taskId } = req.body;
    const uid = req.user.id;
    const studentRef = db.collection("students").doc(uid);
    const studentDoc = await studentRef.get();
    
    if (!studentDoc.exists) return res.status(404).json({ message: "Student not found" });
    
    const sp = studentDoc.data().profile_data || {};
    const mission = sp.daily_mission;
    
    if (!mission) return res.status(400).json({ message: "No active mission" });
    
    const taskIndex = mission.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1 || mission.tasks[taskIndex].completed) {
      return res.status(400).json({ message: "Task not found or already completed" });
    }
    
    mission.tasks[taskIndex].completed = true;
    const xpReward = mission.tasks[taskIndex].xp;
    
    let newXp = (sp.xp || 0) + xpReward;
    let newLevel = Math.floor(newXp / 500) + 1;
    let newStreak = sp.streak || 0;
    
    const allCompleted = mission.tasks.every(t => t.completed);
    if (allCompleted && !mission.completed) {
      mission.completed = true;
      // Streak logic (basic)
      newStreak += 1;
    }
    
    await studentRef.update({
      'profile_data.daily_mission': mission,
      'profile_data.xp': newXp,
      'profile_data.level': newLevel,
      'profile_data.streak': newStreak
    });
    
    res.json({ mission, xp: newXp, level: newLevel, streak: newStreak, awarded: xpReward });
  } catch (err) {
    console.error("Mission Complete error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;