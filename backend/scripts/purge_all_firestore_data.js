const { db } = require('../config/firebase');

const collectionsToClear = [
  "users",
  "profiles",
  "applications",
  "opportunities",
  "teams",
  "team_members",
  "courses",
  "learningProgress",
  "student_connections",
  "connection_requests",
  "notifications",
  "platform_events",
  "mentors",
  "mentorSessions",
  "userRoadmaps",
  "projects",
  "codingStats",
  "activityLogs",
  "careerProfiles",
  "preferences",
  "analytics"
];

async function deleteCollection(collectionPath, batchSize = 100) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(query, resolve) {
  const snapshot = await query.get();

  if (snapshot.size === 0) {
    resolve();
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}

async function purgeDatabase() {
  console.log("🔥 STARTING FULL FIRESTORE DATABASE PURGE...");

  for (const coll of collectionsToClear) {
    try {
      console.log(`🧹 Clearing collection: ${coll}...`);
      await deleteCollection(coll);
      console.log(`  └─ ✅ Collection "${coll}" cleared.`);
    } catch (err) {
      console.error(`  └─ ❌ Error clearing collection "${coll}":`, err.message);
    }
  }

  console.log("🎉 ALL FIRESTORE DATA SUCCESSFULLY REMOVED!");
  process.exit(0);
}

purgeDatabase().catch(err => {
  console.error("Purge error:", err);
  process.exit(1);
});
