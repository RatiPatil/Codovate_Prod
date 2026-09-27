const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { getAuth } = require('firebase-admin/auth');
const { db, admin, FieldValue } = require('../config/firebase');

async function seedAdmin() {
  const bcrypt = require('bcrypt');
  const email = 'superadmin@codovate.in';
  const password = 'Password@123';
  // Use getAuth() without passing app if it's the default app
  const auth = getAuth();

  try {
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('User already exists in Firebase Auth:', userRecord.uid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email: email,
          password: password,
          emailVerified: true,
          displayName: 'System Super Admin'
        });
        console.log('Created user in Firebase Auth:', userRecord.uid);
      } else {
        throw error;
      }
    }

    // Assign custom claims
    await auth.setCustomUserClaims(userRecord.uid, { role: 'super_admin' });
    console.log('Assigned super_admin custom claim.');

    // Create Firestore document
    const userDoc = {
      uid: userRecord.uid,
      email: email,
      firstName: 'System',
      lastName: 'Super Admin',
      name: 'System Super Admin',
      role: 'super_admin',
      recordStatus: 'ACTIVE',
      password_hash: await bcrypt.hash(password, 10),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: new Date()
    };

    await db.collection('users').doc(userRecord.uid).set(userDoc, { merge: true });
    console.log('User document created in Firestore.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding super admin:', error);
    process.exit(1);
  }
}

seedAdmin();
