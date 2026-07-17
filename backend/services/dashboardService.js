const { db } = require("../config/firebase");

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

    const profile = profileDoc.exists ? profileDoc.data() : {};
    const resume = resumeDoc.exists ? resumeDoc.data() : {};
    const portfolio = portfolioDoc.exists ? portfolioDoc.data() : {};
    
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
      roadmapProgress: roadmapSnapshot.exists ? (roadmapSnapshot.data().progress || 0) : 0,
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
      recentActivity: activitySnapshot.docs.map(doc => doc.data()),
      notifications: [], // Could be fetched if needed, or left for realtime feeds
      lastSynced: new Date()
    };

    await db.collection("dashboard").doc(uid).set(dashboardData, { merge: true });
    
  } catch (err) {
    console.error(`Failed to sync dashboard for ${uid}:`, err);
  }
}

module.exports = { syncDashboard };
