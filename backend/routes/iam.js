const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { db } = require("../config/firebase");
const { getAuth } = require("firebase-admin/auth");
const { authenticate, authorize } = require("../middleware");
const { logLoginHistory, getClientIP } = require("../middleware/auditLog");

// Helper for sending basic email (mocked for this architecture)
const mockSendEmail = async (email, link) => {
  console.log(`[EMAIL MOCK] Sent to: ${email} | Link: ${link}`);
};

/**
 * 1. BOOTSTRAP: Create First Super Admin
 * POST /api/iam/bootstrap
 */
router.post("/bootstrap", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: "Email, password, and name are required." });
    }

    // Check if system is already bootstrapped
    const sysConfigRef = db.collection("system_config").doc("bootstrap");
    const sysConfig = await sysConfigRef.get();
    
    if (sysConfig.exists && sysConfig.data().bootstrap_completed) {
      return res.status(403).json({ message: "System is already bootstrapped." });
    }

    // Create Firebase user
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName: name,
      emailVerified: false // Force email verification
    });

    // Create Firestore User
    const userDoc = {
      email,
      name,
      role: "super_admin",
      lifecycle: "EMAIL_PENDING",
      createdAt: new Date().toISOString(),
      mustResetPassword: true, // Force password change on first login
      authProvider: "email"
    };
    
    await db.collection("users").doc(userRecord.uid).set(userDoc);
    
    // Set Custom Claims for Firestore Security Rules
    await getAuth().setCustomUserClaims(userRecord.uid, { role: "super_admin" });

    // Generate Verification Link (mocked)
    const verificationLink = await getAuth().generateEmailVerificationLink(email);
    await mockSendEmail(email, verificationLink);

    // Lock Bootstrap Endpoint Forever
    await sysConfigRef.set({
      bootstrap_completed: true,
      bootstrappedAt: new Date().toISOString(),
      bootstrappedBy: userRecord.uid
    });

    res.status(201).json({ message: "Super Admin created. System locked. Please verify email.", uid: userRecord.uid });
  } catch (err) {
    console.error("Bootstrap Error:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

/**
 * 2. INVITATION SYSTEM: Create Invitation
 * POST /api/iam/invites
 * Requires: users:invite permission
 */
router.post("/invites", authenticate, authorize("users:invite"), async (req, res) => {
  try {
    const { email, role, orgId, deptId } = req.body;
    
    if (!email || !role) {
      return res.status(400).json({ message: "Email and role are required." });
    }

    // Check if user already exists
    try {
      await getAuth().getUserByEmail(email);
      return res.status(409).json({ message: "User already exists with this email." });
    } catch (e) {
      // Expected error if user doesn't exist
      if (e.code !== 'auth/user-not-found') throw e;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // 48 hour expiration

    const inviteData = {
      email,
      role,
      orgId: orgId || null,
      deptId: deptId || null,
      token,
      expiresAt: expiresAt.toISOString(),
      status: "pending",
      createdBy: req.user.uid,
      createdAt: new Date().toISOString()
    };

    const inviteRef = await db.collection("adminInvitations").add(inviteData);
    
    // Mock Send Email
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite?token=${token}`;
    await mockSendEmail(email, inviteLink);

    res.status(201).json({ message: "Invitation sent.", id: inviteRef.id });
  } catch (err) {
    console.error("Invite Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * 3. INVITATION SYSTEM: Verify Token
 * GET /api/iam/invites/verify?token=XYZ
 */
router.get("/invites/verify", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Token missing" });

    const invitesSnapshot = await db.collection("adminInvitations")
      .where("token", "==", token)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (invitesSnapshot.empty) {
      return res.status(404).json({ message: "Invalid or expired invitation." });
    }

    const invite = invitesSnapshot.docs[0].data();
    if (new Date(invite.expiresAt) < new Date()) {
      return res.status(400).json({ message: "Invitation has expired." });
    }

    res.status(200).json({ email: invite.email, role: invite.role, orgId: invite.orgId });
  } catch (err) {
    console.error("Verify Invite Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * 4. INVITATION SYSTEM: Accept Invite
 * POST /api/iam/invites/accept
 */
router.post("/invites/accept", async (req, res) => {
  try {
    const { token, password, name } = req.body;
    if (!token || !password || !name) {
      return res.status(400).json({ message: "Token, password, and name required." });
    }

    const invitesSnapshot = await db.collection("adminInvitations")
      .where("token", "==", token)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (invitesSnapshot.empty) return res.status(404).json({ message: "Invalid invitation." });

    const inviteDoc = invitesSnapshot.docs[0];
    const invite = inviteDoc.data();

    if (new Date(invite.expiresAt) < new Date()) {
      return res.status(400).json({ message: "Invitation has expired." });
    }

    // Create Firebase Auth User
    const userRecord = await getAuth().createUser({
      email: invite.email,
      password,
      displayName: name,
      emailVerified: true // They are verified by possessing the secure token
    });

    // Create Firestore User
    const userDoc = {
      email: invite.email,
      name,
      role: invite.role,
      orgId: invite.orgId,
      deptId: invite.deptId,
      lifecycle: "ACTIVE", // Automatically active since invited
      createdAt: new Date().toISOString()
    };
    
    await db.collection("users").doc(userRecord.uid).set(userDoc);
    await getAuth().setCustomUserClaims(userRecord.uid, { role: invite.role });

    // Mark invite as accepted
    await inviteDoc.ref.update({ status: "accepted", acceptedAt: new Date().toISOString() });

    res.status(201).json({ message: "Account created successfully. You may now log in." });
  } catch (err) {
    console.error("Accept Invite Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * 5. SESSION MANAGEMENT: Revoke Specific Session
 * DELETE /api/iam/sessions/:sessionId
 */
router.delete("/sessions/:sessionId", authenticate, async (req, res) => {
  try {
    // Only the user themselves OR a super_admin can revoke sessions
    const sessionRef = db.collection("sessions").doc(req.params.sessionId);
    const session = await sessionRef.get();
    
    if (!session.exists) return res.status(404).json({ message: "Session not found." });
    
    if (session.data().userId !== req.user.uid && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: "Forbidden" });
    }

    await sessionRef.update({ isValid: false, revokedAt: new Date().toISOString() });
    res.status(200).json({ message: "Session revoked." });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * 6. SESSION MANAGEMENT: Logout All Devices
 * DELETE /api/iam/sessions/all
 */
router.delete("/sessions/all", authenticate, async (req, res) => {
  try {
    const sessionsSnapshot = await db.collection("sessions")
      .where("userId", "==", req.user.uid)
      .where("isValid", "==", true)
      .get();

    const batch = db.batch();
    sessionsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isValid: false, revokedAt: new Date().toISOString() });
    });
    
    await batch.commit();

    // Also revoke Firebase refresh tokens for immediate auth block
    await getAuth().revokeRefreshTokens(req.user.uid);

    res.status(200).json({ message: "Logged out from all devices." });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * 7. ACCOUNT LIFECYCLE: Update Lifecycle State
 * POST /api/iam/users/:id/lifecycle
 * Requires: users:manage permission
 */
router.post("/users/:id/lifecycle", authenticate, authorize("users:manage"), async (req, res) => {
  try {
    const { status } = req.body;
    const validStates = ['ACTIVE', 'SUSPENDED', 'LOCKED', 'DISABLED', 'DELETED'];
    if (!validStates.includes(status)) {
      return res.status(400).json({ message: "Invalid lifecycle state." });
    }

    const targetUserId = req.params.id;
    const userRef = db.collection("users").doc(targetUserId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) return res.status(404).json({ message: "User not found." });

    // Super Admins cannot be easily modified without extreme care
    if (userSnap.data().role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: "Cannot modify Super Admin lifecycle." });
    }

    await userRef.update({ 
      lifecycle: status, 
      lifecycleUpdatedAt: new Date().toISOString(),
      lifecycleUpdatedBy: req.user.uid
    });

    // If locked, suspended, disabled, or deleted, revoke active Firebase tokens
    if (status !== 'ACTIVE') {
      await getAuth().revokeRefreshTokens(targetUserId);
      
      // Invalidate all active sessions in DB
      const sessions = await db.collection("sessions").where("userId", "==", targetUserId).where("isValid", "==", true).get();
      const batch = db.batch();
      sessions.docs.forEach(doc => batch.update(doc.ref, { isValid: false, revokedReason: status }));
      await batch.commit();
      
      // If deleted or disabled, disable the Firebase account itself
      if (status === 'DISABLED' || status === 'DELETED') {
        await getAuth().updateUser(targetUserId, { disabled: true });
      }
    } else {
      // If setting back to ACTIVE, enable the firebase account
      await getAuth().updateUser(targetUserId, { disabled: false });
    }

    res.status(200).json({ message: `User lifecycle updated to ${status}` });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
