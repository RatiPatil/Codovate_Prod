const { db } = require('./config/firebase');

async function checkAdmin() {
  try {
    const snapshot = await db.collection('users').where('email', '==', 'superadmin@codovate.in').get();
    if (snapshot.empty) {
      console.log('User not found!');
    } else {
      console.log('User role:', snapshot.docs[0].data().role);
    }
  } catch (err) {
    console.error(err);
  }
}

checkAdmin().then(() => process.exit());
