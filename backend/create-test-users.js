const { admin, db } = require('./config/firebase');
const { getAuth } = require('firebase-admin/auth');

async function createTestUsers() {
  try {
    console.log('Creating test student...');
    // Create student in Firebase Auth
    const studentAuth = await getAuth().createUser({
      email: 'student@codovate.in',
      password: 'password123',
      displayName: 'Test Student'
    }).catch(e => {
        if(e.code === 'auth/email-already-exists') {
            return getAuth().getUserByEmail('student@codovate.in');
        }
        throw e;
    });
    
    // Save student to Firestore
    await db.collection('users').doc(studentAuth.uid).set({
      email: 'student@codovate.in',
      name: 'Test Student',
      role: 'student',
      skills: ['React', 'JavaScript'],
      interests: ['Web Dev', 'AI'],
      institution: 'Codovate University'
    });
    console.log('✅ Student created successfully! (student@codovate.in / password123)');

    console.log('Creating test mentor...');
    // Create mentor in Firebase Auth
    const mentorAuth = await getAuth().createUser({
      email: 'mentor@codovate.in',
      password: 'password123',
      displayName: 'Test Mentor'
    }).catch(e => {
        if(e.code === 'auth/email-already-exists') {
            return getAuth().getUserByEmail('mentor@codovate.in');
        }
        throw e;
    });

    // Save mentor to Firestore
    await db.collection('users').doc(mentorAuth.uid).set({
      email: 'mentor@codovate.in',
      name: 'Test Mentor',
      role: 'mentor',
      expertise: ['Web Dev', 'Career Guidance']
    });
    console.log('✅ Mentor created successfully! (mentor@codovate.in / password123)');

    process.exit(0);
  } catch (error) {
    console.error('Error creating users:', error);
    process.exit(1);
  }
}

createTestUsers();
