const eventBus = require("./eventBus");
const { db, admin } = require("../config/firebase");
const { syncDashboard } = require("../services/dashboardService");

/**
 * Log an activity
 */
async function logActivity(uid, type, title, description = "") {
  try {
    const logRef = db.collection("activityLogs").doc();
    await logRef.set({
      activityId: logRef.id,
      uid,
      type,
      title,
      description,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

/**
 * Handle PROFILE_UPDATED
 * 1. Calculate Profile Completion
 * 2. Merge data to resume
 * 3. Sync Dashboard
 * 4. Log activity
 */
eventBus.on("PROFILE_UPDATED", async ({ uid, profileData }) => {
  try {
    // 2. Merge basic identity data into Resume
    const resumeRef = db.collection("resumes").doc(uid);
    const resumeDoc = await resumeRef.get();
    
    if (resumeDoc.exists) {
      await resumeRef.set({
        personalInfo: {
          name: profileData.personalInfo?.name || "",
          email: profileData.personalInfo?.email || "",
          github: profileData.socialLinks?.github || "",
          linkedin: profileData.socialLinks?.linkedin || "",
          portfolio: profileData.socialLinks?.portfolio || ""
        },
        targetRole: profileData.headline || resumeDoc.data().targetRole
      }, { merge: true });
    }

    // 3. Sync dashboard
    await syncDashboard(uid);

    // 4. Log activity
    await logActivity(uid, "profile_update", "Updated Profile", "You updated your profile information.");
    
  } catch (err) {
    console.error("Error handling PROFILE_UPDATED:", err);
  }
});

/**
 * Handle PROJECT_ADDED
 * 1. Sync tech stack to skills
 * 2. Sync dashboard
 * 3. Milestone check (5 projects)
 * 4. Log activity
 */
eventBus.on("PROJECT_ADDED", async ({ uid, projectData }) => {
  try {
    // 1. Sync tech stack to skills
    if (projectData.techStack && projectData.techStack.length > 0) {
      const skillsRef = db.collection("skills").doc(uid);
      await skillsRef.set({
        technical: admin.firestore.FieldValue.arrayUnion(...projectData.techStack),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    // 2. Sync Dashboard
    await syncDashboard(uid);

    // 3. Log Activity
    await logActivity(uid, "project_added", `Published Project: ${projectData.title}`);

    // 4. Milestone Check
    const projectsSnap = await db.collection("projects").where("uid", "==", uid).get();
    if (projectsSnap.size === 5) {
      // Create a milestone notification in dashboard or logs
      await logActivity(uid, "milestone", "Achievement Unlocked: 5 Projects!", "You have successfully published 5 projects.");
    }

  } catch (err) {
    console.error("Error handling PROJECT_ADDED:", err);
  }
});

/**
 * Handle CERTIFICATE_ADDED
 * 1. Sync skills
 * 2. Sync dashboard
 * 3. Log activity
 */
eventBus.on("CERTIFICATE_ADDED", async ({ uid, certificateData }) => {
  try {
    // 1. Sync skills
    if (certificateData.skills && certificateData.skills.length > 0) {
      const skillsRef = db.collection("skills").doc(uid);
      await skillsRef.set({
        technical: admin.firestore.FieldValue.arrayUnion(...certificateData.skills),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    // 2. Sync Dashboard
    await syncDashboard(uid);

    // 3. Log Activity
    await logActivity(uid, "certificate_added", `Earned Certificate: ${certificateData.title}`);
  } catch (err) {
    console.error("Error handling CERTIFICATE_ADDED:", err);
  }
});

module.exports = eventBus;
