const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");
const { getCommunityUpdates } = require("../services/communityService");
const { awardPoints, updatePlacementScore } = require("../utils/scoring");
const eventBus = require("../events/eventBus");

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

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
    profilesSnap.docs.forEach(d => profiles[d.id] = mapDoc(d));
    
    const analytics = {};
    analyticsSnap.docs.forEach(d => analytics[d.id] = mapDoc(d));
    
    const careers = {};
    careerSnap.docs.forEach(d => careers[d.id] = mapDoc(d));

    const students = usersSnap.docs.map(doc => {
      const u = mapDoc(doc);
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

    const u = mapDoc(userDoc);
    const p = profileDoc.exists ? mapDoc(profileDoc) : {};

    // Flatten Phase 3 Schema for Frontend Compatibility
    res.json({
      id: uid,
      email: u.email,
      phone: p.personalInfo?.phone || u.phone || p.phone || '',
      role: u.role || 'student',
      created_at: u.createdAt,
      claimed: u.claimed,
      providers: u.providers,
      name: p.personalInfo?.name || u.name || '',
      college: p.education?.college || p.college || null,
      branch: p.education?.branch || p.branch || null,
      year: p.education?.year || p.year || null,
      bio: p.bio || null,
      city: p.personalInfo?.city || p.city || null,
      state: p.personalInfo?.state || p.state || null,
      country: p.personalInfo?.country || p.country || null,
      resume_url: p.socialLinks?.resume || p.resume_url || null,
      github_url: p.socialLinks?.github || p.github_url || null,
      linkedin_url: p.socialLinks?.linkedin || p.linkedin_url || null,
      portfolio_url: p.socialLinks?.portfolio || p.portfolio_url || null,
      avatar_url: p.profileImage || u.photoURL || u.avatar_url || p.avatar_url || null,
      skills: p.skills || [],
      desired_roles: p.careerGoal ? [p.careerGoal] : (p.desired_roles || []),
      achievements: p.achievements || [],
      seeking: p.seeking || [],
      passionate_about: p.passionate_about || [],
      projects: p.projects || [],
      certificates: p.certificates || [],
      open_to_work: p.open_to_work ?? true,
      available_for_internship: p.available_for_internship ?? true,
      full_time: p.full_time ?? true,
      profile_completion: u.profileCompleted || p.profileCompletion || 0,
    });
  } catch (err) {
    console.error("Get profile error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

router.put("/profile", auth, async (req, res) => {
  const { 
    name, college, branch, year, bio, city, state, country, phone,
    resume_url, github_url, linkedin_url, portfolio_url, avatar_url,
    skills, desired_roles, achievements, seeking, passionate_about, projects, certificates,
    open_to_work, available_for_internship, full_time
  } = req.body;

  try {
    const uid = req.user.id;
    const profileRef = db.collection("profiles").doc(uid);
    const profileDoc = await profileRef.get();
    const currentProfile = profileDoc.exists ? mapDoc(profileDoc) : {};

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    const currentUser = userDoc.exists ? mapDoc(userDoc) : {};

    // Group fields for Phase 3 Profile Schema
    const profileUpdates = {
      personalInfo: {
        ...(currentProfile.personalInfo || {}),
        name: name !== undefined ? name.trim().toUpperCase() : (currentProfile.personalInfo?.name || currentUser.name),
        phone: phone !== undefined ? phone.trim() : (currentProfile.personalInfo?.phone || currentUser.phone),
        city: city !== undefined ? city.trim() : (currentProfile.personalInfo?.city || currentProfile.city),
        state: state !== undefined ? state.trim() : (currentProfile.personalInfo?.state || currentProfile.state),
        country: country !== undefined ? country.trim() : (currentProfile.personalInfo?.country || currentProfile.country),
      },
      education: {
        ...(currentProfile.education || {}),
        college: college !== undefined ? college : (currentProfile.education?.college || currentProfile.college),
        branch: branch !== undefined ? branch : (currentProfile.education?.branch || currentProfile.branch),
        year: year !== undefined ? year : (currentProfile.education?.year || currentProfile.year),
      },
      socialLinks: {
        ...(currentProfile.socialLinks || {}),
        resume: resume_url !== undefined ? resume_url : (currentProfile.socialLinks?.resume || currentProfile.resume_url),
        github: github_url !== undefined ? github_url : (currentProfile.socialLinks?.github || currentProfile.github_url),
        linkedin: linkedin_url !== undefined ? linkedin_url : (currentProfile.socialLinks?.linkedin || currentProfile.linkedin_url),
        portfolio: portfolio_url !== undefined ? portfolio_url : (currentProfile.socialLinks?.portfolio || currentProfile.portfolio_url),
      },
      bio: bio !== undefined ? bio : currentProfile.bio,
      city: city !== undefined ? city.trim() : currentProfile.city,
      state: state !== undefined ? state.trim() : currentProfile.state,
      country: country !== undefined ? country.trim() : currentProfile.country,
      phone: phone !== undefined ? phone.trim() : currentProfile.phone,
      profileImage: avatar_url !== undefined ? avatar_url : (currentProfile.profileImage || currentUser.photoURL),
      skills: skills !== undefined ? skills : currentProfile.skills,
      projects: projects !== undefined ? projects : currentProfile.projects,
      certificates: certificates !== undefined ? certificates : currentProfile.certificates,
      achievements: achievements !== undefined ? achievements : currentProfile.achievements,
      seeking: seeking !== undefined ? seeking : currentProfile.seeking,
      passionate_about: passionate_about !== undefined ? passionate_about : currentProfile.passionate_about,
      careerGoal: desired_roles && desired_roles.length > 0 ? desired_roles[0] : currentProfile.careerGoal,
      open_to_work: open_to_work !== undefined ? open_to_work : (currentProfile.open_to_work ?? true),
      available_for_internship: available_for_internship !== undefined ? available_for_internship : (currentProfile.available_for_internship ?? true),
      full_time: full_time !== undefined ? full_time : (currentProfile.full_time ?? true),
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
    if (profileUpdates.personalInfo?.phone || profileUpdates.phone) completedFields++;
    if (profileUpdates.personalInfo?.city || profileUpdates.city) completedFields++;
    
    const profile_completion = Math.round((completedFields / totalFields) * 100);
    profileUpdates.profileCompletion = profile_completion;

    const batch = db.batch();
    batch.set(profileRef, profileUpdates, { merge: true });
    
    const userUpdates = { 
      profileCompleted: profile_completion,
      updatedAt: new Date()
    };
    if (name !== undefined) {
      userUpdates.name = name.trim().toUpperCase();
    }
    if (phone !== undefined) {
      userUpdates.phone = phone.trim();
    }
    if (avatar_url !== undefined) {
      userUpdates.photoURL = avatar_url;
      userUpdates.avatar_url = avatar_url;
    }
    batch.set(userRef, userUpdates, { merge: true });
    
    await batch.commit();

    // Scoring Engine Integration
    if (profile_completion === 100) {
      await awardPoints(uid, 'profile_complete', 100).catch(() => {});
    }
    if (profileUpdates.socialLinks?.resume && !currentProfile.socialLinks?.resume) {
      await awardPoints(uid, 'resume_upload', 50).catch(() => {});
    }
    
    await updatePlacementScore(uid).catch(() => {});

    // Emit event
    eventBus.emit("PROFILE_UPDATED", { uid, profileData: profileUpdates });

    res.json({ 
      message: "Profile updated successfully.", 
      profile_completion,
      avatar_url: profileUpdates.profileImage,
      name: userUpdates.name || currentUser.name
    });
  } catch (err) {
    console.error("Update profile error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ─── Upload Avatar (Base64 Fallback Endpoint - Bypass CORS) ─────────────
router.post("/upload-avatar-base64", auth, async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    const uid = req.user.id;

    if (!imageBase64) {
      return res.status(400).json({ message: "No image data provided." });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    let downloadUrl = null;

    // Try Firebase Admin Storage bucket if configured
    try {
      if (admin.storage) {
        const bucket = admin.storage().bucket();
        const filename = `profiles/${uid}/avatar_${Date.now()}.jpg`;
        const file = bucket.file(filename);

        await file.save(buffer, {
          metadata: { contentType: 'image/jpeg' },
          public: true
        });

        const [signedUrl] = await file.getSignedUrl({
          action: 'read',
          expires: '03-01-2500'
        }).catch(() => []);

        downloadUrl = signedUrl || `https://storage.googleapis.com/${bucket.name}/${filename}`;
      }
    } catch (storageErr) {
      console.warn("⚠️ Firebase Admin Storage upload skipped/failed:", storageErr.message);
    }

    // If bucket is not accessible, store optimized base64 Data URL directly in Firestore
    if (!downloadUrl) {
      downloadUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${base64Data}`;
    }

    const profileRef = db.collection("profiles").doc(uid);
    const userRef = db.collection("users").doc(uid);
    const batch = db.batch();
    batch.set(profileRef, { profileImage: downloadUrl, updatedAt: new Date() }, { merge: true });
    batch.set(userRef, { photoURL: downloadUrl, avatar_url: downloadUrl, updatedAt: new Date() }, { merge: true });
    await batch.commit();

    // Emit event
    eventBus.emit("PROFILE_UPDATED", { uid, profileData: { profileImage: downloadUrl } });

    res.json({
      avatar_url: downloadUrl,
      message: "Avatar uploaded successfully."
    });
  } catch (err) {
    console.error("Upload avatar base64 error:", err.message);
    res.status(500).json({ message: "Failed to upload avatar: " + err.message });
  }
});

// ── Get recent activity for dashboard ─────────────────────────────────────
// ── Get recent activity for dashboard ─────────────────────────────────────
router.get("/activity", auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const activities = [];

    // Applications
    const [appsSnap1, appsSnap2, teamsSnap, bookSnap] = await Promise.all([
      db.collection("applications").where("user_id", "==", uid).get(),
      db.collection("applications").where("student_id", "==", uid).get(),
      db.collection("team_members").where("user_id", "==", uid).get(),
      db.collection("mentorSessions").where("student_id", "==", uid).get()
    ]);

    const appsMap = new Map();
    appsSnap1.docs.forEach(d => appsMap.set(d.id, mapDoc(d)));
    appsSnap2.docs.forEach(d => appsMap.set(d.id, mapDoc(d)));
    appsMap.forEach(d => {
      const ts = d.applied_at?.toDate ? d.applied_at.toDate() : new Date(d.applied_at || 0);
      activities.push({ type: 'application', title: `Applied to ${d.title || 'an opportunity'}`, company: d.company, time: ts, icon: '📨' });
    });

    // Parallelize team and mentor lookups
    const teamPromises = teamsSnap.docs.map(async (doc) => {
      const tm = mapDoc(doc);
      const teamDoc = await db.collection("teams").doc(tm.team_id).get();
      const teamName = teamDoc.exists ? mapDoc(teamDoc).name : 'a team';
      const ts = tm.joined_at?.toDate ? tm.joined_at.toDate() : new Date(tm.joined_at || 0);
      return { type: 'team_join', title: `Joined team "${teamName}"`, time: ts, icon: '🤝' };
    });

    const mentorPromises = bookSnap.docs.map(async (doc) => {
      const b = mapDoc(doc);
      let mentorName = 'a mentor';
      if (b.mentor_id) {
        const mentorDoc = await db.collection("mentors").doc(b.mentor_id).get();
        if (mentorDoc.exists) {
          const userDoc = await db.collection("users").doc(mapDoc(mentorDoc).user_id).get();
          mentorName = userDoc.exists ? mapDoc(userDoc).name : 'a mentor';
        }
      }
      const ts = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at || 0);
      return { type: 'mentor_booking', title: `Booked session with ${mentorName}`, time: ts, icon: '👨‍🏫' };
    });

    const [teamActs, mentorActs] = await Promise.all([
      Promise.all(teamPromises),
      Promise.all(mentorPromises)
    ]);

    activities.push(...teamActs, ...mentorActs);
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

    const userDocData = userDoc.exists ? mapDoc(userDoc) : {};
    const completionPts = (userDocData.profileCompleted || 0) * 10;
    const appPts = appsSnap.size * 50;
    const teamPts = teamsSnap.size * 100;
    const userPoints = completionPts + appPts + teamPts;

    let joinedAt = new Date();
    if (userDoc.exists && userDocData.createdAt) {
      joinedAt = userDocData.createdAt.toDate ? userDocData.createdAt.toDate() : new Date(userDocData.createdAt);
    }
    
    const daysOnPlatform = Math.max(1, Math.ceil((Date.now() - joinedAt.getTime()) / (1000 * 60 * 60 * 24)));

    res.json({
      applications: appsSnap.size,
      teams: teamsSnap.size,
      mentorSessions: bookingsSnap.size,
      rank: 1,
      points: userPoints,
      daysOnPlatform,
      selected: appsSnap.docs.filter(d => mapDoc(d).status === 'Selected').length,
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

    const u = mapDoc(userDoc);
    const p = profileDoc.exists ? mapDoc(profileDoc) : {};

    // 1. Fetch Real Data Counts and Updates using aggregate queries for performance
    const [userAppsSnap, studentAppsSnap, teamsSnap, bookingsSnap, communityUpdates, oppsSnap] = await Promise.all([
      db.collection("applications").where("user_id", "==", uid).get(),
      db.collection("applications").where("student_id", "==", uid).get(),
      db.collection("team_members").where("user_id", "==", uid).count().get(),
      db.collection("mentorSessions").where("student_id", "==", uid).count().get(),
      getCommunityUpdates(uid),
      db.collection("opportunities").limit(30).get()
    ]);

    // Deduplicate user applications across user_id & student_id compatibility fields
    const appsMap = new Map();
    userAppsSnap.docs.forEach(doc => appsMap.set(doc.id, { id: doc.id, ...doc.data() }));
    studentAppsSnap.docs.forEach(doc => appsMap.set(doc.id, { id: doc.id, ...doc.data() }));
    const userApps = Array.from(appsMap.values());

    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const getTime = (val) => {
      if (!val) return 0;
      if (typeof val === 'object' && val.toMillis) return val.toMillis();
      if (typeof val === 'object' && val.seconds) return val.seconds * 1000;
      const parsed = new Date(val).getTime();
      return isNaN(parsed) ? 0 : parsed;
    };

    const isInterview = (s = '') => ['interview', 'interview scheduled', 'interview_scheduled'].includes(String(s).toLowerCase());
    const isShortlisted = (s = '') => ['shortlisted', 'under review', 'under_review', 'shortlist'].includes(String(s).toLowerCase());
    const isOffer = (s = '') => ['offer', 'offered', 'accepted'].includes(String(s).toLowerCase());

    const appsCount = userApps.length;
    const interviewsCount = userApps.filter(a => isInterview(a.status)).length;
    const shortlistedCount = userApps.filter(a => isShortlisted(a.status)).length;
    const offersCount = userApps.filter(a => isOffer(a.status)).length;

    const applications_this_week = userApps.filter(a => getTime(a.applied_at || a.createdAt) >= sevenDaysAgo).length;
    const interviews_this_week = userApps.filter(a => isInterview(a.status) && getTime(a.updated_at || a.applied_at || a.createdAt) >= sevenDaysAgo).length;
    const shortlisted_this_week = userApps.filter(a => isShortlisted(a.status) && getTime(a.updated_at || a.applied_at || a.createdAt) >= sevenDaysAgo).length;
    const offers_this_week = userApps.filter(a => isOffer(a.status) && getTime(a.updated_at || a.applied_at || a.createdAt) >= sevenDaysAgo).length;

    const stats = {
      applications: appsCount,
      interviews: interviewsCount,
      shortlisted: shortlistedCount,
      offers: offersCount,
      applications_this_week,
      interviews_this_week,
      shortlisted_this_week,
      offers_this_week,
    };

    // Sort apps to get latest application for tracker timeline
    userApps.sort((a, b) => getTime(b.applied_at || b.createdAt) - getTime(a.applied_at || a.createdAt));
    const latestApp = userApps[0] || null;

    // Relevant opportunity recommendation scoring based on profile skills & career goal
    const userSkills = (p.skills || []).map(s => String(s).toLowerCase());
    const careerGoal = String(p.careerGoal || p.desired_roles?.[0] || '').toLowerCase();
    const rawOpps = oppsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(o => o.is_active !== false && o.status !== 'Inactive');

    const scoredOpps = rawOpps.map(opp => {
      let score = 0;
      const title = String(opp.title || '').toLowerCase();
      const reqSkills = (opp.required_skills || opp.skills || []).map(s => String(s).toLowerCase());
      if (careerGoal && title.includes(careerGoal)) score += 5;
      reqSkills.forEach(s => {
        if (userSkills.includes(s)) score += 3;
      });
      return { opp, score };
    });

    scoredOpps.sort((a, b) => b.score - a.score);
    const recommendedOpps = scoredOpps.map(o => o.opp).slice(0, 6);

    const teamsCount = teamsSnap.data().count;
    const mentorsCount = bookingsSnap.data().count;

    // Calculate real points based on stats
    const profilePoints = (u.profileCompleted || p.profileCompletion || p.profile_completion || 0) * 10;
    const appPoints = appsCount * 50;
    const teamPoints = teamsCount * 100;
    const totalPoints = profilePoints + appPoints + teamPoints;

    // 2. Real Actionable Tasks (Today's Focus) driven by AI Roadmap
    let mission = { tasks: [], estimated_time: null, reward: null };
    
    if (roadmapDoc.exists) {
      const roadmapData = mapDoc(roadmapDoc);
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
      const roadmapData = mapDoc(roadmapDoc);
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
       const prj = mapDoc(projectsSnap.docs[0]);
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
    const activeOppsSnap = await db.collection("opportunities").where("status", "==", "Active").limit(1).get();
    if (!activeOppsSnap.empty) {
      const opp = mapDoc(activeOppsSnap.docs[0]);
      recommendations.push({
        id: activeOppsSnap.docs[0].id,
        type: 'job',
        title: opp.title,
        company: opp.company,
        description: `This opportunity aligns with your goal to become a ${careerTarget}.`,
        linkUrl: `/opportunities/${activeOppsSnap.docs[0].id}`,
        tags: [opp.type || 'Internship', opp.location || 'Remote']
      });
    }

    // D. Mentor Recommendation
    const mentorsSnap = await db.collection("mentors").limit(1).get();
    if (!mentorsSnap.empty) {
      const mentorDoc = mentorsSnap.docs[0];
      const m = mapDoc(mentorDoc);
      let mName = "Expert Mentor";
      if (m.user_id) {
         const mu = await db.collection("users").doc(m.user_id).get();
         if (mu.exists) mName = mapDoc(mu).name;
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
      const team = mapDoc(teamsRecSnap.docs[0]);
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

    // F. Teammate Recommendation
    const profilesSnap = await db.collection("profiles").where("role", "==", "student").limit(1).get();
    if (!profilesSnap.empty) {
      const pData = mapDoc(profilesSnap.docs[0]);
      if (profilesSnap.docs[0].id !== uid) {
        recommendations.push({
          id: profilesSnap.docs[0].id,
          type: 'teammate',
          title: pData.name || 'Recommended Teammate',
          description: `This student has complementary skills for your next project.`,
          linkUrl: `/profile/${profilesSnap.docs[0].id}`,
          tags: ['Peer matching', 'Collaboration']
        });
      }
    }

    // G. Hackathon Recommendation
    const hackathonsSnap = await db.collection("events").where("type", "==", "Hackathon").limit(1).get();
    if (!hackathonsSnap.empty) {
      const hack = mapDoc(hackathonsSnap.docs[0]);
      recommendations.push({
        id: hackathonsSnap.docs[0].id,
        type: 'event',
        title: hack.title || 'Upcoming Hackathon',
        description: `Join this hackathon to practice your skills and build your portfolio.`,
        linkUrl: `/events/${hackathonsSnap.docs[0].id}`,
        tags: ['Hackathon', 'Competition']
      });
    }

    // H. Community Recommendation
    const commsSnap = await db.collection("communities").limit(1).get();
    if (!commsSnap.empty) {
      const comm = mapDoc(commsSnap.docs[0]);
      recommendations.push({
        id: commsSnap.docs[0].id,
        type: 'community',
        title: comm.name || 'Tech Community',
        description: comm.description || `Connect with like-minded developers.`,
        linkUrl: `/communities/${commsSnap.docs[0].id}`,
        tags: ['Networking', 'Group']
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
    const profScore = profComp * 0.15;
    readinessScore += profScore;
    if (profComp < 80) improvements.push('Profile Completion');
    
    // Learning Progress (25%)
    let learnScore = 0;
    if (roadmapDoc.exists) {
      learnScore = (mapDoc(roadmapDoc).overall_progress || 0) * 0.25;
      readinessScore += learnScore;
      const activeStep = mapDoc(roadmapDoc).steps?.find(s => s.status === 'in_progress' || s.status === 'pending');
      if (activeStep) improvements.push(activeStep.title);
    } else {
      improvements.push('AI Career Roadmap');
    }
    
    // Skills (15%)
    const skillCount = p.skills?.length || 0;
    const skillsScore = Math.min(skillCount, 10) / 10 * 15;
    readinessScore += skillsScore;
    if (skillCount < 5) improvements.push('Skills');
    
    // Projects (15%)
    const projCount = p.projects?.length || 0;
    const projScore = Math.min(projCount, 3) / 3 * 15;
    readinessScore += projScore;
    if (projCount < 2) improvements.push('Projects');
    
    // Resume (10%)
    let resScore = 0;
    if (p.resume_url) {
      resScore = 10;
      readinessScore += 10;
    } else {
      improvements.push('Resume');
    }
    
    // Certificates (10%)
    const certCount = p.certificates?.length || 0;
    const certScore = Math.min(certCount, 2) / 2 * 10;
    readinessScore += certScore;
    if (certCount < 1 && !improvements.includes('Certificates') && improvements.length < 4) {
       improvements.push('Certificates');
    }
    
    // Applications (10%)
    const appScore = Math.min(appsCount, 5) / 5 * 10;
    readinessScore += appScore;
    if (appsCount < 1 && !improvements.includes('Applications') && improvements.length < 4) {
      improvements.push('Applications');
    }

    const details = {
      codingScore: (skillsScore / 15 * 12.5) + (projScore / 15 * 12.5),
      assessmentScore: learnScore,
      resumeScore: (profScore / 15 * 15) + resScore,
      interviewScore: (appScore / 10 * 12.5) + (certScore / 10 * 12.5)
    };
    
    const placementReadiness = {
      score: Math.round(readinessScore),
      details,
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
      stats,
      latestApp,
      applications: userApps,
      recommendedOpps,
      mission,
      recommendations,
      communityUpdates,
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

    const u = userDoc.exists ? mapDoc(userDoc) : {};
    const p = profileDoc.exists ? mapDoc(profileDoc) : {};
    const roadmapData = roadmapDoc.exists ? mapDoc(roadmapDoc) : null;

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
         const data = mapDoc(doc);
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
    const data = doc.exists ? mapDoc(doc) : { tasks: [], estimated_time: null, reward: null };

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
    res.json(doc.exists ? mapDoc(doc) : { score: 0, improvements: [] });
  } catch (err) {
    console.error("Error fetching placement readiness:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/students/recommendations
router.get("/recommendations", auth, async (req, res) => {
  try {
    const doc = await db.collection("aiRecommendations").doc(req.user.id).get();
    res.json(doc.exists ? mapDoc(doc) : { recommendations: [] });
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
    const reports = mapDocs(reportsSnap);
    reports.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
    res.json(reports[0]);
  } catch (err) {
    console.error("Error fetching weekly report:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;