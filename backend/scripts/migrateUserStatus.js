const { admin, db, FieldValue } = require('../config/firebase');

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

async function migrateUserStatus() {
  console.log('🚀 Starting User Status Migration to recordStatus...');
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  let totalMigrated = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const data = mapDoc(doc);
    const updateData = {};
    let shouldUpdate = false;
    
    // Determine the true status
    let finalStatus = 'ACTIVE';
    
    if (data.lifecycle) {
      if (['ACTIVE', 'SUSPENDED', 'LOCKED', 'DISABLED', 'DELETED'].includes(data.lifecycle.toUpperCase())) {
        finalStatus = data.lifecycle.toUpperCase();
      }
    } else if (data.status === 'suspended' || data.status === 'banned' || data.status === 'inactive' || data.status === 'deleted') {
      if (data.status === 'deleted') finalStatus = 'DELETED';
      else finalStatus = 'SUSPENDED';
    } else if (data.is_active === false || data.isActive === false) {
      finalStatus = 'SUSPENDED';
    }
    
    // Always enforce recordStatus
    if (data.recordStatus !== finalStatus) {
      updateData.recordStatus = finalStatus;
      shouldUpdate = true;
    }
    
    // Delete legacy fields
    if (data.is_active !== undefined) {
      updateData.is_active = FieldValue.delete();
      shouldUpdate = true;
    }
    if (data.isActive !== undefined) {
      updateData.isActive = FieldValue.delete();
      shouldUpdate = true;
    }
    if (data.lifecycle !== undefined) {
      updateData.lifecycle = FieldValue.delete();
      shouldUpdate = true;
    }
    if (data.status !== undefined) {
      updateData.status = FieldValue.delete();
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      batch.update(doc.ref, updateData);
      batchCount++;
      totalMigrated++;

      if (batchCount === 500) {
        await batch.commit();
        console.log(`✅ Committed batch of 500 migrations...`);
        batch = db.batch();
        batchCount = 0;
      }
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`\n🎉 Migration Complete! Total users standardized: ${totalMigrated}`);
}

migrateUserStatus()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
