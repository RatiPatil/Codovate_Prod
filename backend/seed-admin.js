const bcrypt = require('bcryptjs');
const { db } = require('./config/firebase');

async function seedAdmin() {
  const email = 'admin@codovate.com';
  const password = 'admin'; // simple for demo
  
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    
    if (!snapshot.empty) {
      console.log('Admin already exists.');
      return;
    }

    const hash = await bcrypt.hash(password, 12);
    const newUserRef = usersRef.doc();
    
    const adminUser = {
      id: newUserRef.id,
      name: 'Codovate Admin',
      email: email,
      password_hash: hash,
      role: 'admin',
      is_verified: true,
      is_active: true,
      created_at: new Date()
    };
    
    await newUserRef.set(adminUser);
    console.log(`✅ Admin account created!\nEmail: ${email}\nPassword: ${password}`);
  } catch (err) {
    console.error('Failed to create admin:', err);
  }
}

seedAdmin().then(() => process.exit());
