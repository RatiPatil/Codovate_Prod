const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");
const { mapDoc } = require('../utils/firestoreMapper');

// Verify membership helper
async function verifyMembership(teamId, userId) {
  const memberCheck = await db.collection("team_members")
    .where("team_id", "==", teamId)
    .where("user_id", "==", userId)
    .get();
  return !memberCheck.empty;
}

// Get paginated messages for a team
router.get("/:teamId", auth, async (req, res) => {
  const { teamId } = req.params;
  const limit = parseInt(req.query.limit) || 50;

  try {
    const isMember = await verifyMembership(teamId, req.user.id);
    if (!isMember) return res.status(403).json({ message: "Access denied. You are not a member of this team." });

    const snap = await db.collection("teams").doc(teamId).collection("messages")
      .orderBy("created_at", "asc")
      .limit(limit)
      .get();

    const messages = snap.docs.map(doc => {
      const data = mapDoc(doc);
      return {
        id: doc.id,
        teamId,
        senderId: data.senderId,
        senderName: data.senderName || 'Student',
        senderAvatar: data.senderAvatar || null,
        message: data.deletedAt ? 'This message was deleted.' : (data.message || ''),
        fileUrl: data.fileUrl || null,
        fileName: data.fileName || null,
        created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
        isDeleted: !!data.deletedAt
      };
    });

    res.json(messages);
  } catch (err) {
    console.error("Get team messages error:", err);
    res.status(500).json({ message: "Failed to load team messages." });
  }
});

// Post a chat message
router.post("/:teamId", auth, async (req, res) => {
  const { teamId } = req.params;
  const { message, fileUrl, fileName } = req.body;
  const trimmedMessage = message ? message.trim() : '';

  if (!trimmedMessage && !fileUrl) {
    return res.status(400).json({ message: "Message text or attachment is required." });
  }

  if (trimmedMessage.length > 2000) {
    return res.status(400).json({ message: "Message exceeds maximum length of 2000 characters." });
  }

  try {
    const isMember = await verifyMembership(teamId, req.user.id);
    if (!isMember) return res.status(403).json({ message: "Access denied. You are not a member of this team." });

    // Fetch sender profile
    const profileDoc = await db.collection("profiles").doc(req.user.id).get();
    const p = profileDoc.exists ? mapDoc(profileDoc) : {};

    const senderName = p.personalInfo?.name || req.user.name || 'Anonymous Student';
    const senderAvatar = p.personalInfo?.avatar || p.profile_photo || null;

    const msgRef = db.collection("teams").doc(teamId).collection("messages").doc();
    const newMsg = {
      id: msgRef.id,
      teamId,
      senderId: req.user.id,
      senderName,
      senderAvatar,
      message: message ? message.trim() : '',
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      created_at: new Date()
    };

    await msgRef.set(newMsg);

    // Update team last_activity
    await db.collection("teams").doc(teamId).update({
      last_activity: new Date(),
      last_message: message || (fileName ? `Attachment: ${fileName}` : 'New message')
    }).catch(() => {});

    // Emit Socket.IO event if available
    if (req.io) {
      req.io.to(`team_${teamId}`).emit('new_team_message', newMsg);
    }

    res.json(newMsg);
  } catch (err) {
    console.error("Post team message error:", err);
    res.status(500).json({ message: "Failed to send message." });
  }
});

// Soft-delete a message
router.delete("/:teamId/:messageId", auth, async (req, res) => {
  const { teamId, messageId } = req.params;

  try {
    const isMember = await verifyMembership(teamId, req.user.id);
    if (!isMember) return res.status(403).json({ message: "Access denied." });

    const msgRef = db.collection("teams").doc(teamId).collection("messages").doc(messageId);
    const msgDoc = await msgRef.get();
    if (!msgDoc.exists) return res.status(404).json({ message: "Message not found." });

    const msgData = msgDoc.data();
    if (msgData.senderId !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own messages." });
    }

    await msgRef.update({
      deletedAt: new Date(),
      deletedBy: req.user.id
    });

    res.json({ message: "Message deleted successfully." });
  } catch (err) {
    console.error("Delete message error:", err);
    res.status(500).json({ message: "Failed to delete message." });
  }
});

// Get team activity log
router.get("/:teamId/activity", auth, async (req, res) => {
  const { teamId } = req.params;
  try {
    const isMember = await verifyMembership(teamId, req.user.id);
    if (!isMember) return res.status(403).json({ message: "Access denied." });

    const snap = await db.collection("team_activities")
      .where("teamId", "==", teamId)
      .get();

    const activities = snap.docs.map(doc => ({ id: doc.id, ...mapDoc(doc) }));
    activities.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    res.json(activities.slice(0, 20));
  } catch (err) {
    console.error("Get team activity error:", err);
    res.status(500).json({ message: "Failed to load activity." });
  }
});

// Log a team activity
router.post("/:teamId/activity", auth, async (req, res) => {
  const { teamId } = req.params;
  const { action, description } = req.body;

  try {
    const isMember = await verifyMembership(teamId, req.user.id);
    if (!isMember) return res.status(403).json({ message: "Access denied." });

    const profileDoc = await db.collection("profiles").doc(req.user.id).get();
    const p = profileDoc.exists ? mapDoc(profileDoc) : {};

    const actRef = db.collection("team_activities").doc();
    const activity = {
      id: actRef.id,
      teamId,
      userId: req.user.id,
      userName: p.personalInfo?.name || req.user.name || 'Student',
      action: action || 'activity',
      description: description || 'performed an action',
      created_at: new Date()
    };

    await actRef.set(activity);
    res.json(activity);
  } catch (err) {
    console.error("Log activity error:", err);
    res.status(500).json({ message: "Failed to log activity." });
  }
});

module.exports = router;
