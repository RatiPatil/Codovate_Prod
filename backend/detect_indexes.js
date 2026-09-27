const { db } = require('./config/firebase');

const collections = [
  'users',
  'organizations',
  'colleges',
  'academic_years',
  'students',
  'faculty',
  'mentors',
  'companies',
  'recruiters',
  'opportunities',
  'applications',
  'interviews',
  'offers',
  'placement_records',
  'departments',
  'programs',
  'semesters'
];

async function detect() {
  const missingIndexes = [];

  console.log('Detecting missing Firestore Composite Indexes...');
  
  for (const collection of collections) {
    try {
      await db.collection(collection)
        .where('recordStatus', 'in', ['ACTIVE', 'RESTORED'])
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
        
      console.log(`[OK] ${collection}`);
    } catch (error) {
      if (error.message.includes('FAILED_PRECONDITION') || error.message.includes('requires an index')) {
        // Extract the URL from the error message
        const match = error.message.match(/(https:\/\/console\.firebase\.google\.com[^\s]+)/);
        if (match) {
          missingIndexes.push({
            collection,
            url: match[1]
          });
          console.log(`[MISSING INDEX] ${collection}`);
        } else {
          console.log(`[ERROR] ${collection}: ${error.message}`);
        }
      } else {
        console.log(`[ERROR] ${collection}: ${error.message}`);
      }
    }
  }

  console.log('\n======================================');
  console.log(`FOUND ${missingIndexes.length} MISSING INDEXES`);
  console.log('======================================\n');
  
  missingIndexes.forEach(item => {
    console.log(`Collection: ${item.collection}`);
    console.log(`Link: ${item.url}\n`);
  });
  
  process.exit(0);
}

detect();
