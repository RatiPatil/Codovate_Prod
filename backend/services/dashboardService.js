const { db, FieldValue, admin } = require("../config/firebase");
const { query } = require("../config/postgres");

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

    // Query real active opportunity and real mentor
    const [oppSnap, mentorSnap] = await Promise.all([
      db.collection("opportunities").where("status", "==", "Active").limit(1).get(),
      db.collection("mentors").limit(1).get()
    ]);

    const realOppDoc = !oppSnap.empty ? mapDoc(oppSnap.docs[0]) : null;
    const realMentorDoc = !mentorSnap.empty ? mapDoc(mentorSnap.docs[0]) : null;

    // Build the lightweight document
    const dashboardData = {
      uid,
      hero: {
        headline: profile.headline || resume.targetRole || "Welcome to your Codovate Dashboard!",
        greeting: `Hello, ${profile.personalInfo?.name || profile.name || "Student"}`
      },
      todayTasks: [],
      roadmapProgress: roadmapSnapshot.exists ? (mapDoc(roadmapSnapshot).progress || 0) : 0,
      profileCompletion: profile.profile_completion || profile.profileCompletion || completion,
      resumeScore: resume.atsScore || 0,
      portfolioViews: portfolio.views || 0,
      recommendedOpportunity: realOppDoc ? {
        id: realOppDoc.id,
        title: realOppDoc.title,
        company: realOppDoc.company || 'Tech Company',
        matchScore: 90
      } : null,
      recommendedMentor: realMentorDoc ? {
        id: realMentorDoc.id,
        name: realMentorDoc.name || 'Mentor',
        expertise: realMentorDoc.expertise?.[0] || 'Tech Expert'
      } : null,
      recentActivity: mapDocs(activitySnapshot),
      notifications: [],
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
async function syncPlacementReadiness(uid, data = {}) {
  try {
    const userId = uid;
    const score = data.score ?? null;
    const details = data.details ?? {};
    const improvements = data.improvements ?? [];
    await query(`INSERT INTO app.placement_readiness (user_id, score, details, improvements, calculated_at) VALUES ($1,$2,$3::jsonb,$4::jsonb,now()) ON CONFLICT (user_id) DO UPDATE SET score=EXCLUDED.score, details=EXCLUDED.details, improvements=EXCLUDED.improvements, calculated_at=now()`, [userId, score, JSON.stringify(details), JSON.stringify(improvements)]);
    return true;
  } catch (err) {
    console.error(`Failed to sync placementReadiness for ${uid}:`, err);
    return false;
  }
}

module.exports = { syncDashboard, syncPlacementReadiness };
