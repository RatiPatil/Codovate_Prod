const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db, admin } = require("../config/firebase");
require("dotenv").config();

const { getAuth } = require("firebase-admin/auth");

// ─── TEMPORARY ENDPOINT TO SEED ADMINS ON FREE RENDER ───
router.get("/seed-admins-now", async (req, res) => {
  try {
    const ADMINS = [
      { id: 'super_admin_001', name: 'Ratikant Patil', email: 'superadmin@codovate.in', password: 'Super@Admin#2026', role: 'super_admin' },
      { id: 'college_admin_001', name: 'SVERI College Admin', email: 'college@codovate.in', password: 'College@Admin#2026', role: 'college_admin' },
      { id: 'company_admin_001', name: 'Company Recruiter Admin', email: 'company@codovate.in', password: 'Company@Admin#2026', role: 'company_admin' }
    ];
    let created = [];
    for (const admin of ADMINS) {
      const hash = await bcrypt.hash(admin.password, 12);
      await db.collection('users').doc(admin.id).set({
        id: admin.id, name: admin.name, email: admin.email.toLowerCase(),
        password_hash: hash, role: admin.role, is_active: true, is_verified: true,
        created_at: new Date()
      }, { merge: true });
      created.push(admin.email);
    }
    res.json({ message: "Seeding complete!", newlyCreated: created, allAdmins: ADMINS.map(a => a.email) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/google", async (req, res) => {
  const { idToken } = req.body;
  
  if (!idToken) return res.status(400).json({ message: "No ID token provided" });

  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const { email, name, picture, uid } = decodedToken;
    
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email.toLowerCase()).get();
    
    let user;
    if (snapshot.empty) {
      // Auto-Registration Flow for Google
      const newUserRef = usersRef.doc();
      user = {
        id: newUserRef.id,
        name: name || 'Google User',
        email: email.toLowerCase(),
        avatar: picture || '',
        role: 'student',
        is_active: true,
        is_verified: true,
        authUid: uid,
        providers: ['google'],
        claimed: true,
        created_at: new Date(),
        last_login_at: new Date()
      };
      
      const batch = db.batch();
      batch.set(newUserRef, user);
      
      // Create unified students record immediately preventing orphaned data
      batch.set(db.collection('students').doc(newUserRef.id), {
        id: newUserRef.id,
        email: email.toLowerCase(),
        authUid: uid,
        providers: ['google'],
        claimed: true,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        profile_data: {
          name: name || 'Google User',
          avatar: picture || '',
          profile_completion: 0,
          onboarding_completed: false
        }
      });
      
      batch.set(db.collection('platform_events').doc(), {
        actor_id: newUserRef.id,
        event_type: 'user_signup',
        entity_type: 'student',
        entity_id: newUserRef.id,
        metadata: { provider: 'google', email },
        created_at: new Date()
      });
      
      await batch.commit();
      console.log("✅ Auto-registered new user via Google:", email);
    } else {
      const userDoc = snapshot.docs[0];
      user = userDoc.data();
      
      if (user.is_active === false) return res.status(403).json({ message: "Account is deactivated." });
      
      // Update authUid, providers, claimed, and last_login_at
      const providers = user.providers || [];
      if (!providers.includes('google')) providers.push('google');

      const batch = db.batch();
      batch.update(userDoc.ref, { 
        authUid: uid,
        providers: providers,
        claimed: true,
        last_login_at: new Date() 
      });

      // Log event
      batch.set(db.collection('platform_events').doc(), {
        actor_id: userDoc.id,
        event_type: 'user_login',
        entity_type: 'student',
        entity_id: userDoc.id,
        metadata: { provider: 'google', email },
        created_at: new Date()
      });

      await batch.commit();
      console.log("✅ User logged in via Google and linked:", email);
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'codovate_secret',
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    });
  } catch (err) {
    console.error("Google Auth error:", err);
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
        is_active: true,
        is_verified: true,
        authUid: uid,
        providers: ['phone'],
        claimed: true,
        created_at: new Date(),
        last_login_at: new Date()
      };
      
      const batch = db.batch();
      batch.set(newUserRef, user);
      
      batch.set(db.collection('students').doc(newUserRef.id), {
        id: newUserRef.id,
        phone: phone_number,
        authUid: uid,
        providers: ['phone'],
        claimed: true,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        profile_data: {
          name: 'Student',
          profile_completion: 0,
          onboarding_completed: false
        }
      });
      
      batch.set(db.collection('platform_events').doc(), {
        actor_id: newUserRef.id,
        event_type: 'user_signup',
        entity_type: 'student',
        entity_id: newUserRef.id,
        metadata: { provider: 'phone', phone: phone_number },
        created_at: new Date()
      });
      
      await batch.commit();
      console.log("✅ Auto-registered new user via Phone:", phone_number);
    } else {
      const userDoc = snapshot.docs[0];
      user = userDoc.data();
      
      if (user.is_active === false) return res.status(403).json({ message: "Account is deactivated." });
      
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
          last_login_at: new Date() 
        });

        batch.set(db.collection('platform_events').doc(), {
          actor_id: userDoc.id,
          event_type: 'user_login',
          entity_type: 'student',
          entity_id: userDoc.id,
          metadata: { provider: 'phone', phone: phone_number, merged_into: user.authUid },
          created_at: new Date()
        });
        
        await batch.commit();

        const token = jwt.sign(
          { id: user.id, role: user.role },
          process.env.JWT_SECRET || 'codovate_secret',
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
        last_login_at: new Date() 
      });

      batch.set(db.collection('platform_events').doc(), {
        actor_id: userDoc.id,
        event_type: 'user_login',
        entity_type: 'student',
        entity_id: userDoc.id,
        metadata: { provider: 'phone', phone: phone_number },
        created_at: new Date()
      });

      await batch.commit();
      console.log("✅ User logged in via Phone and linked:", phone_number);
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'codovate_secret',
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role, avatar: user.avatar }
    });
  } catch (err) {
    console.error("Phone Auth error:", err);
    res.status(401).json({ message: "Auth Error: " + err.message });
  }
});

