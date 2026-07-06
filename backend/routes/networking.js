const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const auth = require('../middleware/auth');

// Helper: Check and delete expired chats
async function checkExpiredChats(connectionId = null) {
  const now = new Date();
  let connectionsRef = db.collection('student_connections').where('status', '==', 'accepted');
  
  const snapshot = await connectionsRef.get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.chat_expires_at) {
      const expires = data.chat_expires_at.toDate ? data.chat_expires_at.toDate() : new Date(data.chat_expires_at);
      if (now > expires) {
        // Chat expired. Mark connection as "expired" so they can reconnect if they want
        await db.collection('student_connections').doc(doc.id).update({
          status: 'expired'
        });
        
        // Delete all chat messages for this connection (Ephemeral requirement)
        const messagesRef = db.collection('student_chat_messages').where('connection_id', '==', doc.id);
        const msgSnapshot = await messagesRef.get();
        
        const batch = db.batch();
        msgSnapshot.docs.forEach((msgDoc) => {
          batch.delete(msgDoc.ref);
        });
        await batch.commit();
        console.log(`🧹 Deleted expired chat messages for connection ${doc.id}`);
      }
    }
  }
}

// GET: Discover students (porting from teams/discover but tailored)
router.get('/discover', auth, async (req, res) => {
  try {
    const { skill, domain, experience } = req.query;
    let usersRef = db.collection('students');
    
    // We fetch all and filter in memory for now due to Firestore limitations with multiple array-contains
    const snapshot = await usersRef.get();
    let students = [];
    
    snapshot.forEach(doc => {
      // Don't discover self
      if (doc.id === req.user.id) return;
      
      const data = doc.data();
      let match = true;
      
      if (skill && !(data.skills || []).some(s => s.toLowerCase().includes(skill.toLowerCase()))) match = false;
      if (domain && data.career_goal !== domain) match = false;
      if (experience && data.experience_level !== experience) match = false;
      
      if (match) {
        students.push({
          id: doc.id,
          name: data.name || data.full_name || 'Unknown',
          college: data.college,
          skills: data.skills || [],
          career_goal: data.career_goal,
          bio: data.bio,
          desired_roles: data.desired_roles || [],
          year: data.year,
          district: data.district,
          state: data.state,
          achievements: data.achievements || [],
          seeking: data.seeking || [],
          passionate_about: data.passionate_about || [],
          experience_level: data.experience_level
        });
      }
    });

    res.json(students);
  } catch (err) {
    console.error("Discover error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST: Send connection request
router.post('/connect', auth, async (req, res) => {
  const { receiver_id } = req.body;
  if (!receiver_id) return res.status(400).json({ message: 'receiver_id is required' });
  if (receiver_id === req.user.id) return res.status(400).json({ message: 'Cannot connect with yourself' });

  try {
    // Check if connection already exists
    const existingSender = await db.collection('student_connections')
      .where('sender_id', '==', req.user.id)
      .where('receiver_id', '==', receiver_id)
      .get();
    
    const existingReceiver = await db.collection('student_connections')
      .where('sender_id', '==', receiver_id)
      .where('receiver_id', '==', req.user.id)
      .get();
      
    if (!existingSender.empty || !existingReceiver.empty) {
      // If there's an existing one, check status
      const existing = !existingSender.empty ? existingSender.docs[0] : existingReceiver.docs[0];
      if (existing.data().status === 'pending') {
        return res.status(400).json({ message: 'Connection request already pending.' });
      }
      if (existing.data().status === 'accepted') {
        return res.status(400).json({ message: 'Already connected.' });
      }
      // If 'rejected' or 'expired', we can create a new one, so we just delete the old one
      await db.collection('student_connections').doc(existing.id).delete();
    }

    const connRef = db.collection('student_connections').doc();
    const newConn = {
      id: connRef.id,
      sender_id: req.user.id,
      receiver_id,
      status: 'pending',
      created_at: new Date()
    };

    await connRef.set(newConn);

    if (req.io) {
      req.io.to(`user_${receiver_id}`).emit('new_notification', {
        title: 'New Connection Request',
        body: 'Someone wants to connect with you!'
      });
      // Emit the raw connection request for real-time UI updates
      req.io.to(`user_${receiver_id}`).emit('connection_request', {
        ...newConn,
        sender_name: req.user.name || 'A student'
      });
    }

    res.status(201).json(newConn);
  } catch (err) {
    console.error("Connect error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT: Accept/Reject connection
router.put('/connect/:id', auth, async (req, res) => {
  const { action } = req.body; // 'accept' or 'reject'
  if (!['accept', 'reject'].includes(action)) return res.status(400).json({ message: 'Invalid action' });

  try {
    const docRef = db.collection('student_connections').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Connection not found' });
    
    const data = doc.data();
    if (data.receiver_id !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    if (action === 'reject') {
      await docRef.update({ status: 'rejected' });
      return res.json({ message: 'Request rejected' });
    }

    // Accept: Set 24 hour expiry
    const now = new Date();
    const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 hours
    
    await docRef.update({
      status: 'accepted',
      accepted_at: now,
      chat_expires_at: expiry
    });

    if (req.io) {
      req.io.to(`user_${data.sender_id}`).emit('new_notification', {
        title: 'Connection Accepted',
        body: 'Your connection request was accepted. You can now chat for 24 hours!'
      });
      req.io.to(`user_${data.sender_id}`).emit('connection_accepted', { id: doc.id });
    }

    res.json({ message: 'Request accepted. Chat is active for 24 hours.' });
  } catch (err) {
    console.error("Accept connect error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET: My connections (Pending & Accepted)
router.get('/connections', auth, async (req, res) => {
  try {
    await checkExpiredChats(); // Sweep expired ones

    const sent = await db.collection('student_connections').where('sender_id', '==', req.user.id).get();
    const received = await db.collection('student_connections').where('receiver_id', '==', req.user.id).get();
    
    let connections = [];
    
    const extract = async (docs) => {
      for (const doc of docs) {
        const d = doc.data();
        if (d.status === 'rejected' || d.status === 'expired') continue; // Don't show
        
        const otherId = d.sender_id === req.user.id ? d.receiver_id : d.sender_id;
        const otherDoc = await db.collection('students').doc(otherId).get();
        const otherData = otherDoc.exists ? otherDoc.data() : { name: 'Unknown' };
        
        connections.push({
          ...d,
          id: doc.id,
          other_user: {
            id: otherId,
            name: otherData.name,
            college: otherData.college
          }
        });
      }
    };

    await extract(sent.docs);
    await extract(received.docs);

    res.json(connections);
  } catch (err) {
    console.error("Get connections error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET: Chat messages
router.get('/chats/:connectionId', auth, async (req, res) => {
  try {
    const connDoc = await db.collection('student_connections').doc(req.params.connectionId).get();
    if (!connDoc.exists) return res.status(404).json({ message: 'Connection not found' });
    
    const connData = connDoc.data();
    if (connData.sender_id !== req.user.id && connData.receiver_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    if (connData.status !== 'accepted') {
      return res.status(403).json({ message: 'Chat is not active' });
    }

    // Check expiry
    const now = new Date();
    const expires = connData.chat_expires_at.toDate ? connData.chat_expires_at.toDate() : new Date(connData.chat_expires_at);
    if (now > expires) {
      return res.status(403).json({ message: 'Chat has expired', expired: true });
    }

    const messages = await db.collection('student_chat_messages')
      .where('connection_id', '==', req.params.connectionId)
      .get();
      
    let msgs = [];
    messages.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
    
    msgs.sort((a, b) => {
      const timeA = a.created_at?.toDate ? a.created_at.toDate().getTime() : new Date(a.created_at || 0).getTime();
      const timeB = b.created_at?.toDate ? b.created_at.toDate().getTime() : new Date(b.created_at || 0).getTime();
      return timeA - timeB;
    });

    res.json(msgs);
  } catch (err) {
    console.error("Get chat error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST: Send chat message
router.post('/chats/:connectionId/messages', auth, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: 'Text is required' });

  try {
    const connDoc = await db.collection('student_connections').doc(req.params.connectionId).get();
    if (!connDoc.exists) return res.status(404).json({ message: 'Connection not found' });
    
    const connData = connDoc.data();
    if (connData.sender_id !== req.user.id && connData.receiver_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    if (connData.status !== 'accepted') {
      return res.status(403).json({ message: 'Chat is not active' });
    }

    // Check expiry
    const now = new Date();
    const expires = connData.chat_expires_at.toDate ? connData.chat_expires_at.toDate() : new Date(connData.chat_expires_at);
    if (now > expires) {
      return res.status(403).json({ message: 'Chat has expired and messages cannot be sent.' });
    }

    const msgRef = db.collection('student_chat_messages').doc();
    const newMsg = {
      id: msgRef.id,
      connection_id: req.params.connectionId,
      sender_id: req.user.id,
      text,
      created_at: now
    };

    await msgRef.set(newMsg);

    // Emit to other user
    const otherId = connData.sender_id === req.user.id ? connData.receiver_id : connData.sender_id;
    if (req.io) {
      req.io.to(`user_${otherId}`).emit('new_chat_message', newMsg);
    }

    res.status(201).json(newMsg);
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
