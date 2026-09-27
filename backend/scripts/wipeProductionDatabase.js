const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { db } = require('../config/firebase');

const collectionsToDelete = [
  'activityLogs', 'aiRecommendations', 'aiSkillGap', 'analytics', 'applications', 
  'auditLogs', 'audit_logs', 'badges', 'careerProfiles', 'certificates', 'colleges', 
  'companies', 'dailyTasks', 'dashboard', 'import_history', 'interviews', 
  'learningProfiles', 'learningProgress', 'loginHistory', 'mentorQueries', 
  'mentor_queries', 'mentors', 'notifications', 'opportunities', 'placementReadiness', 
  'platform_events', 'point_ledger', 'preferences', 'profiles', 'projects', 
  'resumes', 'student_chat_messages', 'student_connections', 'students', 
  'team_discussions', 'team_members', 'teams', 'userGoals', 'userRoadmaps', 
  'users_versions'
];

async function deleteCollection(collectionPath, batchSize) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db, query, resolve) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve();
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}

async function cleanUsersCollection() {
  console.log('Cleaning users collection...');
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  let deletedCount = 0;
  
  // We need to chunk the deletes because Firestore batch limit is 500
  const docsToDelete = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.role !== 'super_admin' && data.email !== 'superadmin@codovate.in') {
      docsToDelete.push(doc.ref);
    } else {
      console.log(`Preserving super_admin: ${data.email || doc.id}`);
    }
  });

  for (let i = 0; i < docsToDelete.length; i += 500) {
    const batch = db.batch();
    const chunk = docsToDelete.slice(i, i + 500);
    chunk.forEach(ref => batch.delete(ref));
    await batch.commit();
    deletedCount += chunk.length;
  }

  console.log(`Deleted ${deletedCount} non-admin users.`);
}

async function wipeDatabase() {
  console.log('STARTING DESTRUCTIVE DATABASE WIPE...');
  
  try {
    for (const collection of collectionsToDelete) {
      console.log(`Deleting collection: ${collection}`);
      await deleteCollection(collection, 500);
      console.log(`Finished deleting collection: ${collection}`);
    }

    await cleanUsersCollection();

    console.log('DATABASE WIPE COMPLETE.');
    process.exit(0);
  } catch (err) {
    console.error('Error during database wipe:', err);
    process.exit(1);
  }
}

wipeDatabase();