const authMiddleware = require("../middleware/auth");

router.post("/sync-providers", authMiddleware, async (req, res) => {
  try {
    const { providers } = req.body;
    if (!providers || !Array.isArray(providers)) return res.status(400).json({ message: "Invalid providers array." });

    const studentRef = db.collection('students').doc(req.user.id);
    const doc = await studentRef.get();
    
    if (doc.exists) {
      await studentRef.update({ providers, updated_at: new Date() });
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
  if (name.trim().length < 2)
    return res.status(400).json({ message: "Name must be at least 2 characters." });
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
    const userData = {
      id: newUserRef.id,
      name: name.trim(),
      username: cleanUsername || null,
      email: email.toLowerCase(),
      password_hash: hash,
      role: 'student',
      is_verified: false,
      is_active: true,
      created_at: new Date()
    };
    
    const batch = db.batch();
    batch.set(newUserRef, userData);

    // Create unified students record
    batch.set(db.collection('students').doc(newUserRef.id), {
      id: newUserRef.id,
      email: email.toLowerCase(),
      authUid: null,
      providers: ['local'],
      claimed: true,
      is_active: true,
      role: 'student',
      created_at: new Date(),
      profile_data: {
        name: name.trim(),
        profile_completion: 0,
        onboarding_completed: false
      }
    });

    // Log platform event
    batch.set(db.collection('platform_events').doc(), {
      actor_id: newUserRef.id,
      event_type: 'user_signup',
      entity_type: 'user',
      entity_id: newUserRef.id,
      metadata: { email: userData.email },
      created_at: new Date()
    });
    
    await batch.commit();

    // 🔴 REAL-TIME: Notify Admin
    req.io.to("admin_room").emit("admin_new_student", userData);

    const token = jwt.sign(
      { id: userData.id, role: userData.role },
      process.env.JWT_SECRET || 'codovate_secret',
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
      snapshot = await usersRef.where('email', '==', email.toLowerCase()).get();
    } else {
      const loginValue = (username || email || '').trim().toLowerCase();
      snapshot = await usersRef.where('username', '==', loginValue).get();
      // Fallback: if not found by username, try as email
      if (snapshot.empty) {
        snapshot = await usersRef.where('email', '==', loginValue).get();
      }
    }
    
    if (snapshot.empty)
      return res.status(401).json({ message: "Invalid email or password." });

    const user = snapshot.docs[0].data();

    if (!user.is_active)
      return res.status(403).json({ message: "Account is deactivated." });

    if (!user.password_hash)
      return res.status(401).json({ message: "This account uses Google login. Please click 'Continue with Google'." });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ message: "Invalid email or password." });

    // Use batch for fast login updates
    const batch = db.batch();
    batch.update(usersRef.doc(user.id), { last_login_at: new Date() });
    
    batch.set(db.collection('platform_events').doc(), {
      actor_id: user.id,
      event_type: 'user_login',
      entity_type: 'user',
      entity_id: user.id,
      created_at: new Date()
    });
    
    await batch.commit();

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
      process.env.JWT_SECRET || 'codovate_secret',
      { expiresIn: "7d" }
    );

    console.log(`✅ User logged in [${user.role}]:`, email);
    res.json({
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        college_id: user.college_id || null,
        company_id: user.company_id || null,
      }
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

router.post("/admin-login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required." });

  // All valid admin roles
  const ADMIN_ROLES = ['super_admin', 'admin', 'college_admin', 'company_admin', 'mentor'];

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email.toLowerCase()).get();

    if (snapshot.empty)
      return res.status(401).json({ message: "Invalid email or password." });

    const user = snapshot.docs[0].data();

    if (!ADMIN_ROLES.includes(user.role))
      return res.status(403).json({ message: "Access Denied: Admin privileges required." });

    if (!user.is_active)
      return res.status(403).json({ message: "Account is deactivated. Contact super admin." });

    if (!user.password_hash)
      return res.status(401).json({ message: "This account uses Google login. No password set." });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ message: "Invalid email or password." });

    await usersRef.doc(user.id).update({ last_login_at: new Date() });

    await db.collection('audit_logs').add({
      actor_id: user.id,
      actor_email: user.email,
      action: 'ADMIN_LOGIN',
      module: 'auth',
      entity_id: null,
      details: { role: user.role },
      created_at: new Date()
    });

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
      process.env.JWT_SECRET || 'codovate_secret',
      { expiresIn: "7d" }
    );

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
      }
    });
  } catch (err) {
    console.error("Admin Login error:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});



module.exports = router;