const cron = require("node-cron");
const { db, admin } = require("../config/firebase");

// Utility to calculate Placement Readiness
const calculatePlacementReadiness = async (uid, u, p, appsCount) => {
  let readinessScore = 0;
  let improvements = [];

  // Profile (20%)
  const profileCompletion = u.profileCompleted || p.profileCompletion || 0;
  readinessScore += (profileCompletion / 100) * 20;
  if (profileCompletion < 80) improvements.push('Profile completeness');

  // Resume (15%)
  if (p.socialLinks?.resume) readinessScore += 15;
  else improvements.push('Resume missing');

  // Skills (15%)
  const skillsCount = p.skills?.length || 0;
  readinessScore += Math.min(skillsCount, 10) / 10 * 15;
  if (skillsCount < 3) improvements.push('Skills');

  // Projects (20%)
  const projectsCount = p.projects?.length || 0;
  readinessScore += Math.min(projectsCount, 3) / 3 * 20;
  if (projectsCount === 0) improvements.push('Projects');

  // Roadmap/Learning Progress (20%)
  const roadmapDoc = await db.collection("userRoadmaps").doc(uid).get();
  if (roadmapDoc.exists) {
    const rData = roadmapDoc.data();
    const roadmapProgress = rData.overall_progress || 0;
    readinessScore += (roadmapProgress / 100) * 20;
    if (roadmapProgress < 50) improvements.push('Roadmap progress');
  } else {
    improvements.push('No Active Roadmap');
  }

  // Applications (10%)
  readinessScore += Math.min(appsCount, 5) / 5 * 10;
  if (appsCount === 0) improvements.push('Applications');

  return {
    score: Math.round(readinessScore),
    improvements: improvements.slice(0, 4)
  };
};

