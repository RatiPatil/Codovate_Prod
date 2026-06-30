const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config();
const fs = require('fs');

let serviceAccount = null;

// Support Render Secret Files natively
if (fs.existsSync('/etc/secrets/serviceAccountKey.json')) {
  serviceAccount = require('/etc/secrets/serviceAccountKey.json');
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }
} else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Render sometimes escapes or strips newlines, this ensures the private key is formatted correctly
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  };
} else {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } else {
      serviceAccount = require('./serviceAccountKey.json');
    }
  } catch (e) {
    console.warn("⚠️ Warning: serviceAccountKey.json not found or FIREBASE_SERVICE_ACCOUNT_JSON is invalid.");
  }
}

let db;
if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential ? admin.credential.cert(serviceAccount) : require('firebase-admin/app').cert(serviceAccount),
  });
  console.log("✅ Firebase Admin initialized successfully.");
  db = getFirestore();
  // Force REST API instead of gRPC to fix Render timeout/retry issues
  db.settings({ preferRest: true });
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
