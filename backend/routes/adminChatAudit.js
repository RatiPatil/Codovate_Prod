const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");
const { mapDoc } = require('../utils/firestoreMapper');

// Authorized Admin Moderation Access & Audit Log
router.get("/:teamId/audit-view", auth, async (req, res) => {
  const { teamId } = req.params;
  const { reason } = req.query;

  try {
    // Verify admin role
    const userRole = req.user.role || 'student';
    if (!['super_admin', 'admin'].includes(userRole)) {
      return res.status(403).json({ message: "Access denied. Administrative privileges required." });
    }

    // Record audit log
    const auditRef = db.collection("chat_audit_logs").doc();
    await auditRef.set({
      id: auditRef.id,
      adminId: req.user.id,
      adminEmail: req.user.email || 'admin@codovate.in',
      teamId,
      action: "CHAT_VIEWED",
      reason: reason || "Safety and moderation review",
      created_at: new Date()
    });

    // Fetch team metadata & chat messages for moderation
    const [teamDoc, snap] = await Promise.all([
      db.collection("teams").doc(teamId).get(),
      db.collection("teams").doc(teamId).collection("messages").orderBy("created_at", "asc").limit(100).get()
    ]);

    if (!teamDoc.exists) return res.status(404).json({ message: "Team not found." });

    const messages = snap.docs.map(doc => ({ id: doc.id, ...mapDoc(doc) }));

    res.json({
      team: mapDoc(teamDoc),
      messages,
      auditLogId: auditRef.id
    });
  } catch (err) {
    console.error("Admin chat audit error:", err);
    res.status(500).json({ message: "Failed to perform chat audit." });
  }
});

// Report Team / User / Message for moderation
router.post("/report", auth, async (req, res) => {
  const { targetType, targetId, reason, description } = req.body;
  if (!targetType || !targetId || !reason) {
    return res.status(400).json({ message: "targetType, targetId, and reason are required." });
  }

  try {
    const reportRef = db.collection("user_reports").doc();
    await reportRef.set({
      id: reportRef.id,
      reporterId: req.user.id,
      targetType, // 'team', 'user', 'message'
      targetId,
      reason,
      description: description || '',
      status: 'pending',
      created_at: new Date()
    });

    res.json({ message: "Report submitted successfully. Our team will review it." });
  } catch (err) {
    console.error("Submit report error:", err);
    res.status(500).json({ message: "Failed to submit report." });
  }
});

module.exports = router;
