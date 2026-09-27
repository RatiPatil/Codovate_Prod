const { admin } = require('../config/firebase');
const { getAuth } = require('firebase-admin/auth');

async function deleteAllAuthUsers() {
  console.log("🔥 STARTING FIREBASE AUTHENTICATION USER PURGE...");
  let pageToken;
  let totalDeleted = 0;

  try {
    do {
      const listResult = await getAuth().listUsers(1000, pageToken);
      const uids = listResult.users.map(user => user.uid);

      if (uids.length > 0) {
        const deleteResult = await getAuth().deleteUsers(uids);
        totalDeleted += deleteResult.successCount;
        console.log(`  └─ Deleted batch of ${deleteResult.successCount} Firebase Auth users (Errors: ${deleteResult.failureCount})`);
      }

      pageToken = listResult.pageToken;
    } while (pageToken);

    console.log(`🎉 ALL FIREBASE AUTHENTICATION USERS SUCCESSFULLY DELETED! (Total: ${totalDeleted})`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error deleting Firebase Auth users:", err.message);
    process.exit(1);
  }
}

deleteAllAuthUsers();
