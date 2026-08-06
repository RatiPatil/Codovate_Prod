const express = require('express');
const router = express.Router();
const { db, FieldValue } = require('../config/firebase');
const auth = require('../middleware/auth');
const admin = require('firebase-admin');

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

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
      fetchUserIds.add(mapDoc(doc).receiver_id);
    });
    received.forEach(doc => {
      connectionIds.add(doc.id);
      fetchUserIds.add(mapDoc(doc).sender_id);
    });

    // Fetch user details for direct chats in parallel
    const usersData = {};
    const userFetchPromises = Array.from(fetchUserIds).map(async (uid) => {
      const [uDoc, authDoc] = await Promise.all([
        db.collection('students').doc(uid).get(),
        db.collection('users').doc(uid).get()
      ]);
      if (uDoc.exists || authDoc.exists) {
        usersData[uid] = {
          ...(uDoc.exists ? mapDoc(uDoc) : {}),
          name: authDoc.exists ? mapDoc(authDoc).name : (uDoc.exists ? mapDoc(uDoc).full_name : 'User')
        };
      }
    });
    await Promise.all(userFetchPromises);

    sent.forEach(doc => {
      const peerId = mapDoc(doc).receiver_id;
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
          last_activity: mapDoc(doc).updated_at || mapDoc(doc).created_at
        });
      }
    });

    received.forEach(doc => {
      const peerId = mapDoc(doc).sender_id;
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
          last_activity: mapDoc(doc).updated_at || mapDoc(doc).created_at
        });
      }
    });

    // 2. Get Team Chats in parallel
    const myTeamsSnap = await db.collection('team_members').where('user_id', '==', userId).get();
    const teamFetchPromises = myTeamsSnap.docs.map(async (doc) => {
      const teamId = mapDoc(doc).team_id;
      const teamDoc = await db.collection('teams').doc(teamId).get();
      if (teamDoc.exists) {
        const tData = mapDoc(teamDoc);
        return {
          id: `team_${teamId}`,
          type: 'team',
          team_id: teamId,
          name: tData.name,
          logo: tData.logo || null,
          last_activity: tData.last_activity || tData.created_at
        };
      }
      return null;
    });

    const teamChats = (await Promise.all(teamFetchPromises)).filter(Boolean);
    chats.push(...teamChats);

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

// GET: Messages for a specific chat (bounded to 50 latest)
router.get('/:chatId/messages', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    let messagesRef;
    
    if (chatId.startsWith('direct_')) {
      const connId = chatId.replace('direct_', '');
      
      // Verify access
      const connDoc = await db.collection('student_connections').doc(connId).get();
      if (!connDoc.exists) return res.status(404).json({ message: "Connection not found" });
      const conn = mapDoc(connDoc);
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

    const messagesSnap = await messagesRef.orderBy('timestamp', 'desc').limit(50).get();
    const messages = [];
    messagesSnap.forEach(doc => messages.push({ id: doc.id, ...mapDoc(doc) }));
    messages.reverse(); // Return in chronological order

    // Mark as read in parallel
    const unread = messagesSnap.docs.filter(d => !mapDoc(d).read_by?.includes(req.user.id));
    if (unread.length > 0) {
      await Promise.all(unread.map(doc => doc.ref.update({ read_by: FieldValue.arrayUnion(req.user.id) })));
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
      if (mapDoc(connDoc).sender_id !== req.user.id && mapDoc(connDoc).receiver_id !== req.user.id) return res.status(403).json({ message: "Forbidden" });

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
    const timestamp = FieldValue.serverTimestamp();
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
