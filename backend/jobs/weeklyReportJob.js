const cron = require('node-cron');
const { db } = require('../config/firebase');

/**
 * Weekly Report Job
 * Runs every Friday at 23:59 (11:59 PM)
 * It takes a snapshot of placementReadiness and creates a weeklyReport entry.
 */
function startWeeklyReportJob() {
  // '59 23 * * 5' means 23:59 on Friday
  cron.schedule('59 23 * * 5', async () => {
    console.log("🕒 Running Weekly Report Job...");
    try {
      // 1. Get all active users or all users with a readiness score
      const snapshot = await db.collection("placementReadiness").get();
      
      const batch = db.batch();
      const weekEnding = new Date().toISOString();

      snapshot.forEach(doc => {
        const data = doc.data();
        const uid = data.uid;
        
        const reportRef = db.collection("weeklyReports").doc();
        batch.set(reportRef, {
          uid,
          weekEnding,
          readinessScore: data.readinessScore || 0,
          details: data.details || {},
          tasksAssigned: 3, // mock data for tasks assigned next week
          createdAt: new Date()
        });
      });

      await batch.commit();
      console.log(`✅ Weekly Report Job completed for ${snapshot.size} users.`);
    } catch (err) {
      console.error("❌ Weekly Report Job failed:", err);
    }
  });
}

module.exports = { startWeeklyReportJob };
