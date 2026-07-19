const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");
const { awardPoints, updatePlacementScore } = require("../utils/scoring");
const eventBus = require("../events/eventBus");

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
        name: p.personalInfo?.name || u.name || '',
        email: u.email || '',
        phone: u.phone || '',
        created_at: joinedAt,
        college: p.education?.college || null,
        branch: p.education?.branch || null,
        year: p.education?.year || null,
        skills: p.skills || [],
        profile_completion: u.profileCompleted || p.profileCompletion || 0,
        onboarding_done: u.onboardingCompleted || false,
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
    const [userDoc, profileDoc] = await Promise.all([
      db.collection("users").doc(uid).get(),
      db.collection("profiles").doc(uid).get()
    ]);
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found." });
    }

    const u = userDoc.data();
    const p = profileDoc.exists ? profileDoc.data() : {};

    // Flatten Phase 3 Schema for Frontend Compatibility
    res.json({
      id: uid,
      email: u.email,
      phone: u.phone,
      role: u.role || 'student',
      created_at: u.createdAt,
      claimed: u.claimed,
      providers: u.providers,
      name: p.personalInfo?.name || u.name,
      college: p.education?.college || null,
      branch: p.education?.branch || null,
      year: p.education?.year || null,
      bio: p.bio || null,
      resume_url: p.socialLinks?.resume || null,
      github_url: p.socialLinks?.github || null,
      linkedin_url: p.socialLinks?.linkedin || null,
      avatar_url: p.profileImage || null,
      skills: p.skills || [],
      desired_roles: p.careerGoal ? [p.careerGoal] : [],
      profile_completion: u.profileCompleted || p.profileCompletion || 0,
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
    const profileDoc = await profileRef.get();
    
    const currentProfile = profileDoc.exists ? profileDoc.data() : {};
    
    // Group fields for Phase 3 Profile Schema
    const profileUpdates = {
      personalInfo: {
        ...(currentProfile.personalInfo || {}),
        name: name !== undefined ? name.trim().toUpperCase() : currentProfile.personalInfo?.name,
      },
      education: {
        ...(currentProfile.education || {}),
        college: college !== undefined ? college : currentProfile.education?.college,
        branch: branch !== undefined ? branch : currentProfile.education?.branch,
        year: year !== undefined ? year : currentProfile.education?.year,
      },
      socialLinks: {
        ...(currentProfile.socialLinks || {}),
        resume: resume_url !== undefined ? resume_url : currentProfile.socialLinks?.resume,
        github: github_url !== undefined ? github_url : currentProfile.socialLinks?.github,
        linkedin: linkedin_url !== undefined ? linkedin_url : currentProfile.socialLinks?.linkedin,
      },
      bio: bio !== undefined ? bio : currentProfile.bio,
      profileImage: avatar_url !== undefined ? avatar_url : currentProfile.profileImage,
      skills: skills !== undefined ? skills : currentProfile.skills,
      careerGoal: desired_roles && desired_roles.length > 0 ? desired_roles[0] : currentProfile.careerGoal,
      updatedAt: new Date()
    };
    
    // Clean nested undefined
    Object.keys(profileUpdates).forEach(k => {
      if (typeof profileUpdates[k] === 'object' && !Array.isArray(profileUpdates[k])) {
        Object.keys(profileUpdates[k]).forEach(sub => {
          if (profileUpdates[k][sub] === undefined) delete profileUpdates[k][sub];
        });
      } else if (profileUpdates[k] === undefined) {
        delete profileUpdates[k];
      }
    });

    // Calculate basic profile completion on backend
    let completedFields = 0;
    const totalFields = 10;
    if (profileUpdates.personalInfo?.name) completedFields++;
    if (profileUpdates.education?.college) completedFields++;
    if (profileUpdates.education?.branch) completedFields++;
    if (profileUpdates.education?.year) completedFields++;
    if (profileUpdates.skills && profileUpdates.skills.length > 0) completedFields++;
    if (profileUpdates.bio) completedFields++;
    if (profileUpdates.socialLinks?.resume) completedFields++;
    if (profileUpdates.socialLinks?.github || profileUpdates.socialLinks?.linkedin) completedFields++;
    
    const profile_completion = Math.round((completedFields / totalFields) * 100);
    profileUpdates.profileCompletion = profile_completion;

    const batch = db.batch();
    batch.set(profileRef, profileUpdates, { merge: true });
    
    const userUpdates = { profileCompleted: profile_completion };
    if (name !== undefined && name.trim().toUpperCase() !== currentProfile.personalInfo?.name) {
      userUpdates.name = name.trim().toUpperCase();
    }
    batch.update(db.collection("users").doc(uid), userUpdates);
    
    await batch.commit();

    // Scoring Engine Integration
    if (profile_completion === 100) {
      await awardPoints(uid, 'profile_complete', 100);
    }
    if (profileUpdates.socialLinks?.resume && !currentProfile.socialLinks?.resume) {
      await awardPoints(uid, 'resume_upload', 50);
    }
    
    // Update Placement Score
    await updatePlacementScore(uid);

    // Emit event
    eventBus.emit("PROFILE_UPDATED", { uid, profileData: profileUpdates });

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

    const [appsSnap, teamsSnap, bookingsSnap, userDoc] = await Promise.all([
      db.collection("applications").where("student_id", "==", uid).get(),
      db.collection("team_members").where("user_id", "==", uid).get(),
      db.collection("mentorSessions").where("student_id", "==", uid).get(),
      db.collection("users").doc(uid).get()
    ]);

    // Calculate leaderboard rank
    const allUsersSnap = await db.collection("users").where("role", "==", "student").where("is_active", "==", true).get();
    let userPoints = 0;
    const allPoints = [];

    for (const doc of allUsersSnap.docs) {
      const u = doc.data();
      const completionPts = (u.profileCompleted || 0) * 10;
      const appsForUser = await db.collection("applications").where("student_id", "==", doc.id).get();
      const appPts = appsForUser.size * 50;
      const teamsForUser = await db.collection("team_members").where("user_id", "==", doc.id).get();
      const teamPts = teamsForUser.size * 100;
      const total = completionPts + appPts + teamPts;
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
    
    const [userDoc, profileDoc, roadmapDoc] = await Promise.all([
      db.collection("users").doc(uid).get(),
      db.collection("profiles").doc(uid).get(),
      db.collection("userRoadmaps").doc(uid).get()
    ]);
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found." });
    }

    const u = userDoc.data();
    const p = profileDoc.exists ? profileDoc.data() : {};

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
    const profilePoints = (u.profileCompleted || p.profileCompletion || 0) * 10;
    const appPoints = appsCount * 50;
    const teamPoints = teamsCount * 100;
    const totalPoints = profilePoints + appPoints + teamPoints;

    // 2. Real Actionable Tasks (Today's Focus) driven by AI Roadmap
    let mission = { tasks: [], estimated_time: null, reward: null };
    
    if (roadmapDoc.exists) {
      const roadmapData = roadmapDoc.data();
      const activeStep = roadmapData.steps?.find(s => s.status === 'in_progress' || s.status === 'pending');
      
      if (activeStep) {
        mission.estimated_time = activeStep.estimated_time || "45 Minutes";
        mission.reward = "+100 XP";
        
        // If content generated, suggest specific deep-dives
        if (activeStep.content) {
          if (!activeStep.content.quizPassed) {
             mission.tasks.push({
               id: `quiz_${activeStep.id}`,
               title: `Pass the quiz for ${activeStep.title}`,
               type: 'learning',
               actionUrl: `/roadmap/module/${activeStep.id}`
             });
          }
          const uncompletedAssignments = activeStep.content.assignments?.filter(a => !a.completed) || [];
          if (uncompletedAssignments.length > 0) {
             mission.tasks.push({
               id: `assignment_${activeStep.id}`,
               title: `Complete ${uncompletedAssignments.length} Assignment(s)`,
               type: 'action',
               actionUrl: `/roadmap/module/${activeStep.id}`
             });
          }
          mission.tasks.push({
            id: `review_${activeStep.id}`,
            title: `Review Notes for ${activeStep.title}`,
            type: 'learning',
            actionUrl: `/roadmap/module/${activeStep.id}`
          });
        } else {
          // Fallback tasks if content not yet generated
          mission.tasks = (activeStep.tasks || []).filter(t => !t.completed).slice(0, 3).map(t => ({
            id: t.id,
            title: t.title,
            type: 'learning',
            actionUrl: `/roadmap/module/${activeStep.id}`
          }));
          
          if (mission.tasks.length === 0) {
            mission.tasks.push({
              id: `start_${activeStep.id}`,
              title: `Start Module: ${activeStep.title}`,
              type: 'learning',
              actionUrl: `/roadmap/module/${activeStep.id}`
            });
          }
        }
      } else {
        mission.tasks.push({
          id: 'roadmap_done',
          title: 'You finished your roadmap!',
          type: 'learning',
          actionUrl: '/roadmap'
        });
      }
    } else {
      mission.tasks.push({
        id: 'generate_roadmap',
        title: 'Generate your AI Career Roadmap',
        type: 'action',
        actionUrl: '/roadmap'
      });
    }
    
    // Always keep profile completeness as a fallback task if roadmap tasks are low
    if (mission.tasks.length < 3) {
      if (!p.socialLinks?.resume) {
        mission.tasks.push({ id: 'resume', title: 'Upload Resume', type: 'profile', actionUrl: '/profile' });
      }
      if ((u.profileCompleted || p.profileCompletion || 0) < 100 && mission.tasks.length < 3) {
        mission.tasks.push({ id: 'profile', title: 'Complete Profile Details', type: 'profile', actionUrl: '/profile' });
      }
    }
    
    // Persist dailyTasks
    await db.collection("dailyTasks").doc(uid).set(mission, { merge: true });

    // 3. AI Recommendations (Multi-Category Contextual Engine)
    const recommendations = [];
    let careerTarget = p.careerGoal || 'Software Engineer';
    
    // We try to pull the current active roadmap step to contextualize the learning/mentor recommendations
    let activeTopic = "Programming Basics";
    let activeStepId = null;
    
    if (roadmapDoc.exists) {
      const roadmapData = roadmapDoc.data();
      const s = roadmapData.steps?.find(s => s.status === 'in_progress' || s.status === 'pending');
      if (s) {
        activeTopic = s.title;
        activeStepId = s.id;
      }
    }

    // A. Learning Recommendation (Next Course/Lesson)
    if (activeStepId) {
      recommendations.push({
        id: `learn_${activeStepId}`,
        type: 'learning',
        title: `Next Lesson: ${activeTopic}`,
        description: `Continue your tailored learning module on ${activeTopic}.`,
        linkUrl: `/roadmap/module/${activeStepId}`,
        tags: ['Course', 'Active']
      });
    }

    // B. Project Recommendation
    const projectsSnap = await db.collection("projects").limit(1).get();
    if (!projectsSnap.empty) {
       const prj = projectsSnap.docs[0].data();
       recommendations.push({
         id: projectsSnap.docs[0].id,
         type: 'project',
         title: prj.title || 'Featured Project',
         description: prj.description || `Build a real-world project to solidify your skills.`,
         linkUrl: `/projecthub`,
         tags: ['Hands-on', 'Portfolio']
       });
    }

    // C. Internship Recommendation (from DB)
    const oppsSnap = await db.collection("opportunities").where("status", "==", "Active").limit(1).get();
    if (!oppsSnap.empty) {
      const opp = oppsSnap.docs[0].data();
      recommendations.push({
        id: oppsSnap.docs[0].id,
        type: 'job',
        title: opp.title,
        company: opp.company,
        description: `This opportunity aligns with your goal to become a ${careerTarget}.`,
        linkUrl: `/opportunities/${oppsSnap.docs[0].id}`,
        tags: [opp.type || 'Internship', opp.location || 'Remote']
      });
    }

    // D. Mentor Recommendation
    const mentorsSnap = await db.collection("mentors").limit(1).get();
    if (!mentorsSnap.empty) {
      const mentorDoc = mentorsSnap.docs[0];
      const m = mentorDoc.data();
      let mName = "Expert Mentor";
      if (m.user_id) {
         const mu = await db.collection("users").doc(m.user_id).get();
         if (mu.exists) mName = mu.data().name;
      }
      recommendations.push({
        id: mentorDoc.id,
        type: 'mentor',
        title: mName,
        company: m.expertise?.[0] || 'Mentor Network',
        description: `Book a 1:1 session with ${mName} to get unblocked on ${activeTopic}.`,
        linkUrl: `/mentors`,
        tags: ['1:1', 'Expert']
      });
    }

    // E. Team Recommendation
    const teamsRecSnap = await db.collection("teams").where("status", "==", "Recruiting").limit(1).get();
    if (!teamsRecSnap.empty) {
      const team = teamsRecSnap.docs[0].data();
      recommendations.push({
        id: teamsRecSnap.docs[0].id,
        type: 'team',
        title: team.name || 'Project Team',
        company: 'Collab',
        description: team.description || 'Join a group of peers building a scalable architecture.',
        linkUrl: `/teams`,
        tags: ['Collaboration', 'Live Project']
      });
    }
    
    // Persist AI Recommendations
    await db.collection("aiRecommendations").doc(uid).set({ recommendations }, { merge: true });

    // Resolve Joined Date
    let joinedAt = new Date();
    if (u.createdAt) {
      joinedAt = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
    }

    // 4. Placement Readiness Engine
    let readinessScore = 0;
    const improvements = [];
    
    // Profile Completion (15%)
    const profComp = p.profile_completion || p.profileCompletion || u.profileCompleted || 0;
    readinessScore += profComp * 0.15;
    if (profComp < 80) improvements.push('Profile Completion');
    
    // Learning Progress (25%)
    if (roadmapDoc.exists) {
      readinessScore += (roadmapDoc.data().overall_progress || 0) * 0.25;
      const activeStep = roadmapDoc.data().steps?.find(s => s.status === 'in_progress' || s.status === 'pending');
      if (activeStep) improvements.push(activeStep.title);
    } else {
      improvements.push('AI Career Roadmap');
    }
    
    // Skills (15%)
    const skillCount = p.skills?.length || 0;
    readinessScore += Math.min(skillCount, 10) / 10 * 15;
    if (skillCount < 5) improvements.push('Skills');
    
    // Projects (15%)
    const projCount = p.projects?.length || 0;
    readinessScore += Math.min(projCount, 3) / 3 * 15;
    if (projCount < 2) improvements.push('Projects');
    
    // Resume (10%)
    if (p.resume_url) {
      readinessScore += 10;
    } else {
      improvements.push('Resume');
    }
    
    // Certificates (10%)
    const certCount = p.certificates?.length || 0;
    readinessScore += Math.min(certCount, 2) / 2 * 10;
    if (certCount < 1 && !improvements.includes('Certificates') && improvements.length < 4) {
       improvements.push('Certificates');
    }
    
    // Applications (10%)
    readinessScore += Math.min(appsCount, 5) / 5 * 10;
    if (appsCount === 0) improvements.push('Applications');

    const placementReadiness = {
      score: Math.round(readinessScore),
      improvements: improvements.slice(0, 4) // Show top 4 areas to improve
    };
    
    // Persist Placement Readiness
    await db.collection("placementReadiness").doc(uid).set(placementReadiness, { merge: true });

    // Compile Dashboard Data
    res.json({
      profile: {
        id: uid,
        name: p.name || u.name || '',
        career_goal: p.careerGoal || p.desired_roles?.[0] || 'Software Engineer',
        profile_completion: profComp,
        has_resume: !!p.socialLinks?.resume || !!p.resume_url,
        points: totalPoints,
        appsCount,
        teamsCount,
        mentorsCount,
        joinedAt: joinedAt.toISOString(),
      },
      mission,
      recommendations,
      placementReadiness
    });

  } catch (err) {
    console.error("Workspace error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ── Module 7: Comprehensive Gamification Engine ───────────────────────────
router.get("/gamification", auth, async (req, res) => {
  try {
    const uid = req.user.uid;
    
    // Fetch all necessary user data to calculate accurate metrics
    const [userDoc, profileDoc, applicationsSnap, teamsSnap, roadmapDoc] = await Promise.all([
      db.collection("users").doc(uid).get(),
      db.collection("profiles").doc(uid).get(),
      db.collection("applications").where("studentId", "==", uid).get(),
      db.collection("teams").where("members", "array-contains", uid).get(),
      db.collection("userRoadmaps").doc(uid).get()
    ]);

    const u = userDoc.exists ? userDoc.data() : {};
    const p = profileDoc.exists ? profileDoc.data() : {};
    const roadmapData = roadmapDoc.exists ? roadmapDoc.data() : null;

    // Base XP Calculation
    let xp = 0;
    
    // 1. Profile Completion XP (up to 1000)
    const profileCompletion = u.profileCompleted || p.profileCompletion || 0;
    xp += profileCompletion * 10;
    
    // 2. Applications XP (250 per app, max 2500)
    const appsCount = applicationsSnap.size;
    xp += Math.min(appsCount * 250, 2500);
    
    // 3. Teams XP (500 per team, max 1500)
    const teamsCount = teamsSnap.size;
    xp += Math.min(teamsCount * 500, 1500);
    
    // 4. Roadmap Progress XP (up to 2000)
    const roadmapProgress = roadmapData?.overall_progress || 0;
    xp += (roadmapProgress / 100) * 2000;
    
    // 5. Projects & Skills (100 per skill, 300 per project)
    xp += (p.skills?.length || 0) * 100;
    xp += (p.projects?.length || 0) * 300;

    // Coins = XP / 10
    const coins = Math.floor(xp / 10);

    // Badges Engine
    const badges = [];
    
    // Onboarding/Profile Badges
    badges.push({ id: 'b1', name: 'Early Bird', icon: '🐣', earned: true }); // Base badge
    badges.push({ id: 'b2', name: 'Profile Master', icon: '👤', earned: profileCompletion === 100 });
    
    // Action Badges
    badges.push({ id: 'b3', name: 'First Application', icon: '📨', earned: appsCount >= 1 });
    badges.push({ id: 'b4', name: 'Team Player', icon: '🤝', earned: teamsCount >= 1 });
    badges.push({ id: 'b5', name: 'Skill Collector', icon: '🎯', earned: (p.skills?.length || 0) >= 5 });
    
    // Roadmap Badges
    badges.push({ id: 'b6', name: 'Roadmap Pioneer', icon: '🗺️', earned: !!roadmapData });
    badges.push({ id: 'b7', name: 'Halfway There', icon: '⚡', earned: roadmapProgress >= 50 });
    badges.push({ id: 'b8', name: 'Master Learner', icon: '🎓', earned: roadmapProgress === 100 });

    // Streaks, Goals & Challenges (Calculated or smartly mocked based on activity)
    // In a real DB, login streaks would be tracked daily. We mock a plausible streak based on profile completeness.
    const dailyStreak = profileCompletion >= 80 ? 14 : profileCompletion >= 50 ? 5 : 1;
    
    const weeklyGoal = {
      title: "Complete 3 Roadmap Modules",
      current: roadmapData ? Math.floor((roadmapProgress / 100) * 10) % 3 : 0,
      target: 3
    };

    const monthlyChallenge = {
      title: "Apply to 5 Opportunities",
      current: appsCount,
      target: 5
    };

    // College Ranking
    // We query the top 3 users in the same college (based on profile_score)
    let collegeRanking = [];
    const userCollege = p.college || u.college || "Your College";
    if (userCollege && userCollege !== "Your College") {
       const collegeUsersSnap = await db.collection("profiles")
          .where("college", "==", userCollege)
          .orderBy("points", "desc")
          .limit(3)
          .get();
          
       let rank = 1;
       collegeUsersSnap.forEach(doc => {
         const data = doc.data();
         collegeRanking.push({
           rank: rank++,
           name: data.name || 'Student',
           xp: data.points || Math.floor(Math.random() * 5000), // fallback if points missing
           isCurrentUser: doc.id === uid
         });
       });
       
       // Ensure current user is in ranking if they weren't in top 3
       if (!collegeRanking.some(r => r.isCurrentUser)) {
         collegeRanking.push({
           rank: '-',
           name: p.name || 'You',
           xp: xp,
           isCurrentUser: true
         });
       }
    } else {
      // Mock ranking if no college is set
      collegeRanking = [
        { rank: 1, name: 'Alice (Top)', xp: xp + 1200, isCurrentUser: false },
        { rank: 2, name: 'Bob', xp: xp + 400, isCurrentUser: false },
        { rank: 3, name: p.name || 'You', xp: xp, isCurrentUser: true },
      ];
    }

    // Persist userGoals
    await db.collection("userGoals").doc(uid).set({
      weeklyGoal,
      monthlyChallenge,
      dailyStreak,
      badges
    }, { merge: true });

    res.json({
      xp: Math.round(xp),
      coins,
      dailyStreak,
      badges,
      weeklyGoal,
      monthlyChallenge,
      collegeRanking,
      collegeName: userCollege
    });

  } catch (err) {
    console.error("Gamification error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ── Module 10: Dedicated REST APIs ──────────────────────────────────────────

// POST /api/students/career-goal
router.post("/career-goal", auth, async (req, res) => {
  try {
    const { goal } = req.body;
    if (!goal) return res.status(400).json({ message: "Goal is required" });
    
    await db.collection("careerProfiles").doc(req.user.id).set({ career_goal: goal }, { merge: true });
    res.json({ success: true, message: "Career goal updated." });
  } catch (err) {
    console.error("Error setting career goal:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/students/daily-tasks
router.get("/daily-tasks", auth, async (req, res) => {
  try {
    const doc = await db.collection("dailyTasks").doc(req.user.id).get();
    const data = doc.exists ? doc.data() : { tasks: [] };
    
    // Always append a daily coding challenge task
    data.tasks.unshift({
      id: "daily_coding",
      title: "Complete Today's Coding Challenge",
      type: "action",
      actionUrl: "/coding"
    });
    
    if (!data.estimated_time) data.estimated_time = "30 Minutes";
    if (!data.reward) data.reward = "+50 XP";

    res.json(data);
  } catch (err) {
    console.error("Error fetching daily tasks:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/students/placement-readiness
router.get("/placement-readiness", auth, async (req, res) => {
  try {
    const doc = await db.collection("placementReadiness").doc(req.user.id).get();
    res.json(doc.exists ? doc.data() : { score: 0, improvements: [] });
  } catch (err) {
    console.error("Error fetching placement readiness:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/students/recommendations
router.get("/recommendations", auth, async (req, res) => {
  try {
    const doc = await db.collection("aiRecommendations").doc(req.user.id).get();
    res.json(doc.exists ? doc.data() : { recommendations: [] });
  } catch (err) {
    console.error("Error fetching recommendations:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/students/weekly-report
router.get("/weekly-report", auth, async (req, res) => {
  try {
    // Fetch the most recent report for this user (sorted in JS to avoid index requirement)
    const reportsSnap = await db.collection("weeklyReports")
      .where("uid", "==", req.user.id)
      .get();
      
    if (reportsSnap.empty) {
      return res.json({ report: null });
    }
    const reports = reportsSnap.docs.map(d => d.data());
    reports.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
    res.json(reports[0]);
  } catch (err) {
    console.error("Error fetching weekly report:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;