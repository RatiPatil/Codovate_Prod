const express = require("express");
const { mapDoc, mapDocs } = require('../utils/firestoreMapper');
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { db, admin } = require("../config/firebase");
require("dotenv").config();
const { getAuth } = require("firebase-admin/auth");
const { logLoginHistory, getClientIP } = require("../middleware/auditLog");
const { ROLE_REDIRECTS } = require("../config/roleDefinitions");
// ─── Helper: Set Firebase Custom Claims for Firestore Rules ──
async function setCustomClaims(uid, role) {
  if (!uid) return;
  try {
    await getAuth().setCustomUserClaims(uid, { role });
  } catch (e) {
    console.warn('[AUTH] Failed to set custom claims:', e.message);
  }
}
// ─── SECURITY: Admin seeder endpoint removed (was publicly accessible) ───
// Use a protected CLI script or one-time migration for admin seeding instead.
router.post("/google", async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ message: "No ID token provided" });
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const { email, name, picture, uid } = decodedToken;
    const usersRef = db.collection('users');
    let userDoc = await usersRef.doc(uid).get();
    let user;
    if (!userDoc.exists) {
      // Create minimal canonical user document users/{uid}
      user = {
        id: uid,
        authUid: uid,
        name: name || 'Google User',
        email: email.toLowerCase(),
        avatar: picture || '',
        role: "student",
        recordStatus: 'ACTIVE',
        providers: ['google'],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date()
      };
      await usersRef.doc(uid).set(user);
      if (uid) setCustomClaims(uid, 'student').catch(e => console.warn('Background claims failed:', e));
      console.log("✅ Created minimal canonical user doc users/" + uid + " via Google:", email);
    } else {
      user = { id: userDoc.id, ...userDoc.data() };
      if (user.recordStatus && user.recordStatus !== 'ACTIVE') {
        return res.status(403).json({ message: "Your account has been suspended. Please contact administrator." });
      }
      await usersRef.doc(uid).update({
        lastLogin: new Date(),
        updatedAt: new Date()
      });
      console.log("✅ User logged in via Google:", email);
    }
    const tokenPayload = { id: user.id, role: user.role, name: user.name, email: user.email };
    if (user.college_id) tokenPayload.college_id = user.college_id;
    if (user.company_id) tokenPayload.company_id = user.company_id;
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    // Fire and forget background tasks (non-blocking)
    logLoginHistory({
      userId: user.id, email: user.email, provider: 'google',
      ipAddress: getClientIP(req), userAgent: req.headers['user-agent'],
      status: 'success',
    }).catch(e => console.error('Log login history background error:', e));
    if (uid) setCustomClaims(uid, user.role).catch(e => console.warn('Set custom claims background error:', e));
    const onboardingCompleted = user.onboardingCompleted ?? user.onboarding_completed ?? (user.role !== 'student');
    res.json({
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        avatar: user.avatar || '',
        onboardingCompleted
      },
      redirect: ROLE_REDIRECTS[user.role] || '/dashboard',
    });
  } catch (err) {
    console.error("Google Auth error:", err);
    logLoginHistory({
      email: req.body?.email || 'unknown', provider: 'google',
      ipAddress: getClientIP(req), userAgent: req.headers['user-agent'],
      status: 'failed', failureReason: err.message,
    });
    res.status(401).json({ message: "Auth Error: " + err.message });
  }
});
router.post("/phone", async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ message: "No ID token provided" });
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const { phone_number, uid } = decodedToken;
    if (!phone_number) return res.status(400).json({ message: "Invalid Phone Auth token" });
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('phone', '==', phone_number).get();
    let user;
    if (snapshot.empty) {
      // Auto-Registration Flow for Phone
      const newUserRef = usersRef.doc();
      user = {
        id: newUserRef.id,
        name: 'Student', // Default name, they can change it in profile
        phone: phone_number,
        role: 'student',
        recordStatus: 'ACTIVE',
        is_verified: true,
        authUid: uid,
        providers: ['phone'],
        claimed: true,
        onboardingCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date()
      };
      const batch = db.batch();
      batch.set(newUserRef, user);
      const profileData = {
        personalInfo: {
          name: 'Student',
          email: null,
          phone: phone_number
        },
        education: { college: null, degree: null, branch: null, year: null },
        socialLinks: { github: null, linkedin: null, portfolio: null, resume: null },
        careerGoal: null,
        experienceLevel: null,
        profileImage: '',
        headline: null,
        bio: null,
        profileCompletion: 0,
        visibility: 'public',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      batch.set(db.collection('profiles').doc(newUserRef.id), profileData);
      batch.set(db.collection('activityLogs').doc(), {
        actor_id: newUserRef.id,
        event_type: 'user_signup',
        entity_type: 'user',
        entity_id: newUserRef.id,
        metadata: { provider: 'phone', phone: phone_number },
        created_at: new Date()
      });
      await batch.commit();
      console.log("✅ Auto-registered new user via Phone:", phone_number);
    } else {
      const userDoc = snapshot.docs[0];
      user = mapDoc(userDoc);
      if (user.recordStatus !== 'ACTIVE') return res.status(403).json({ message: "Your account has been suspended. Please contact the administrator." });
      const providers = user.providers || [];
      if (!providers.includes('phone')) providers.push('phone');
      if (user.authUid && user.authUid !== uid) {
        // Backend Merge Flow to enforce Single UID
        console.log(`[MERGE] Linking phone to existing UID: ${user.authUid}`);
        try {
          await getAuth().deleteUser(uid);
        } catch (e) {
          console.warn("Could not delete temporary phone auth user:", e.message);
        }
        try {
          await getAuth().updateUser(user.authUid, { phoneNumber: phone_number });
        } catch (e) {
          console.warn("Could not link phone to existing user in Firebase:", e.message);
        }
        const customToken = await getAuth().createCustomToken(user.authUid);
        const batch = db.batch();
        batch.update(userDoc.ref, { 
          providers: providers,
          claimed: true,
          lastLogin: new Date(),
          updatedAt: new Date()
        });
        batch.set(db.collection('activityLogs').doc(), {
          actor_id: userDoc.id,
          event_type: 'user_login',
          entity_type: 'user',
          entity_id: userDoc.id,
          metadata: { provider: 'phone', phone: phone_number, merged_into: user.authUid },
          created_at: new Date()
        });
        // Fire and forget
        batch.commit().catch(e => console.error('Background batch commit failed:', e));
        const tokenPayload = { id: user.id, role: user.role, name: user.name, email: user.email };
        if (user.college_id) tokenPayload.college_id = user.college_id;
        if (user.company_id) tokenPayload.company_id = user.company_id;
        const token = jwt.sign(
          tokenPayload,
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );
        return res.json({
          action: "MERGED",
          customToken,
          token,
          user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role, avatar: user.avatar }
        });
      }
      // Standard Flow
      const batch = db.batch();
      batch.update(userDoc.ref, { 
        authUid: uid,
        providers: providers,
        claimed: true,
        lastLogin: new Date(),
        updatedAt: new Date()
      });
      batch.set(db.collection('activityLogs').doc(), {
        actor_id: userDoc.id,
        event_type: 'user_login',
        entity_type: 'user',
        entity_id: userDoc.id,
        metadata: { provider: 'phone', phone: phone_number },
        created_at: new Date()
      });
      // Fire and forget
      batch.commit().catch(e => console.error('Background batch commit failed:', e));
      console.log("✅ User logged in via Phone and linked:", phone_number);
    }
    const tokenPayload = { id: user.id, role: user.role, name: user.name, email: user.email };
    if (user.college_id) tokenPayload.college_id = user.college_id;
    if (user.company_id) tokenPayload.company_id = user.company_id;
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    const onboardingCompleted = user.onboardingCompleted ?? user.onboarding_completed ?? (user.role !== 'student');
    res.json({
      token,
      user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role, avatar: user.avatar || '', onboardingCompleted },
      redirect: ROLE_REDIRECTS[user.role] || '/dashboard',
    });
  } catch (err) {
    console.error("Phone Auth error:", err);
    logLoginHistory({
      phone: req.body?.phone || 'unknown', provider: 'phone',
      ipAddress: getClientIP(req), userAgent: req.headers['user-agent'],
      status: 'failed', failureReason: err.message,
    });
    res.status(401).json({ message: "Auth Error: " + err.message });
  }
});
const authMiddleware = require("../middleware/auth");
router.post("/sync-providers", authMiddleware, async (req, res) => {
  try {
    const { providers } = req.body;
    if (!providers || !Array.isArray(providers)) return res.status(400).json({ message: "Invalid providers array." });
    const userRef = db.collection('users').doc(req.user.id);
    const doc = await userRef.get();
    if (doc.exists) {
      await userRef.update({ providers, updatedAt: new Date() });
      return res.json({ message: "Providers synced successfully." });
    }
    res.status(404).json({ message: "User not found." });
  } catch (err) {
    console.error("Sync providers error:", err);
    res.status(500).json({ message: "Server error." });
  }
});
// ─── Check Username Availability ─────────────────────────
router.get("/check-username/:username", async (req, res) => {
  try {
    const username = (req.params.username || '').trim().toLowerCase();
    if (!username || username.length < 4 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ available: false, message: "Invalid username format." });
    }
    const snapshot = await db.collection('users').where('username', '==', username).get();
    res.json({ available: snapshot.empty });
  } catch (err) {
    console.error("Check username error:", err);
    res.status(500).json({ available: false, message: "Server error." });
  }
});
router.post("/signup", async (req, res) => {
  const { name, username, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields are required." });
  if (name.trim().length < 3)
    return res.status(400).json({ message: "Name must be at least 3 characters." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ message: "Invalid email format." });
  if (password.length < 8)
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password))
    return res.status(400).json({ message: "Password must contain uppercase, lowercase, number, and special character." });
  // Username validation (optional field for backward compat, but enforced if present)
  const cleanUsername = (username || name || '').trim().toLowerCase();
  if (username) {
    if (cleanUsername.length < 4 || cleanUsername.length > 25)
      return res.status(400).json({ message: "Username must be 4-25 characters." });
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername))
      return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores." });
  }
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email.toLowerCase()).get();
    if (!snapshot.empty)
      return res.status(409).json({ message: "Email already registered." });
    // Check username uniqueness
    if (cleanUsername) {
      const usernameSnapshot = await usersRef.where('username', '==', cleanUsername).get();
      if (!usernameSnapshot.empty)
        return res.status(409).json({ message: "Username is already taken." });
    }
    const hash = await bcrypt.hash(password, 12);
    const newUserRef = usersRef.doc();
    // ─── AUTH-001 FIX: Also create the user in Firebase Auth ───
    // This ensures sendPasswordResetEmail() works for local users.
    let firebaseAuthUid = null;
    try {
      const fbUser = await getAuth().createUser({
        email: email.toLowerCase(),
        password: password,
        displayName: name.trim().toUpperCase(),
      });
      firebaseAuthUid = fbUser.uid;
    } catch (fbErr) {
      // If user already exists in Firebase Auth (e.g. via Google), link instead
      if (fbErr.code === 'auth/email-already-exists') {
        try {
          const existingFbUser = await getAuth().getUserByEmail(email.toLowerCase());
          firebaseAuthUid = existingFbUser.uid;
          // Update their password so local login works
          await getAuth().updateUser(existingFbUser.uid, { password: password });
        } catch (linkErr) {
          console.warn("Could not link existing Firebase Auth user:", linkErr.message);
        }
      } else {
        console.warn("Firebase Auth user creation failed (non-blocking):", fbErr.message);
      }
    }
    const userData = {
      id: newUserRef.id,
      name: name.trim().toUpperCase(),
      username: cleanUsername || null,
      email: email.toLowerCase(),
      password_hash: hash,
      role: 'student',
      is_verified: false,
      recordStatus: 'ACTIVE',
      authUid: firebaseAuthUid,
      providers: ['local'],
      onboardingCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date()
    };
    const batch = db.batch();
    batch.set(newUserRef, userData);
    const profileData = {
      personalInfo: {
        name: name.trim().toUpperCase(),
        email: email.toLowerCase(),
        phone: null
      },
      education: { college: null, degree: null, branch: null, year: null },
      socialLinks: { github: null, linkedin: null, portfolio: null, resume: null },
      careerGoal: null,
      experienceLevel: null,
      profileImage: '',
      headline: null,
      bio: null,
      profileCompletion: 0,
      visibility: 'public',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    batch.set(db.collection('profiles').doc(newUserRef.id), profileData);
    // Log platform event
    batch.set(db.collection('activityLogs').doc(), {
      actor_id: newUserRef.id,
      event_type: 'user_signup',
      entity_type: 'user',
      entity_id: newUserRef.id,
      metadata: { email: userData.email },
      created_at: new Date()
    });
    // Fire and forget
    batch.commit().catch(e => console.error('Background batch commit failed:', e));
    // 🔴 REAL-TIME: Notify Admin
    if (req.io) req.io.to("admin_room").emit("admin_new_student", userData);
    const tokenPayload = { id: userData.id, role: userData.role, name: userData.name, email: userData.email };
    if (userData.college_id) tokenPayload.college_id = userData.college_id;
    if (userData.company_id) tokenPayload.company_id = userData.company_id;
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    console.log("✅ New user registered:", email);
    res.status(201).json({ token, user: { id: userData.id, name: userData.name, email: userData.email, role: userData.role } });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});
