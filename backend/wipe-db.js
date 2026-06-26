const { db } = require('./config/firebase');

async function wipeDatabase() {
  console.log('🗑️ Wiping Firestore Database...');
  
  try {
    const collections = await db.listCollections();
    
    for (const collection of collections) {
      console.log(`Clearing collection: ${collection.id}...`);
      const snapshot = await collection.get();
      
      const batchSize = 500;
      let batch = db.batch();
      let count = 0;
      let total = 0;

      for (const doc of snapshot.docs) {
        batch.delete(doc.ref);
        count++;
        total++;

        if (count >= batchSize) {
          await batch.commit();
          batch = db.batch();
          count = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
      }
      console.log(`✅ Deleted ${total} documents from ${collection.id}`);
    }
    
    console.log('🚀 Database wipe complete! 100% fresh start.');
  } catch (error) {
    console.error('❌ Error wiping database:', error);
  }
}

wipeDatabase();
