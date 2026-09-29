const admin = require('firebase-admin');
const { getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
let getAuth = (app) => {
  try {
    return require('firebase-admin/auth').getAuth(app);
  } catch (_) {
    return {
      verifyIdToken: async (token) => {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(token);
        if (!decoded) throw new Error('Invalid token');
        return decoded;
      },
      setCustomUserClaims: async () => {},
      createUser: async (userData) => ({ uid: 'user_' + Date.now(), ...userData }),
      getUserByEmail: async (email) => null,
      generateEmailVerificationLink: async (email) => `https://codovateprod.firebaseapp.com/verify?email=${encodeURIComponent(email)}`
    };
  }
};
require('dotenv').config();
const fs = require('fs');

let serviceAccount = null;

// Support Render Secret Files natively
if (fs.existsSync('/var/www/codovate/secrets/serviceAccountKey.json')) {
  serviceAccount = JSON.parse(
    fs.readFileSync('/var/www/codovate/secrets/serviceAccountKey.json', 'utf8')
  );
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
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
    } else {
      serviceAccount = require('./serviceAccountKey.json');
    }
  } catch (e) {
    console.warn("⚠️ Warning: serviceAccountKey.json not found or FIREBASE_SERVICE_ACCOUNT_JSON is invalid.");
  }
}

let db;
let storage;
const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'codovateprod.firebasestorage.app';
const projectId = process.env.FIREBASE_PROJECT_ID || 'codovateprod';

if (serviceAccount) {
  if (!getApps().length) {
    admin.initializeApp({
      credential: admin.credential ? admin.credential.cert(serviceAccount) : require('firebase-admin/app').cert(serviceAccount),
      storageBucket: bucketName
    });
  }
  console.log("✅ Firebase Admin initialized with serviceAccount for project:", serviceAccount.project_id || projectId);
  db = getFirestore();
  storage = getStorage();
  db.settings({ preferRest: true });
} else {
  if (!getApps().length) {
    admin.initializeApp({
      projectId,
      storageBucket: bucketName
    });
  }
  console.log("ℹ️ Firebase Admin initialized for project:", projectId);

  // In-Memory Document Store for local development when Google Cloud credentials are not mounted
  class LocalFirestoreStore {
    constructor() {
      this.collections = new Map();
    }

    _getCol(name) {
      if (!this.collections.has(name)) this.collections.set(name, new Map());
      return this.collections.get(name);
    }

    collection(name) {
      const col = this._getCol(name);
      const makeDocRef = (docId) => ({
        id: docId,
        get: async () => {
          const docData = col.get(docId);
          return {
            id: docId,
            exists: !!docData,
            data: () => (docData ? { ...docData } : undefined),
          };
        },
        set: async (data, opts = {}) => {
          if (opts.merge && col.has(docId)) {
            col.set(docId, { ...col.get(docId), ...data });
          } else {
            col.set(docId, { ...data });
          }
          return { id: docId };
        },
        update: async (data) => {
          const current = col.get(docId) || {};
          col.set(docId, { ...current, ...data });
          return { id: docId };
        },
        delete: async () => {
          col.delete(docId);
          return true;
        }
      });

      const buildQuery = (predicate) => {
        const queryDocs = () => {
          const matched = [];
          for (const [id, data] of col.entries()) {
            if (!predicate || predicate(data)) {
              matched.push({ id, exists: true, data: () => ({ ...data }) });
            }
          }
          return matched;
        };

        const queryObj = {
          limit: (n) => ({
            get: async () => {
              const res = queryDocs().slice(0, n);
              return { docs: res, empty: res.length === 0, size: res.length, forEach: (cb) => res.forEach(cb) };
            }
          }),
          orderBy: () => queryObj,
          get: async () => {
            const res = queryDocs();
            return { docs: res, empty: res.length === 0, size: res.length, forEach: (cb) => res.forEach(cb) };
          },
          onSnapshot: (cb) => {
            setTimeout(() => {
              const res = queryDocs();
              cb({ docs: res, empty: res.length === 0, size: res.length, forEach: (c) => res.forEach(c) });
            }, 0);
            return () => {};
          }
        };
        return queryObj;
      };

      return {
        doc: (id) => makeDocRef(id || ('doc_' + Math.random().toString(36).slice(2))),
        where: (field, op, val) => {
          let pred = () => true;
          if (op === '==') pred = (d) => d[field] === val;
          else if (op === '!=') pred = (d) => d[field] !== val;
          else if (op === 'array-contains') pred = (d) => Array.isArray(d[field]) && d[field].includes(val);
          return buildQuery(pred);
        },
        orderBy: () => buildQuery(),
        limit: (n) => buildQuery().limit(n),
        get: async () => buildQuery().get(),
        add: async (data) => {
          const id = 'doc_' + Math.random().toString(36).slice(2);
          col.set(id, { ...data });
          return { id };
        },
        onSnapshot: (cb) => buildQuery().onSnapshot(cb)
      };
    }

    batch() {
      const queue = [];
      return {
        set: (docRef, data, opts) => queue.push(() => docRef.set(data, opts)),
        update: (docRef, data) => queue.push(() => docRef.update(data)),
        delete: (docRef) => queue.push(() => docRef.delete()),
        commit: async () => {
          for (const fn of queue) await fn();
        }
      };
    }

    async runTransaction(cb) {
      return cb({
        get: async (ref) => ref.get(),
        set: (ref, data, opts) => ref.set(data, opts),
        update: (ref, data) => ref.update(data),
        delete: (ref) => ref.delete()
      });
    }
  }

  db = new LocalFirestoreStore();
  storage = {
    bucket: () => ({
      file: () => ({
        save: async () => {},
        getSignedUrl: async () => ['https://storage.googleapis.com/' + bucketName + '/placeholder.png'],
        delete: async () => {}
      })
    })
  };
}

module.exports = { admin, db, storage, getStorage, FieldValue, getAuth };
