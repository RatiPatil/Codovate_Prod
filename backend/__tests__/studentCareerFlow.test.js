const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Ensure secret is present for tests
process.env.JWT_SECRET = 'test_jwt_secret_codovate_2026';
process.env.NODE_ENV = 'test';

// In-Memory Firestore mock data store
const collections = {
  users: new Map(),
  profiles: new Map(),
  opportunities: new Map(),
  applications: new Map(),
  notifications: new Map(),
  dashboard: new Map(),
  roles: new Map(),
  bookmarks: new Map(),
  analytics: new Map(),
  careerProfiles: new Map(),
};

function resetStore() {
  for (const key of Object.keys(collections)) {
    collections[key].clear();
  }
}

// Helper to create chained Firestore query mock
function createQuery(collectionName, filters = []) {
  return {
    where(field, op, val) {
      return createQuery(collectionName, [...filters, { field, op, val }]);
    },
    select() {
      return this;
    },
    orderBy() {
      return this;
    },
    limit() {
      return this;
    },
    async get() {
      const col = collections[collectionName] || new Map();
      let results = [];
      for (const [id, data] of col.entries()) {
        let match = true;
        for (const f of filters) {
          if (f.op === '==' && data[f.field] !== f.val) {
            match = false;
            break;
          }
        }
        if (match) {
          results.push({
            id,
            data: () => ({ ...data }),
            exists: true,
            ref: {
              id,
              async update(d) {
                const existing = col.get(id) || {};
                col.set(id, { ...existing, ...d });
              },
              async set(d) {
                col.set(id, { ...d });
              },
              async delete() {
                col.delete(id);
              },
            },
          });
        }
      }
      return {
        docs: results,
        empty: results.length === 0,
        size: results.length,
        forEach(cb) {
          results.forEach(cb);
        },
      };
    },
  };
}

// Mock Firestore DB
const mockDb = {
  collection(name) {
    if (!collections[name]) {
      collections[name] = new Map();
    }
    const col = collections[name];

    return {
      doc(id) {
        const docId = id || ('doc_' + Math.random().toString(36).substring(2, 11));
        return {
          id: docId,
          async get() {
            const has = col.has(docId);
            return {
              id: docId,
              exists: has,
              data: () => (has ? { ...col.get(docId) } : undefined),
            };
          },
          async set(data, options = {}) {
            const existing = col.get(docId) || {};
            if (options.merge) {
              col.set(docId, { ...existing, ...data });
            } else {
              col.set(docId, { ...data });
            }
            return { writeTime: new Date() };
          },
          async update(data) {
            const existing = col.get(docId) || {};
            col.set(docId, { ...existing, ...data });
            return { writeTime: new Date() };
          },
          async delete() {
            col.delete(docId);
            return {};
          },
        };
      },
      select() {
        return createQuery(name);
      },
      async add(data) {
        const id = 'gen_' + Math.random().toString(36).substring(2, 9);
        col.set(id, { ...data });
        return {
          id,
          get: async () => ({
            id,
            exists: true,
            data: () => ({ ...data }),
          }),
        };
      },
      where(field, op, val) {
        return createQuery(name, [{ field, op, val }]);
      },
      orderBy() {
        return createQuery(name);
      },
      limit() {
        return createQuery(name);
      },
      async get() {
        return createQuery(name).get();
      },
    };
  },
  batch() {
    const ops = [];
    return {
      set(docRef, data, options = {}) {
        ops.push(async () => docRef.set(data, options));
      },
      update(docRef, data) {
        ops.push(async () => docRef.update(data));
      },
      delete(docRef) {
        ops.push(async () => docRef.delete());
      },
      async commit() {
        for (const op of ops) {
          await op();
        }
      },
    };
  },
  async runTransaction(cb) {
    const transaction = {
      async get(docRef) {
        return docRef.get();
      },
      set(docRef, data, opts) {
        docRef.set(data, opts);
      },
      update(docRef, data) {
        docRef.update(data);
      },
      delete(docRef) {
        docRef.delete();
      },
    };
    return cb(transaction);
  },
};

// Mock config/firebase
jest.mock('../config/firebase', () => ({
  db: mockDb,
  admin: {
    firestore: {
      FieldValue: {
        serverTimestamp: () => new Date().toISOString(),
        increment: (n) => n,
        arrayUnion: (...items) => items,
      },
    },
  },
  FieldValue: {
    serverTimestamp: () => new Date().toISOString(),
    increment: (n) => n,
    arrayUnion: (...items) => items,
  },
  getAuth: () => ({
    verifyIdToken: async (token) => {
      if (token === 'valid_firebase_token_student1') {
        return { uid: 'student_1', email: 'student1@example.com', role: 'student' };
      }
      throw new Error('Invalid Firebase Token');
    },
  }),
}));

