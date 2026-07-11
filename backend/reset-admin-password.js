const { db } = require('./config/firebase');
const bcrypt = require('bcrypt');

async function resetAdminPassword() {
  const email = 'patilratikant8@gmail.com'; // Adjust if you used a different one
  const newPassword = 'Password@1234';

  try {
    const snapshot = await db.collection('users').where('email', '==', email).get();
    
    if (snapshot.empty) {
      console.log(`❌ No account found with email ${email}`);
      return;
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    
    // Hash the new password
    const hash = await bcrypt.hash(newPassword, 12);
    
    // Update the database
    await db.collection('users').doc(userDoc.id).update({ 
      password_hash: hash,
      role: 'admin' // ensure it remains admin
    });

    console.log(`✅ Successfully reset password for ${email}`);
    console.log(`👤 Username: ${userData.username || 'Not set'}`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 New Password: ${newPassword}`);
    
  } catch (error) {
    console.error("Error resetting password:", error);
  }
}

resetAdminPassword().then(() => process.exit());
