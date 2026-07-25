const { db, admin } = require("../config/firebase");

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

/**
 * Calculates a lightweight aggregate of the user's dashboard data
 * and stores it in the `dashboard` collection for fast retrieval.
 */
async function syncDashboard(uid) {
  try {
    const [
      profileDoc,
      resumeDoc,
      portfolioDoc,
      activitySnapshot,
      roadmapSnapshot
    ] = await Promise.all([
      db.collection("profiles").doc(uid).get(),
      db.collection("resumes").doc(uid).get(),
      db.collection("portfolios").doc(uid).get(),
      db.collection("activityLogs").where("uid", "==", uid).orderBy("createdAt", "desc").limit(5).get(),
      db.collection("roadmaps").doc(uid).get() // if roadmaps exist per uid
    ]);

    const profile = profileDoc.exists ? mapDoc(profileDoc) : {};
    const resume = resumeDoc.exists ? mapDoc(resumeDoc) : {};
    const portfolio = portfolioDoc.exists ? mapDoc(portfolioDoc) : {};
    
    // Calculate Profile Completion
    let completion = 0;
    if (profile.personalInfo?.email) completion += 20;
    if (profile.education?.length) completion += 20;
    if (profile.skills?.length) completion += 20;
    if (resume.atsScore > 0) completion += 20;
    if (portfolio.public) completion += 20;

    // Build the lightweight document
    const dashboardData = {
      uid,
      hero: {
        headline: profile.headline || resume.targetRole || "Welcome to your Codovate Dashboard!",
        greeting: `Hello, ${profile.personalInfo?.name || "Student"}`
      },
      todayTasks: [
        { id: "1", title: "Complete Daily Coding Challenge", completed: false },
        { id: "2", title: "Review Mock Interview Feedback", completed: false }
      ],
      roadmapProgress: roadmapSnapshot.exists ? (mapDoc(roadmapSnapshot).progress || 0) : 0,
      profileCompletion: completion,
      resumeScore: resume.atsScore || 0,
      portfolioViews: portfolio.views || 0,
      recommendedOpportunity: {
        id: "mock-opp-1",
        title: "Software Engineering Intern",
        company: "Tech Corp",
        matchScore: 85
      },
      recommendedMentor: {
        id: "mock-mentor-1",
        name: "Jane Doe",
        expertise: "Frontend Developer"
      },
      recentActivity: mapDocs(activitySnapshot),
      notifications: [], // Could be fetched if needed, or left for realtime feeds
      lastSynced: new Date()
    };

    await db.collection("dashboard").doc(uid).set(dashboardData, { merge: true });
    
    // Calculate and Sync Placement Readiness
    await syncPlacementReadiness(uid);
    
  } catch (err) {
    console.error(`Failed to sync dashboard for ${uid}:`, err);
  }
}

/**
 * Calculates overall placement readiness based on coding stats, assessments, resume, and interviews.
 */
async function syncPlacementReadiness(uid) {
  try {
    const [
      codingStatsDoc,
      assessmentsSnap,
      resumeReviewsSnap,
      mockInterviewsSnap
    ] = await Promise.all([
      db.collection("codingStats").doc(uid).get(),
      db.collection("skillAssessments").where("uid", "==", uid).get(),
      db.collection("resumeReviews").where("uid", "==", uid).orderBy("createdAt", "desc").limit(1).get(),
      db.collection("mockInterviews").where("uid", "==", uid).orderBy("createdAt", "desc").limit(5).get()
    ]);

    let readinessScore = 0;
    const details = {
      codingScore: 0,
      assessmentScore: 0,
      resumeScore: 0,
      interviewScore: 0
    };

    // 1. Coding Score (max 25)
    if (codingStatsDoc.exists) {
      const stats = mapDoc(codingStatsDoc);
      details.codingScore = Math.min(25, (stats.completedCount || 0) * 0.5 + (stats.streak || 0) * 1);
    }

    // 2. Assessment Score (max 25)
    if (!assessmentsSnap.empty) {
      let totalAssessment = 0;
      assessmentsSnap.forEach(doc => {
        totalAssessment += (mapDoc(doc).score || 0);
      });
      const avg = totalAssessment / assessmentsSnap.size;
      details.assessmentScore = Math.min(25, (avg / 100) * 25);
    }

    // 3. Resume Score (max 25)
    if (!resumeReviewsSnap.empty) {
      const latestResume = mapDoc(resumeReviewsSnap.docs[0]);
      details.resumeScore = Math.min(25, ((latestResume.atsScore || 0) / 100) * 25);
    }

    // 4. Interview Score (max 25)
    if (!mockInterviewsSnap.empty) {
      let totalInt = 0;
      mockInterviewsSnap.forEach(doc => {
        const data = mapDoc(doc);
        const avgScore = ((data.confidenceScore || 0) + (data.communicationScore || 0) + (data.technicalAccuracy || 0)) / 3;
        totalInt += avgScore;
      });
      const avg = totalInt / mockInterviewsSnap.size;
      details.interviewScore = Math.min(25, (avg / 100) * 25);
    }

    readinessScore = Math.round(details.codingScore + details.assessmentScore + details.resumeScore + details.interviewScore);

    await db.collection("placementReadiness").doc(uid).set({
      uid,
      readinessScore,
      details,
      lastCalculated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

  } catch (err) {
    console.error(`Failed to sync placementReadiness for ${uid}:`, err);
  }
}

module.exports = { syncDashboard, syncPlacementReadiness };
