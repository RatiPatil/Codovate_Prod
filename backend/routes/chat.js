const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const auth = require('../middleware/auth');
const admin = require('firebase-admin');

// GET: Fetch chats list for the current user
// Includes direct chats (connections) and team chats
router.get('/list', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    let chats = [];

    // 1. Get Direct Connections (Accepted)
    const sent = await db.collection('student_connections').where('sender_id', '==', userId).where('status', '==', 'accepted').get();
    const received = await db.collection('student_connections').where('receiver_id', '==', userId).where('status', '==', 'accepted').get();
    
    const connectionIds = new Set();
    const fetchUserIds = new Set();

    sent.forEach(doc => {
      connectionIds.add(doc.id);
      fetchUserIds.add(doc.data().receiver_id);
    });
    received.forEach(doc => {
      connectionIds.add(doc.id);
      fetchUserIds.add(doc.data().sender_id);
    });

    // Fetch user details for direct chats
    const usersData = {};
    for (const uid of fetchUserIds) {
      const uDoc = await db.collection('students').doc(uid).get();
      if (uDoc.exists) {
        usersData[uid] = uDoc.data();
        const authDoc = await db.collection('users').doc(uid).get();
        if(authDoc.exists) usersData[uid].name = authDoc.data().name;
      }
    }

    sent.forEach(doc => {
      const peerId = doc.data().receiver_id;
      if (usersData[peerId]) {
        chats.push({
          id: `direct_${doc.id}`,
          type: 'direct',
          connection_id: doc.id,
          peer: {
            id: peerId,
            name: usersData[peerId].name || usersData[peerId].full_name,
            avatar: usersData[peerId].profile_photo || null
          },
          last_activity: doc.data().updated_at || doc.data().created_at
        });
      }
    });

    received.forEach(doc => {
      const peerId = doc.data().sender_id;
      if (usersData[peerId]) {
        chats.push({
          id: `direct_${doc.id}`,
          type: 'direct',
          connection_id: doc.id,
          peer: {
            id: peerId,
            name: usersData[peerId].name || usersData[peerId].full_name,
            avatar: usersData[peerId].profile_photo || null
          },
          last_activity: doc.data().updated_at || doc.data().created_at
        });
      }
    });

    // 2. Get Team Chats
    const myTeamsSnap = await db.collection('team_members').where('user_id', '==', userId).get();
    for (const doc of myTeamsSnap.docs) {
      const teamId = doc.data().team_id;
      const teamDoc = await db.collection('teams').doc(teamId).get();
      if (teamDoc.exists) {
        const tData = teamDoc.data();
        chats.push({
          id: `team_${teamId}`,
          type: 'team',
          team_id: teamId,
          name: tData.name,
          logo: tData.logo || null,
          last_activity: tData.last_activity || tData.created_at
        });
      }
    }

    // Sort by most recent activity
    chats.sort((a, b) => {
      const tA = a.last_activity?.toDate ? a.last_activity.toDate().getTime() : new Date(a.last_activity || 0).getTime();
      const tB = b.last_activity?.toDate ? b.last_activity.toDate().getTime() : new Date(b.last_activity || 0).getTime();
      return tB - tA;
    });

    res.json(chats);
  } catch (err) {
    console.error("Get chats error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET: Messages for a specific chat
router.get('/:chatId/messages', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    let messagesRef;
    
    if (chatId.startsWith('direct_')) {
      const connId = chatId.replace('direct_', '');
      
      // Verify access
      const connDoc = await db.collection('student_connections').doc(connId).get();
      if (!connDoc.exists) return res.status(404).json({ message: "Connection not found" });
      const conn = connDoc.data();
      if (conn.sender_id !== req.user.id && conn.receiver_id !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      messagesRef = db.collection('student_connections').doc(connId).collection('messages');
    } else if (chatId.startsWith('team_')) {
      const teamId = chatId.replace('team_', '');
      
      // Verify access
      const tmDoc = await db.collection('team_members').where('team_id', '==', teamId).where('user_id', '==', req.user.id).get();
      if (tmDoc.empty) return res.status(403).json({ message: "Forbidden" });

      messagesRef = db.collection('teams').doc(teamId).collection('messages');
    } else {
      return res.status(400).json({ message: "Invalid chat ID format" });
    }

    const messagesSnap = await messagesRef.orderBy('timestamp', 'asc').get();
    const messages = [];
    messagesSnap.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));

    // Mark as read for current user
    const unread = messagesSnap.docs.filter(d => !d.data().read_by?.includes(req.user.id));
    for (const doc of unread) {
      await doc.ref.update({
        read_by: admin.firestore.FieldValue.arrayUnion(req.user.id)
      });
    }

    res.json(messages);
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST: Send a message
router.post('/:chatId/messages', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text, attachments } = req.body;
    
    let messagesRef, parentRef;
    let roomName;
    let type;

    if (chatId.startsWith('direct_')) {
      type = 'direct';
      const connId = chatId.replace('direct_', '');
      
      const connDoc = await db.collection('student_connections').doc(connId).get();
      if (!connDoc.exists) return res.status(404).json({ message: "Connection not found" });
      if (connDoc.data().sender_id !== req.user.id && connDoc.data().receiver_id !== req.user.id) return res.status(403).json({ message: "Forbidden" });

      parentRef = db.collection('student_connections').doc(connId);
      messagesRef = parentRef.collection('messages');
      roomName = `chat_${connId}`;
    } else if (chatId.startsWith('team_')) {
      type = 'team';
      const teamId = chatId.replace('team_', '');
      
      const tmDoc = await db.collection('team_members').where('team_id', '==', teamId).where('user_id', '==', req.user.id).get();
      if (tmDoc.empty) return res.status(403).json({ message: "Forbidden" });

      parentRef = db.collection('teams').doc(teamId);
      messagesRef = parentRef.collection('messages');
      roomName = `team_${teamId}`;
    } else {
      return res.status(400).json({ message: "Invalid chat ID format" });
    }

    const msgRef = messagesRef.doc();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const msg = {
      id: msgRef.id,
      sender_id: req.user.id,
      sender_name: req.user.name || 'Student',
      text: text || '',
      attachments: attachments || [],
      timestamp: new Date(),
      read_by: [req.user.id]
    };

    await msgRef.set(msg);
    await parentRef.update({ 
      updated_at: timestamp, 
      last_activity: timestamp,
      last_message: text 
    }, { merge: true });

    if (req.io) {
      req.io.to(roomName).emit('new_message', { chatId, message: msg });
    }

    res.json(msg);
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
