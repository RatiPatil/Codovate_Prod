const { db } = require('./config/firebase');

const collections = [
  'users',
  'student_profiles',
  'opportunities',
  'applications',
  'colleges',
  'companies',
  'projects',
  'teams',
  'mentors',
  'notifications',
  'audit_logs',
  'messages',
  'chat_rooms'
];

async function clearDb() {
  console.log("Starting DB wipe...");
  for (const collName of collections) {
    const snapshot = await db.collection(collName).get();
    if (snapshot.empty) continue;
    
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`Cleared collection: ${collName}`);
  }
  console.log("DB wiped successfully.");
}

clearDb().then(() => process.exit());
