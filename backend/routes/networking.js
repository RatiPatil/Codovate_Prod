const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const auth = require('../middleware/auth');

// Helper: No longer expiring chats
async function checkExpiredChats(connectionId = null) {
  return; // Disabled expiration to make chat unlimited
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

    const notifRef = db.collection('notifications').doc();
    const notifData = {
      id: notifRef.id,
      user_id: receiver_id,
      title: 'New Connection Request',
      message: 'Someone wants to connect with you!',
      type: 'connection_request',
      is_read: false,
      created_at: new Date()
    };
    await notifRef.set(notifData);

    if (req.io) {
      req.io.to(`user_${receiver_id}`).emit('new_notification', notifData);
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

    // Accept: No expiry
    const now = new Date();
    
    await docRef.update({
      status: 'accepted',
      accepted_at: now
    });

    const notifRef = db.collection('notifications').doc();
    const notifData = {
      id: notifRef.id,
      user_id: data.sender_id,
      title: 'Connection Accepted',
      message: 'Your connection request was accepted. You can now chat unlimitedly!',
      type: 'connection_accepted',
      is_read: false,
      created_at: new Date()
    };
    await notifRef.set(notifData);

    if (req.io) {
      req.io.to(`user_${data.sender_id}`).emit('new_notification', notifData);
      req.io.to(`user_${data.sender_id}`).emit('connection_accepted', { id: doc.id });
    }

    res.json({ message: 'Request accepted. Chat is now active.' });
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
            college: otherData.college,
            skills: otherData.skills || [],
            career_goal: otherData.career_goal,
            desired_roles: otherData.desired_roles || [],
            year: otherData.year,
            degree: otherData.degree,
            district: otherData.district,
            state: otherData.state,
            achievements: otherData.achievements || [],
            seeking: otherData.seeking || [],
            passionate_about: otherData.passionate_about || [],
            experience_level: otherData.experience_level
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

    // No longer checking expiry


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

    // No longer checking expiry
    const now = new Date();

    const msgRef = db.collection('student_chat_messages').doc();
    const newMsg = {
      id: msgRef.id,
      connection_id: req.params.connectionId,
      sender_id: req.user.id,
      text,
      status: 'sent',
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
