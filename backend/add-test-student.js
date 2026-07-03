const { admin, db } = require('./config/firebase');

async function addTestStudent() {
  console.log("🌱 Adding test student...");
  try {
    const docRef = db.collection('students').doc(); // Auto-ID
    await docRef.set({
      phone_number: '+918262978564',
      name: 'Rati Patil Test',
      email: 'abc@xyz.com', // Added just in case they test Google Login later
      claimed: false,
      created_at: new Date(),
      status: 'active',
      role: 'student'
    });
    console.log("✅ Successfully added test student with phone: +918262978564");
  } catch (error) {
    console.error("❌ Error adding test student:", error);
  } finally {
    process.exit(0);
  }
}

addTestStudent();
