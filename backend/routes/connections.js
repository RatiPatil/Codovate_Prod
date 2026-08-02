const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");
const { mapDoc, mapDocs } = require('../utils/firestoreMapper');

// Get my connections and pending requests
router.get("/my", auth, async (req, res) => {
  try {
    const uid = req.user.id;

    // Fetch active connections where user is user1 or user2
    const [connSnap1, connSnap2, pendingIncoming, pendingOutgoing] = await Promise.all([
      db.collection("connections").where("user1", "==", uid).where("status", "==", "connected").get(),
      db.collection("connections").where("user2", "==", uid).where("status", "==", "connected").get(),
      db.collection("connection_requests").where("to_user", "==", uid).where("status", "==", "pending").get(),
      db.collection("connection_requests").where("from_user", "==", uid).where("status", "==", "pending").get()
    ]);

    const peerIds = new Set();
    connSnap1.docs.forEach(doc => peerIds.add(doc.data().user2));
    connSnap2.docs.forEach(doc => peerIds.add(doc.data().user1));

    // Fetch peer profile data
    const connections = [];
    for (const peerId of peerIds) {
      if (!peerId) continue;
      const profileDoc = await db.collection("profiles").doc(peerId).get();
      if (profileDoc.exists) {
        const p = mapDoc(profileDoc);
        connections.push({
          id: peerId,
          name: p.personalInfo?.name || 'Student',
          email: p.personalInfo?.email || '',
          college: p.education?.college || null,
          role: p.desiredRole || p.careerGoal || 'Student',
          skills: p.skills || [],
          avatar: p.personalInfo?.avatar || p.profile_photo || null,
          connected_at: new Date()
        });
      }
    }

    // Process incoming requests
    const incoming = [];
    for (const doc of pendingIncoming.docs) {
      const r = mapDoc(doc);
      const fromDoc = await db.collection("profiles").doc(r.from_user).get();
      if (fromDoc.exists) {
        const p = mapDoc(fromDoc);
        incoming.push({
          requestId: doc.id,
          fromUser: {
            id: r.from_user,
            name: p.personalInfo?.name || 'Student',
            role: p.desiredRole || 'Student',
            college: p.education?.college || null,
            avatar: p.personalInfo?.avatar || p.profile_photo || null,
            skills: p.skills || []
          },
          created_at: r.created_at
        });
      }
    }

    // Process outgoing requests
    const outgoing = pendingOutgoing.docs.map(doc => ({
      requestId: doc.id,
      to_user: doc.data().to_user,
      created_at: doc.data().created_at
    }));

    res.json({
      connections,
      incomingRequests: incoming,
      outgoingRequests: outgoing
    });
  } catch (err) {
    console.error("Get connections error:", err);
    res.status(500).json({ message: "Failed to fetch connections." });
  }
});

// Send connection request
router.post("/request", auth, async (req, res) => {
  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({ message: "Target user ID is required." });
  if (targetUserId === req.user.id) return res.status(400).json({ message: "You cannot connect with yourself." });

  try {
    const uid = req.user.id;

    // Check if blocked
    const blockSnap = await db.collection("user_blocks")
      .where("blocker", "==", targetUserId)
      .where("blocked", "==", uid)
      .get();
    if (!blockSnap.empty) return res.status(403).json({ message: "Unable to send connection request." });

    // Check existing connection
    const connCheck = await db.collection("connections")
      .where("user1", "in", [uid, targetUserId])
      .get();

    const existingConn = connCheck.docs.find(d => {
      const data = d.data();
      return (data.user1 === uid && data.user2 === targetUserId) || (data.user1 === targetUserId && data.user2 === uid);
    });

    if (existingConn && existingConn.data().status === 'connected') {
      return res.status(400).json({ message: "You are already connected." });
    }

    // Check pending request
    const pendingSnap = await db.collection("connection_requests")
      .where("from_user", "==", uid)
      .where("to_user", "==", targetUserId)
      .where("status", "==", "pending")
      .get();

    if (!pendingSnap.empty) return res.status(400).json({ message: "Connection request already sent." });

    const reqRef = db.collection("connection_requests").doc();
    await reqRef.set({
      id: reqRef.id,
      from_user: uid,
      to_user: targetUserId,
      status: "pending",
      created_at: new Date()
    });

    res.json({ message: "Connection request sent!", requestId: reqRef.id });
  } catch (err) {
    console.error("Connection request error:", err);
    res.status(500).json({ message: "Failed to send request." });
  }
});

// Accept connection request
router.post("/accept", auth, async (req, res) => {
  const { requestId, fromUserId } = req.body;

  try {
    const uid = req.user.id;

    let reqDoc;
    if (requestId) {
      reqDoc = await db.collection("connection_requests").doc(requestId).get();
    } else if (fromUserId) {
      const snap = await db.collection("connection_requests")
        .where("from_user", "==", fromUserId)
        .where("to_user", "==", uid)
        .where("status", "==", "pending")
        .get();
      if (!snap.empty) reqDoc = snap.docs[0];
    }

    if (!reqDoc || !reqDoc.exists) return res.status(404).json({ message: "Request not found." });

    const reqData = reqDoc.data();
    if (reqData.to_user !== uid) return res.status(403).json({ message: "Unauthorized." });

    // Update request
    await reqDoc.ref.update({ status: "accepted" });

    // Create connection
    const connRef = db.collection("connections").doc();
    await connRef.set({
      id: connRef.id,
      user1: reqData.from_user,
      user2: uid,
      status: "connected",
      created_at: new Date()
    });

    res.json({ message: "Connection accepted!" });
  } catch (err) {
    console.error("Accept connection error:", err);
    res.status(500).json({ message: "Failed to accept connection." });
  }
});

// Decline connection request
router.post("/decline", auth, async (req, res) => {
  const { requestId } = req.body;
  try {
    const reqDoc = await db.collection("connection_requests").doc(requestId).get();
    if (!reqDoc.exists) return res.status(404).json({ message: "Request not found." });
    if (reqDoc.data().to_user !== req.user.id) return res.status(403).json({ message: "Unauthorized." });

    await reqDoc.ref.update({ status: "declined" });
    res.json({ message: "Request declined." });
  } catch (err) {
    console.error("Decline connection error:", err);
    res.status(500).json({ message: "Failed to decline request." });
  }
});

// Remove connection
router.post("/remove", auth, async (req, res) => {
  const { targetUserId } = req.body;
  try {
    const uid = req.user.id;
    const snap1 = await db.collection("connections").where("user1", "==", uid).where("user2", "==", targetUserId).get();
    const snap2 = await db.collection("connections").where("user1", "==", targetUserId).where("user2", "==", uid).get();

    const docs = [...snap1.docs, ...snap2.docs];
    for (const doc of docs) {
      await doc.ref.delete();
    }

    res.json({ message: "Connection removed." });
  } catch (err) {
    console.error("Remove connection error:", err);
    res.status(500).json({ message: "Failed to remove connection." });
  }
});

// Block user
router.post("/block", auth, async (req, res) => {
  const { targetUserId, reason } = req.body;
  try {
    const uid = req.user.id;
    const blockRef = db.collection("user_blocks").doc();
    await blockRef.set({
      id: blockRef.id,
      blocker: uid,
      blocked: targetUserId,
      reason: reason || 'User blocked',
      created_at: new Date()
    });

    res.json({ message: "User blocked successfully." });
  } catch (err) {
    console.error("Block user error:", err);
    res.status(500).json({ message: "Failed to block user." });
  }
});

module.exports = router;
