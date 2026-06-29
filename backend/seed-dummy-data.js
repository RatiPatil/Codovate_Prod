const { admin, db } = require('./config/firebase');
const bcrypt = require('bcryptjs');

async function seedData() {
  console.log("🌱 Starting Dummy Data Seed...");

  try {
    const hash = await bcrypt.hash('password123', 12);
    const usersBatch = db.batch();
    const students = [];
    const mentors = [];

    // --- Create 5 Students ---
    for (let i = 1; i <= 5; i++) {
      const docRef = db.collection('users').doc(`dummy_student_${i}`);
      const data = {
        id: `dummy_student_${i}`,
        email: `student${i}@test.com`,
        name: `Student Test ${i}`,
        password_hash: hash,
        role: 'student',
        is_active: true,
        skills: ['React', 'Node.js', 'Python'],
        interests: ['Web Development', 'AI'],
        institution: 'Tech University',
        created_at: new Date()
      };
      usersBatch.set(docRef, data);
      students.push(data);
    }

    // --- Create 3 Mentors ---
    for (let i = 1; i <= 3; i++) {
      const docRef = db.collection('users').doc(`dummy_mentor_${i}`);
      const data = {
        id: `dummy_mentor_${i}`,
        email: `mentor${i}@test.com`,
        name: `Mentor Expert ${i}`,
        password_hash: hash,
        role: 'mentor',
        is_active: true,
        expertise: ['Career Guidance', 'System Design'],
        created_at: new Date()
      };
      usersBatch.set(docRef, data);
      mentors.push(data);
    }

    // --- Create 1 Admin ---
    const adminRef = db.collection('users').doc('dummy_super_admin');
    usersBatch.set(adminRef, {
      id: 'dummy_super_admin',
      email: 'admin@codovate.in',
      name: 'Super Admin',
      password_hash: hash,
      role: 'super_admin',
      is_active: true,
      created_at: new Date()
    });

    await usersBatch.commit();
    console.log("✅ Users seeded (Passwords: password123)");

    // --- Create Mentor Queries ---
    const queriesBatch = db.batch();
    const statuses = ['Submitted', 'Assigned', 'Answered', 'Escalated'];
    for (let i = 1; i <= 10; i++) {
      const queryRef = db.collection('mentor_queries').doc();
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const student = students[Math.floor(Math.random() * students.length)];
      const mentor = mentors[Math.floor(Math.random() * mentors.length)];
      
      queriesBatch.set(queryRef, {
        id: queryRef.id,
        student_id: student.id,
        mentor_id: ['Assigned', 'Answered', 'Escalated'].includes(randomStatus) ? mentor.id : null,
        session_id: `session_${i % 3}`,
        topic: `Need help with React project ${i}`,
        description: `I am stuck on a specific component mounting issue... ${i}`,
        status: randomStatus,
        created_at: new Date(),
        deadline_at: new Date(Date.now() + 4 * 60 * 60 * 1000)
      });
    }
    await queriesBatch.commit();
    console.log("✅ Mentor Queries seeded");

    // --- Create Networking Connections ---
    const connectionsBatch = db.batch();
    for (let i = 1; i <= 5; i++) {
      const connRef = db.collection('student_connections').doc();
      // connect student 1 to others
      connectionsBatch.set(connRef, {
        sender_id: 'dummy_student_1',
        receiver_id: `dummy_student_${i + 1}`,
        status: i % 2 === 0 ? 'accepted' : 'pending',
        chat_expires_at: i % 2 === 0 ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
        created_at: new Date()
      });
    }
    await connectionsBatch.commit();
    console.log("✅ Student Connections seeded");

    console.log("🎉 All Dummy Data Seeded Successfully!");
    process.exit(0);

  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seedData();
