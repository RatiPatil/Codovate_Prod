const request = require('supertest');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');

// Ensure JWT_SECRET is set
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_codovate_2026';

const { app } = require('../server');

describe('PHASE 9: End-to-End Authentication + Firestore Persistence Flow', () => {
  const testUid = 'phase9_student_uid_' + Date.now();
  const testEmail = `student_${Date.now()}@codovate.in`;
  const testName = 'Jane Codovate';

  // Construct a valid test JWT (mimicking Firebase ID token claims)
  const token = jwt.sign(
    {
      uid: testUid,
      user_id: testUid,
      sub: testUid,
      email: testEmail,
      name: testName,
      role: 'student',
      aud: 'codovateprod',
      iss: 'https://securetoken.google.com/codovateprod',
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  describe('1. Registration and Sync to Firestore', () => {
    it('creates a fresh user record in users/{uid} and profiles/{uid} via /api/auth/register-sync', async () => {
      const res = await request(app)
        .post('/api/auth/register-sync')
        .send({
          idToken: token,
          name: testName,
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.id).toBe(testUid);
      expect(res.body.user.role).toBe('student');
      expect(res.body.user.onboardingCompleted).toBe(false);

      // Verify Firestore persistence in users/{uid}
      const userDoc = await db.collection('users').doc(testUid).get();
      expect(userDoc.exists).toBe(true);
      const userData = userDoc.data();
      expect(userData.email).toBe(testEmail.toLowerCase());
      expect(userData.role).toBe('student');
      expect(userData.onboardingCompleted).toBe(false);

      // Verify Firestore persistence in profiles/{uid}
      const profileDoc = await db.collection('profiles').doc(testUid).get();
      expect(profileDoc.exists).toBe(true);
      const profileData = profileDoc.data();
      expect(profileData.personalInfo).toBeDefined();
      expect(profileData.personalInfo.name).toBe(testName.toUpperCase());
    });
  });

  describe('2. Login & Session Fetch (/api/auth/me)', () => {
    it('authenticates with ID token and returns populated user document', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testUid);
      expect(res.body.email).toBe(testEmail.toLowerCase());
      expect(res.body.role).toBe('student');
      expect(res.body.onboardingCompleted).toBe(false);
    });

    it('rejects unauthenticated requests to protected auth endpoints', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('3. Onboarding Flow & Persistence', () => {
    it('fetches onboarding status as pending (false) before onboarding', async () => {
      const res = await request(app)
        .get('/api/onboarding/status')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.onboarding_completed).toBe(false);
    });

    it('submits onboarding form via /api/onboarding/save and updates Firestore', async () => {
      const onboardingData = {
        name: testName,
        phone: '9876543210',
        college: 'SVERI College of Engineering',
        degree: 'B.Tech',
        branch: 'Computer Science',
        year: '4',
        skills: ['React', 'JavaScript', 'Firebase'],
        career_goal: 'Full Stack Engineer',
        experience_level: 'Intermediate',
        city: 'Pandharpur',
        state: 'Maharashtra',
        onboarding_completed: true,
      };

      const res = await request(app)
        .post('/api/onboarding/save')
        .set('Authorization', `Bearer ${token}`)
        .send(onboardingData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.onboarding_completed).toBe(true);

      // Verify Firestore users/{uid} was updated
      const userDoc = await db.collection('users').doc(testUid).get();
      expect(userDoc.data().onboardingCompleted).toBe(true);

      // Verify Firestore profiles/{uid} was updated
      const profileDoc = await db.collection('profiles').doc(testUid).get();
      expect(profileDoc.data().education.college).toBe('SVERI College of Engineering');
      expect(profileDoc.data().onboardingCompleted).toBe(true);
    });

    it('returns onboardingCompleted=true on subsequent session checks', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.onboardingCompleted).toBe(true);
    });

    it('returns onboarding_completed=true on /api/onboarding/status', async () => {
      const res = await request(app)
        .get('/api/onboarding/status')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.onboarding_completed).toBe(true);
    });
  });

  describe('4. Session Invalidation / Logout Guard', () => {
    it('blocks access when invalid token is provided', async () => {
      const res = await request(app)
        .get('/api/students/profile')
        .set('Authorization', 'Bearer invalid_bogus_token');

      expect(res.status).toBe(401);
    });
  });
});