const studentRouter = require('../routes/students');
const opportunityRouter = require('../routes/opportunities');
const applicationRouter = require('../routes/applications');
const notificationRouter = require('../routes/notifications');

const app = express();
app.use(express.json());

// Mock socket.io on req
app.use((req, res, next) => {
  req.io = {
    to: () => ({ emit: () => {} }),
    emit: () => {},
  };
  next();
});

app.use('/api/students', studentRouter);
app.use('/api/opportunities', opportunityRouter);
app.use('/api/applications', applicationRouter);
app.use('/api/notifications', notificationRouter);

// Generate tokens for testing
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

const studentAToken = generateToken({
  id: 'student_A',
  uid: 'student_A',
  role: 'student',
  name: 'Student A',
  email: 'student_a@test.com',
});

const studentBToken = generateToken({
  id: 'student_B',
  uid: 'student_B',
  role: 'student',
  name: 'Student B',
  email: 'student_b@test.com',
});

const adminToken = generateToken({
  id: 'admin_1',
  uid: 'admin_1',
  role: 'admin',
  name: 'Platform Admin',
  email: 'admin@codovate.in',
});

describe('PHASE 7: Student End-to-End Career Flow Tests', () => {
  beforeEach(() => {
    resetStore();

    // Seed roles
    collections.roles.set('student', {
      name: 'Student',
      permissions: ['opportunities.view', 'applications.create', 'applications.view'],
    });
    collections.roles.set('admin', {
      name: 'Admin',
      permissions: ['*'],
    });

    // Seed Student A
    collections.users.set('student_A', {
      name: 'Student A',
      email: 'student_a@test.com',
      role: 'student',
      college: 'Test College',
      onboarding_completed: true,
    });
    collections.profiles.set('student_A', {
      full_name: 'Student A',
      college: 'Test College',
      skills: ['JavaScript'],
      graduation_year: '2026',
    });

    // Seed Student B
    collections.users.set('student_B', {
      name: 'Student B',
      email: 'student_b@test.com',
      role: 'student',
      college: 'Other Institute',
      onboarding_completed: true,
    });
    collections.profiles.set('student_B', {
      full_name: 'Student B',
      college: 'Other Institute',
      skills: ['Python'],
      graduation_year: '2025',
    });

    // Seed an Opportunity
    collections.opportunities.set('opp_react_dev', {
      title: 'Frontend React Developer',
      company: 'Tech Corp',
      type: 'internship',
      location: 'Bangalore, India',
      mode: 'hybrid',
      stipend: '₹35,000/month',
      deadline: '2026-12-31',
      description: 'Exciting frontend internship working with React and modern UI.',
      skills: ['React', 'JavaScript', 'Tailwind'],
      eligibility: 'B.Tech / MCA 2025 or 2026 batch',
      status: 'active',
      recruiter_email: 'recruiter_private@techcorp.com',
      recruiter_phone: '+91 9876543210',
      internal_notes: 'Target top tier candidates only',
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Protected Student Route
  // ─────────────────────────────────────────────────────────────
  describe('1. Protected Student Route', () => {
    it('rejects unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/students/profile');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('AUTH_NO_TOKEN');
    });

    it('allows authenticated student to access their own profile', async () => {
      const res = await request(app)
        .get('/api/students/profile')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Student A');
      expect(res.body.college).toBe('Test College');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Profile Ownership & Persistence
  // ─────────────────────────────────────────────────────────────
  describe('2. Profile Ownership & Persistence', () => {
    it('persists profile updates to Firestore for authenticated user', async () => {
      const updateData = {
        college: 'Apex Engineering College',
        degree: 'B.Tech',
        branch: 'Computer Science',
        graduation_year: '2026',
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
        skills: ['React', 'Node.js', 'TypeScript', 'Firestore'],
        career_goals: 'Senior Frontend Architect',
        desired_role: 'Full Stack Engineer',
        domain_interests: ['Web Development', 'Cloud Computing'],
        experience_level: 'entry',
        resume_url: 'https://codovateprod.appspot.com/resumes/student_a.pdf',
        portfolio_url: 'https://studenta.dev',
        github_url: 'https://github.com/studenta',
        linkedin_url: 'https://linkedin.com/in/studenta',
      };

      const res = await request(app)
        .put('/api/students/profile')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Profile updated successfully');

      // Verify persistence in in-memory Firestore
      const savedProfile = collections.profiles.get('student_A');
      expect(savedProfile.college || savedProfile.education?.college).toBe('Apex Engineering College');
      expect(savedProfile.degree || savedProfile.education?.degree).toBe('B.Tech');
      expect(savedProfile.city || savedProfile.personalInfo?.city).toBe('Pune');
      expect(savedProfile.skills).toEqual(expect.arrayContaining(['React', 'Node.js', 'TypeScript', 'Firestore']));
      expect(savedProfile.profileCompletion).toBeGreaterThan(0);

      // Verify users document also received synchronized updates
      const savedUser = collections.users.get('student_A');
      expect(savedUser.college).toBe('Apex Engineering College');
      expect(savedUser.skills).toEqual(expect.arrayContaining(['React', 'Node.js']));
    });

    it('guarantees Student A cannot modify Student B profile', async () => {
      // Student A submits update with body containing someone else's ID
      await request(app)
        .put('/api/students/profile')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          id: 'student_B',
          uid: 'student_B',
          college: 'Malicious College Hijack',
        });

      // Student B's profile must remain untouched
      const studentBProfile = collections.profiles.get('student_B');
      expect(studentBProfile.college).toBe('Other Institute');
      expect(studentBProfile.college).not.toBe('Malicious College Hijack');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Opportunity Discovery & Sanitization
  // ─────────────────────────────────────────────────────────────
  describe('3. Opportunity Discovery & Sanitization', () => {
    it('loads active opportunities list', async () => {
      const res = await request(app)
        .get('/api/opportunities')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].title).toBe('Frontend React Developer');
    });

    it('returns opportunity details and strips sensitive recruiter fields for students', async () => {
      const res = await request(app)
        .get('/api/opportunities/opp_react_dev')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Frontend React Developer');
      expect(res.body.company).toBe('Tech Corp');
      expect(res.body.stipend).toBe('₹35,000/month');
      expect(res.body.has_applied).toBe(false);

      // Sensitive recruiter fields must NOT be exposed
      expect(res.body.recruiter_email).toBeUndefined();
      expect(res.body.recruiter_phone).toBeUndefined();
      expect(res.body.internal_notes).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Application Creation
  // ─────────────────────────────────────────────────────────────
  describe('4. Application Creation Flow', () => {
    it('creates an application linked to authenticated student UID and opportunity', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({ opportunity_id: 'opp_react_dev' });

      expect(res.status).toBe(201);
      expect(res.body.message).toContain('Application submitted successfully');
      expect(res.body.application).toBeDefined();
      expect(res.body.application.opportunity_id).toBe('opp_react_dev');
      expect(res.body.application.status).toBe('Applied');

      // Verify Firestore application document
      const apps = Array.from(collections.applications.values());
      expect(apps.length).toBe(1);
      expect(apps[0].user_id).toBe('student_A');
      expect(apps[0].studentId).toBe('student_A');
      expect(apps[0].studentUid).toBe('student_A');
      expect(apps[0].opportunity_id).toBe('opp_react_dev');
      expect(apps[0].opportunityId).toBe('opp_react_dev');
      expect(apps[0].company).toBe('Tech Corp');
      expect(apps[0].status).toBe('Applied');
      expect(apps[0].createdAt).toBeDefined();
      expect(apps[0].updatedAt).toBeDefined();

      // Verify notification document was created for student
      const notifs = Array.from(collections.notifications.values());
      expect(notifs.length).toBeGreaterThanOrEqual(1);
      expect(notifs[0].user_id).toBe('student_A');
      expect(notifs[0].title).toContain('Applied to');

      // Opportunity details should now report has_applied = true
      const oppRes = await request(app)
        .get('/api/opportunities/opp_react_dev')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(oppRes.status).toBe(200);
      expect(oppRes.body.has_applied).toBe(true);
      expect(oppRes.body.application_status).toBe('Applied');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Duplicate Application Protection
  // ─────────────────────────────────────────────────────────────
  describe('5. Duplicate Application Protection', () => {
    it('rejects duplicate application with 409 Conflict', async () => {
      // First application: succeeds
      const firstRes = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({ opportunity_id: 'opp_react_dev' });

      expect(firstRes.status).toBe(201);

      // Second application: rejected
      const secondRes = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({ opportunity_id: 'opp_react_dev' });

      expect(secondRes.status).toBe(409);
      expect(secondRes.body.code).toBe('ALREADY_APPLIED');
      expect(secondRes.body.message).toBe('You already applied to this opportunity.');

      // Check no second document was created
      const apps = Array.from(collections.applications.values());
      expect(apps.length).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Application Ownership & Privacy
  // ─────────────────────────────────────────────────────────────
  describe('6. Application Ownership & Privacy', () => {
    let appId;

    beforeEach(async () => {
      // Create an application owned by Student A
      const createRes = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({ opportunity_id: 'opp_react_dev' });

      appId = createRes.body.application.id;
    });

    it('allows owner student to view their own application', async () => {
      const res = await request(app)
        .get(`/api/applications/${appId}`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(appId);
      expect(res.body.user_id).toBe('student_A');
    });

    it('denies access (403 Forbidden) when Student B attempts to view Student A application', async () => {
      const res = await request(app)
        .get(`/api/applications/${appId}`)
        .set('Authorization', `Bearer ${studentBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
      expect(res.body.message).toContain('Access denied. You can only view your own applications.');
    });

    it('returns only Student A applications when Student A queries my applications', async () => {
      const res = await request(app)
        .get('/api/applications')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.every(app => app.user_id === 'student_A')).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. Unauthorized Status Modification Guard
  // ─────────────────────────────────────────────────────────────
  describe('7. Unauthorized Status Modification Guard', () => {
    let appId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({ opportunity_id: 'opp_react_dev' });

      appId = createRes.body.application.id;
    });

    it('rejects student attempting to change application status with 403', async () => {
      const res = await request(app)
        .put(`/api/applications/${appId}/status`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({ status: 'Selected' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('ROLE_FORBIDDEN');

      // Verify status in Firestore was NOT changed
      const appDoc = collections.applications.get(appId);
      expect(appDoc.status).toBe('Applied');
      expect(appDoc.status).not.toBe('Selected');
    });

    it('allows admin to change application status to a valid canonical status', async () => {
      const res = await request(app)
        .put(`/api/applications/${appId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Interview' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Application status updated');

      const appDoc = collections.applications.get(appId);
      expect(appDoc.status).toBe('Interview');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 8. My Applications Endpoint (/api/applications/my)
  // ─────────────────────────────────────────────────────────────
  describe('8. My Applications Endpoint (/api/applications/my)', () => {
    beforeEach(async () => {
      // Seed application for Student A
      await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({ opportunity_id: 'opp_react_dev' });
    });

    it('returns list of applications populated with opportunity info for Student A', async () => {
      const res = await request(app)
        .get('/api/applications/my')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].opportunity_title).toBe('Frontend React Developer');
      expect(res.body[0].company).toBe('Tech Corp');
      expect(res.body[0].status).toBe('Applied');
    });

    it('returns empty list for Student B who has not applied yet', async () => {
      const res = await request(app)
        .get('/api/applications/my')
        .set('Authorization', `Bearer ${studentBToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 9. Application Withdrawal Flow & Status Guard
  // ─────────────────────────────────────────────────────────────
  describe('9. Application Withdrawal Flow & Status Guard', () => {
    let appId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({ opportunity_id: 'opp_react_dev' });

      appId = createRes.body.application.id;
    });

    it('allows student to withdraw their own application when status is Applied', async () => {
      const res = await request(app)
        .delete(`/api/applications/${appId}`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('withdrawn successfully');

      // Verify removed from Firestore collection
      expect(collections.applications.has(appId)).toBe(false);
    });

    it('prevents Student B from withdrawing Student A application (403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/applications/${appId}`)
        .set('Authorization', `Bearer ${studentBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Not authorized');

      // Verify application still exists in Firestore
      expect(collections.applications.has(appId)).toBe(true);
    });

    it('prevents student from withdrawing when status is no longer Applied', async () => {
      // Admin updates status to Under Review
      await request(app)
        .put(`/api/applications/${appId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'Under Review' });

      // Student tries to withdraw
      const res = await request(app)
        .delete(`/api/applications/${appId}`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot withdraw');

      // Application still exists
      expect(collections.applications.has(appId)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 10. Application Notification Dispatch & Isolation
  // ─────────────────────────────────────────────────────────────
  describe('10. Application Notification Dispatch & Isolation', () => {
    it('creates notification for student on application submission and preserves isolation', async () => {
      // Student A applies
      await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({ opportunity_id: 'opp_react_dev' });

      // Student A checks notifications
      const notifResA = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(notifResA.status).toBe(200);
      expect(Array.isArray(notifResA.body)).toBe(true);
      expect(notifResA.body.length).toBeGreaterThanOrEqual(1);
      const appNotif = notifResA.body.find(n => n.user_id === 'student_A');
      expect(appNotif).toBeDefined();
      expect(appNotif.title).toContain('Applied to Frontend React Developer');

      // Student B checks notifications: should NOT see Student A's notification
      const notifResB = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${studentBToken}`);

      expect(notifResB.status).toBe(200);
      const studentBSeeA = notifResB.body.some(n => n.user_id === 'student_A');
      expect(studentBSeeA).toBe(false);
    });
  });
});
