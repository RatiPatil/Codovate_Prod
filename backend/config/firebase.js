const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config();

let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else {
    serviceAccount = require('./serviceAccountKey.json');
  }
} catch (e) {
  console.warn("⚠️ Warning: serviceAccountKey.json not found or FIREBASE_SERVICE_ACCOUNT_JSON is invalid.");
}

let db;
if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential ? admin.credential.cert(serviceAccount) : require('firebase-admin/app').cert(serviceAccount),
  });
  console.log("✅ Firebase Admin initialized successfully.");
  db = getFirestore();
} else {
  console.warn("⚠️ Firebase Admin could not be fully initialized due to missing credentials. Using MOCK Firestore.");
  // Initialize with a dummy or let it fail depending on environment
  
  // Mock Firestore to prevent crashes
  const mockCollection = () => ({
    doc: () => ({
      get: async () => ({ exists: true, data: () => ({}) }),
      set: async () => ({}),
      update: async () => ({}),
      delete: async () => ({}),
      collection: mockCollection,
    }),
    where: () => mockCollection(),
    orderBy: () => mockCollection(),
    limit: () => mockCollection(),
    get: async () => ({ docs: [], empty: true, forEach: () => {} }),
    add: async () => ({ id: "mock-id" }),
  });
  
  db = {
    collection: mockCollection,
    runTransaction: async (cb) => cb(),
    batch: () => ({ set: () => {}, update: () => {}, delete: () => {}, commit: async () => {} })
  };
}

module.exports = { admin, db };