const runDailyPipeline = async () => {
  console.log("🚀 [PIPELINE START] Running Daily Automation Pipeline...");
  const startTime = Date.now();

  try {
    // 1. Fetch all users
    const usersSnap = await db.collection("users").where("role", "==", "student").get();
    
    // Process in batches or concurrently
    const promises = usersSnap.docs.map(async (userDoc) => {
      const uid = userDoc.id;

      try {
        const [profileDoc, appsSnap] = await Promise.all([
          db.collection("profiles").doc(uid).get(),
          db.collection("applications").where("studentId", "==", uid).get(),
        ]);

        const p = profileDoc.exists ? profileDoc.data() : {};
        const u = userDoc.data();
        const appsCount = appsSnap.size;

        // --- STEP 1 & 2: Roadmap Check & Generate Daily Tasks ---
        let mission = { tasks: [], estimated_time: null, reward: null };
        const roadmapDoc = await db.collection("userRoadmaps").doc(uid).get();
        
        if (roadmapDoc.exists) {
          const roadmapData = roadmapDoc.data();
          const activeStep = roadmapData.steps?.find(s => s.status === 'in_progress' || s.status === 'pending');
          
          if (activeStep) {
            mission.estimated_time = activeStep.estimated_time || "45 Minutes";
            mission.reward = "+100 XP";
            
            if (activeStep.content) {
              if (!activeStep.content.quizPassed) {
                 mission.tasks.push({ id: `quiz_${activeStep.id}`, title: `Pass the quiz for ${activeStep.title}`, type: 'learning', actionUrl: `/roadmap/module/${activeStep.id}` });
              }
              const uncompletedAssignments = activeStep.content.assignments?.filter(a => !a.completed) || [];
              if (uncompletedAssignments.length > 0) {
                 mission.tasks.push({ id: `assignment_${activeStep.id}`, title: `Complete ${uncompletedAssignments.length} Assignment(s)`, type: 'action', actionUrl: `/roadmap/module/${activeStep.id}` });
              }
              mission.tasks.push({ id: `review_${activeStep.id}`, title: `Review Notes for ${activeStep.title}`, type: 'learning', actionUrl: `/roadmap/module/${activeStep.id}` });
            } else {
              mission.tasks = (activeStep.tasks || []).filter(t => !t.completed).slice(0, 3).map(t => ({ id: t.id, title: t.title, type: 'learning', actionUrl: `/roadmap/module/${activeStep.id}` }));
              if (mission.tasks.length === 0) {
                mission.tasks.push({ id: `start_${activeStep.id}`, title: `Start Module: ${activeStep.title}`, type: 'learning', actionUrl: `/roadmap/module/${activeStep.id}` });
              }
            }
          } else {
            mission.tasks.push({ id: 'roadmap_done', title: 'You finished your roadmap!', type: 'learning', actionUrl: '/roadmap' });
          }
        } else {
          mission.tasks.push({ id: 'generate_roadmap', title: 'Generate your AI Career Roadmap', type: 'action', actionUrl: '/roadmap' });
        }
        
        if (mission.tasks.length < 3) {
          if (!p.socialLinks?.resume) mission.tasks.push({ id: 'resume', title: 'Upload Resume', type: 'profile', actionUrl: '/profile' });
          if ((u.profileCompleted || p.profileCompletion || 0) < 100 && mission.tasks.length < 3) mission.tasks.push({ id: 'profile', title: 'Complete Profile Details', type: 'profile', actionUrl: '/profile' });
        }
        await db.collection("dailyTasks").doc(uid).set(mission, { merge: true });

        // --- STEP 3: Calculate Placement Readiness ---
        const readiness = await calculatePlacementReadiness(uid, u, p, appsCount);
        await db.collection("placementReadiness").doc(uid).set(readiness, { merge: true });

        // --- STEP 4: Generate AI Recommendations ---
        const recommendations = [];
        let activeTopic = "Programming Basics";
        if (roadmapDoc.exists) {
          const s = roadmapDoc.data().steps?.find(s => s.status === 'in_progress' || s.status === 'pending');
          if (s) activeTopic = s.title;
        }
        
        recommendations.push({
          id: `learning_${Date.now()}`,
          type: 'learning',
          title: `Master ${activeTopic}`,
          source: 'Codovate Learning',
          description: `Continue your roadmap module on ${activeTopic}.`,
          linkUrl: `/roadmap`,
          tags: ['Course', 'Highly Relevant']
        });
        
        recommendations.push({
          id: `project_${Date.now()}`,
          type: 'project',
          title: `Build a ${activeTopic} App`,
          difficulty: 'Intermediate',
          description: `Apply your knowledge of ${activeTopic} in a real-world project.`,
          linkUrl: `/opportunities`,
          tags: ['Project', 'Hands-on']
        });
        
        await db.collection("aiRecommendations").doc(uid).set({ recommendations }, { merge: true });

        // --- STEP 5: Generate Weekly Report ---
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 5) { // Friday
          await db.collection("weeklyReports").doc(`${uid}_${Date.now()}`).set({
            uid,
            weekEnding: new Date().toISOString(),
            readinessScore: readiness.score,
            tasksAssigned: mission.tasks.length,
            generatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        // --- STEP 6: Award XP & Goals ---
        let xp = (u.profileCompleted || p.profileCompletion || 0) * 10;
        xp += appsCount * 250;
        const teamsSnap = await db.collection("teams").where("members", "array-contains", uid).get();
        xp += teamsSnap.size * 500;
        xp += (p.skills?.length || 0) * 100;
        xp += (p.projects?.length || 0) * 300;
        
        if (roadmapDoc.exists) xp += (roadmapDoc.data().overall_progress || 0) * 20;

        await db.collection("userGoals").doc(uid).set({
          weeklyGoal: { title: "Complete 3 Roadmap Modules", current: roadmapDoc.exists ? Math.floor(((roadmapDoc.data().overall_progress || 0) / 100) * 10) % 3 : 0, target: 3 },
          monthlyChallenge: { title: "Apply to 5 Opportunities", current: appsCount, target: 5 },
          dailyStreak: (u.profileCompleted || p.profileCompletion || 0) >= 80 ? 14 : 1,
          totalXP: Math.round(xp),
          coins: Math.floor(xp / 10)
        }, { merge: true });

      } catch (err) {
        console.error(`Error processing user ${uid}:`, err);
      }
    });

    await Promise.all(promises);

    // --- STEP 7: Update Leaderboard (Dashboard auto-updates from totalXP in userGoals) ---

    console.log(`✅ [PIPELINE SUCCESS] Processed ${usersSnap.size} users in ${Date.now() - startTime}ms`);
    return { success: true, usersProcessed: usersSnap.size, executionTime: Date.now() - startTime };

  } catch (error) {
    console.error("❌ [PIPELINE ERROR] Critical failure:", error);
    return { success: false, error: error.message };
  }
};

const runRecruiterPipeline = async () => {
  console.log("🏢 [RECRUITER PIPELINE START] Running Recruiter Automation...");
  const startTime = Date.now();
  try {
    // 1. Send interview reminders (Next 24 Hours)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Simplification for presentation: Send reminder to any 'scheduled' interview
    const interviewsSnap = await db.collection("interviews").where("status", "==", "scheduled").get();
    
    const reminderPromises = interviewsSnap.docs.map(async (doc) => {
      const interview = doc.data();
      const iDate = new Date(interview.date);
      // If interview is within next 24 hours
      if (iDate > new Date() && iDate < tomorrow) {
        await db.collection("notifications").add({
          user_id: interview.student_id,
          title: "Interview Reminder",
          message: `You have an interview scheduled for tomorrow at ${iDate.toLocaleTimeString()}.`,
          type: "interview_reminder",
          read: false,
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });
    await Promise.all(reminderPromises);

    // 2. Generate Recruiter Analytics
    const companiesSnap = await db.collection("companies").get();
    const analyticsPromises = companiesSnap.docs.map(async (companyDoc) => {
      const companyId = companyDoc.id;
      
      const appsSnap = await db.collection("applications").where("company_id", "==", companyId).get();
      let total = 0, shortlisted = 0, interviewed = 0, hired = 0, rejected = 0;
      
      appsSnap.forEach(appDoc => {
        total++;
        const s = appDoc.data().status;
        if (s === 'shortlisted') shortlisted++;
        if (s === 'interview') interviewed++;
        if (s === 'hired' || s === 'selected') hired++;
        if (s === 'rejected') rejected++;
      });
      
      const matchRate = total > 0 ? Math.round(((shortlisted + interviewed + hired) / total) * 100) : 0;
      
      await db.collection("hiringAnalytics").doc(companyId).set({
        company_id: companyId,
        metrics: { total, shortlisted, interviewed, hired, rejected, matchRate },
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });
    await Promise.all(analyticsPromises);

    console.log(`✅ [RECRUITER PIPELINE SUCCESS] Execution Time: ${Date.now() - startTime}ms`);
  } catch (error) {
    console.error("❌ [RECRUITER PIPELINE ERROR]:", error);
  }
};

const startAutomationJobs = () => {
  cron.schedule("0 0 * * *", () => {
    console.log("⏰ Triggering Midnight Automation Pipeline...");
    runDailyPipeline();
    runRecruiterPipeline();
  });
  console.log("🛠️ Automation Jobs Scheduled (Cron).");
};

module.exports = {
  runDailyPipeline,
  runRecruiterPipeline,
  startAutomationJobs
};
