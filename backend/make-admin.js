const { db } = require('./config/firebase');

async function makeAdmins() {
  const emails = ['patilratikant8@gmail.com', 'patilratikant8999@gmail.com', 'patilratikant008@gmail.com'];
  
  for (const email of emails) {
    const snapshot = await db.collection('users').where('email', '==', email).get();
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      await db.collection('users').doc(userDoc.id).update({ role: 'admin' });
      console.log(`✅ Made ${email} an admin!`);
    }
  }
}

makeAdmins().then(() => process.exit());
