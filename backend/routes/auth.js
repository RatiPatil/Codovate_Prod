const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db, admin } = require("../config/firebase");
require("dotenv").config();

const { getAuth } = require("firebase-admin/auth");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");

// Rate limiter for forgot password: max 3 requests per 15 minutes
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: { message: "Too many password reset requests from this IP, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


router.post("/google", async (req, res) => {
  const { idToken } = req.body;
  
  if (!idToken) return res.status(400).json({ message: "No ID token provided" });

  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const { email, name, picture, uid } = decodedToken;
    
    const studentsRef = db.collection('students');
    const snapshot = await studentsRef.where('email', '==', email.toLowerCase()).get();
    
    let user;
    if (snapshot.empty) {
      // Rule 5: If email does not exist, show contact admin error.
      // Note: Firebase Auth has already created a UID for this Google account.
      // We could optionally delete the Firebase user here using Firebase Admin, 
      // but throwing an error satisfies the requirement.
      return res.status(403).json({ message: "Student record not found. Contact administrator." });
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

    const studentsRef = db.collection('students');
    const snapshot = await studentsRef.where('phone', '==', phone_number).get();
    
    let user;
    if (snapshot.empty) {
      return res.status(403).json({ message: "Student record not found. Contact administrator." });
    } else {
      const userDoc = snapshot.docs[0];
      user = userDoc.data();
      
      if (user.is_active === false) return res.status(403).json({ message: "Account is deactivated." });
      
      const providers = user.providers || [];
      if (!providers.includes('phone')) providers.push('phone');

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

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields are required." });
  if (name.trim().length < 2)
    return res.status(400).json({ message: "Name must be at least 2 characters." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ message: "Invalid email format." });
  if (password.length < 6)
    return res.status(400).json({ message: "Password must be at least 6 characters." });

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email.toLowerCase()).get();
    
    if (!snapshot.empty)
      return res.status(409).json({ message: "Email already registered." });

    const hash = await bcrypt.hash(password, 12);
    const newUserRef = usersRef.doc();
    const userData = {
      id: newUserRef.id,
      name: name.trim(),
      email: email.toLowerCase(),
      password_hash: hash,
      role: 'student',
      is_verified: false,
      is_active: true,
      created_at: new Date()
    };
    
    const batch = db.batch();
    batch.set(newUserRef, userData);

    // Create student profile
    batch.set(db.collection('student_profiles').doc(newUserRef.id), {
      user_id: newUserRef.id,
      profile_completion: 0,
      onboarding_completed: false
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
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required." });

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email.toLowerCase()).get();
    
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

router.post("/forgot-password", forgotPasswordLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required." });

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email.toLowerCase()).get();

    if (snapshot.empty) {
      // Don't leak if email exists, just return generic success
      return res.json({ message: "If this email exists, a reset code was generated." });
    }

    const user = snapshot.docs[0].data();
    
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    const resetRef = db.collection('password_resets').doc();
    await resetRef.set({
      email: user.email,
      code: code,
      expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
      used: false
    });

    // Send email using Nodemailer
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn(`⚠️ SMTP NOT CONFIGURED. Please set SMTP variables in .env`);
        return res.status(500).json({ message: "Email service is temporarily misconfigured. Please contact support." });
      }

      await transporter.sendMail({
        from: `"Codovate Admin" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "Your Password Reset Code",
        text: `Your password reset code is: ${code}. It expires in 15 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2015FF;">Codovate Password Reset</h2>
            <p>You requested a password reset for your Codovate account.</p>
            <p>Your 6-digit reset code is: <strong style="font-size: 24px; letter-spacing: 2px;">${code}</strong></p>
            <p>This code will expire in 15 minutes.</p>
            <p>If you did not request this, you can safely ignore this email.</p>
          </div>
        `,
      });
      console.log(`📧 Reset email sent to ${user.email}`);
    } catch (emailErr) {
      console.error("Failed to send reset email:", emailErr);
      return res.status(500).json({ message: "Failed to dispatch reset email. Please try again later." });
    }

    res.json({ message: "If this email exists, a reset code was sent." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;
  
  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  try {
    const resetsRef = db.collection('password_resets');
    const snapshot = await resetsRef
      .where('email', '==', email.toLowerCase())
      .where('code', '==', code)
      .where('used', '==', false)
      .get();

    if (snapshot.empty) {
      return res.status(400).json({ message: "Invalid or expired reset code." });
    }

    const resetDoc = snapshot.docs[0];
    const resetData = resetDoc.data();

    if (resetData.expires_at.toDate() < new Date()) {
      return res.status(400).json({ message: "Reset code has expired." });
    }

    // Hash new password
    const hash = await bcrypt.hash(newPassword, 12);
    
    // Update user
    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('email', '==', email.toLowerCase()).get();
    
    if (userSnapshot.empty) {
      return res.status(404).json({ message: "User not found." });
    }

    const userId = userSnapshot.docs[0].id;
    await usersRef.doc(userId).update({
      password_hash: hash
    });

    // Mark code as used
    await resetsRef.doc(resetDoc.id).update({ used: true });

    console.log("✅ Password reset successful for:", email);
    res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;