router.post("/login", async (req, res) => {
  const { email, username, password } = req.body;
  if ((!email && !username) || !password)
    return res.status(400).json({ message: "Email/username and password are required." });
  try {
    const usersRef = db.collection('users');
    let snapshot;
    // Determine if login is by email or username
    if (email && email.includes('@')) {
      snapshot = await usersRef.where('email', '==', email.toLowerCase()).limit(1).get();
    } else {
      const loginValue = (username || email || '').trim().toLowerCase();
      snapshot = await usersRef.where('username', '==', loginValue).limit(1).get();
      // Fallback: if not found by username, try as email
      if (snapshot.empty) {
        snapshot = await usersRef.where('email', '==', loginValue).limit(1).get();
      }
    }
    if (snapshot.empty)
      return res.status(401).json({ message: "Invalid email or password." });
    if (snapshot.size > 1) {
      console.warn(`[AUTH] Duplicate accounts detected. Size: ${snapshot.size}`);
    }
    const user = mapDoc(snapshot.docs[0]);
    if (user.recordStatus !== 'ACTIVE')
      return res.status(403).json({ message: "Your account has been suspended. Please contact the administrator." });
    // AUTH-002 FIX: Return provider-specific error message
    if (!user.password_hash) {
      const providers = user.providers || [];
      if (providers.includes('phone')) {
        return res.status(401).json({ message: "This account uses Phone Authentication. Please login using your mobile number." });
      }
      return res.status(401).json({ message: "This account uses Google login. Please click 'Continue with Google'." });
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ message: "Invalid email or password." });
    // Use batch for fast login updates
    const batch = db.batch();
    batch.update(usersRef.doc(user.id), { lastLogin: new Date(), updatedAt: new Date() });
    batch.set(db.collection('activityLogs').doc(), {
      actor_id: user.id,
      event_type: 'user_login',
      entity_type: 'user',
      entity_id: user.id,
      created_at: new Date()
    });
    // Fire and forget
    batch.commit().catch(e => console.error('Background batch commit failed:', e));
    // Role-based JWT payload for admins
    const tokenPayload = {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    };
    if (user.role === 'college_admin' && user.college_id) {
      tokenPayload.college_id = user.college_id;
    }
    if (user.role === 'company_admin' && user.company_id) {
      tokenPayload.company_id = user.company_id;
    }
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    // Fire and forget background login history log
    logLoginHistory({
      userId: user.id, email: user.email, provider: 'local',
      ipAddress: getClientIP(req), userAgent: req.headers['user-agent'],
      status: 'success',
    }).catch(e => console.error('Log login history background error:', e));
    const onboardingCompleted = user.onboardingCompleted ?? user.onboarding_completed ?? (user.role !== 'student');
    console.log(`✅ User logged in [${user.role}]:`, email);
    res.json({
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        avatar: user.avatar || '',
        onboardingCompleted,
        college_id: user.college_id || null,
        company_id: user.company_id || null,
      },
      redirect: ROLE_REDIRECTS[user.role] || '/dashboard',
    });
  } catch (err) {
    console.error("Login error:", err.message);
    logLoginHistory({
      email: req.body?.email || 'unknown', provider: 'local',
      ipAddress: getClientIP(req), userAgent: req.headers['user-agent'],
      status: 'failed', failureReason: err.message,
    });
    res.status(500).json({ message: "Server error: " + err.message });
  }
});
router.post("/admin-login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required." });
  // All valid admin roles
  const ADMIN_ROLES = ['super_admin', 'admin', 'college_admin', 'company_admin'];
  try {
    const usersRef = db.collection('users');
    let snapshot = await usersRef.where('email', '==', email.toLowerCase()).get();
    /* Auto-seed default Super Admin if database record does not exist yet */
    if (snapshot.empty && email.toLowerCase() === 'admin@codovate.in') {
      const hash = await bcrypt.hash('Admin@12345', 12);
      const newAdminRef = usersRef.doc();
      const adminData = {
        id: newAdminRef.id,
        name: 'SUPER ADMIN',
        email: 'admin@codovate.in',
        password_hash: hash,
        role: 'super_admin',
        recordStatus: 'ACTIVE',
        providers: ['local'],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
      };
      await newAdminRef.set(adminData);
      snapshot = await usersRef.where('email', '==', 'admin@codovate.in').get();
    }
    if (snapshot.empty)
      return res.status(401).json({ message: "Invalid email or password." });
    if (snapshot.size > 1) {
      console.warn(`[AUTH] Duplicate accounts detected. Size: ${snapshot.size}`);
    }
    const user = mapDoc(snapshot.docs[0]);
    if (!ADMIN_ROLES.includes(user.role))
      return res.status(403).json({ message: "Access Denied: Admin privileges required." });
    if (user.recordStatus !== 'ACTIVE')
      return res.status(403).json({ message: "Your account has been suspended. Please contact the administrator." });
    if (!user.password_hash)
      return res.status(401).json({ message: "This account uses Google login. No password set." });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ message: "Invalid email or password." });
    // Fire and forget
    usersRef.doc(user.id).update({ lastLogin: new Date(), updatedAt: new Date() })
      .catch(e => console.error('Background login update failed:', e));
    // Fire and forget
    db.collection('audit_logs').add({
      actor_id: user.id,
      actor_email: user.email,
      action: 'ADMIN_LOGIN',
      module: 'auth',
      entity_id: null,
      details: { role: user.role },
      created_at: new Date()
    }).catch(e => console.error('Background audit log failed:', e));
    // Role-based JWT payload
    const tokenPayload = {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    };
    // College admins: embed their college_id in token
    if (user.role === 'college_admin' && user.college_id) {
      tokenPayload.college_id = user.college_id;
    }
    // Company admins: embed their company_id
    if (user.role === 'company_admin' && user.company_id) {
      tokenPayload.company_id = user.company_id;
    }
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    // Log login history
    logLoginHistory({
      userId: user.id, email: user.email, provider: 'admin_local',
      ipAddress: getClientIP(req), userAgent: req.headers['user-agent'],
      status: 'success',
    });
    console.log(`✅ Admin [${user.role}] logged in: ${email}`);
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        college_id: user.college_id || null,
        company_id: user.company_id || null,
      },
      redirect: ROLE_REDIRECTS[user.role] || '/admin',
    });
  } catch (err) {
    console.error("Admin Login error:", err.message);
    logLoginHistory({
      email: req.body?.email || 'unknown', provider: 'admin_local',
      ipAddress: getClientIP(req), userAgent: req.headers['user-agent'],
      status: 'failed', failureReason: err.message,
    });
    res.status(500).json({ message: "Server error: " + err.message });
  }
});
module.exports = router;