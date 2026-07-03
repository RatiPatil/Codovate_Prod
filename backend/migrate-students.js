require('dotenv').config();
const { db } = require('./config/firebase');

async function migrateStudents() {
  console.log("Starting migration of students to the new master collection...");
  
  const usersSnapshot = await db.collection('users').where('role', '==', 'student').get();
  console.log(`Found ${usersSnapshot.size} student users to migrate.`);
  
  // Also get any existing dummy students that might already be seeded
  
  let batch = db.batch();
  let count = 0;
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    
    // Get student profile
    const profileDoc = await db.collection('student_profiles').doc(userDoc.id).get();
    const profileData = profileDoc.exists ? profileDoc.data() : {};
    
    // Construct new student record
    const newStudentData = {
      id: userDoc.id, // preserve ID
      email: userData.email || '',
      phone: userData.phone || '', // Might be empty originally
      authUid: userData.id, // Using the old custom ID as authUid for now until they login
      providers: [],
      claimed: false,
      is_active: userData.is_active !== undefined ? userData.is_active : true,
      role: 'student',
      created_at: userData.created_at || new Date(),
      last_login_at: userData.last_login_at || null,
      profile_data: {
        name: userData.name || '',
        avatar: userData.avatar || '',
        college: profileData.college || '',
        branch: profileData.branch || '',
        year: profileData.year || null,
        skills: profileData.skills || [],
        profile_completion: profileData.profile_completion || 0,
        onboarding_completed: profileData.onboarding_completed || false,
        rank: userData.rank || null,
        points: userData.points || 0,
        badges: userData.badges || [],
        github: profileData.github || '',
        linkedin: profileData.linkedin || '',
        portfolio: profileData.portfolio || '',
        bio: profileData.bio || '',
        resume_data: profileData.resume_data || null
      }
    };
    
    // Create new document in 'students' collection. 
    // We can use the same document ID to make relationships easier.
    const studentRef = db.collection('students').doc(userDoc.id);
    batch.set(studentRef, newStudentData, { merge: true });
    
    count++;
    if (count % 400 === 0) {
      await batch.commit();
      console.log(`Committed ${count} students...`);
      batch = db.batch(); // Create a new batch
    }
  }
  
  if (count % 400 !== 0) {
    await batch.commit();
  }
  
  console.log(`Migration complete! Successfully migrated ${count} students.`);
  process.exit(0);
}

migrateStudents().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
