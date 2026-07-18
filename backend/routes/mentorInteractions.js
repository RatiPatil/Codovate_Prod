const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const auth = require('../middleware/auth');

// Middleware to ensure only mentor can access
const mentorOnly = (req, res, next) => {
  if (req.user.role !== 'mentor') {
    return res.status(403).json({ message: 'Mentor access required.' });
  }
  next();
};

// 1. GET: Students who have contacted this mentor (Students Viewer)
router.get('/students', mentorOnly, async (req, res) => {
  try {
    // A student has "contacted" a mentor if there's a chat session or query between them.
    // We will find distinct students from mentor_queries or mentor_chats.
    const queriesSnap = await db.collection('mentorQueries')
      .where('mentor_id', '==', req.user.id)
      .get();
      
    const studentIds = new Set();
    queriesSnap.forEach(doc => studentIds.add(doc.data().student_id));
    
    // Fetch student details
    const students = [];
    for (const sid of studentIds) {
      const sDoc = await db.collection('students').doc(sid).get();
      if (sDoc.exists) {
        const sData = sDoc.data();
        const userDoc = await db.collection('users').doc(sid).get();
        students.push({
          id: sid,
          name: userDoc.exists ? userDoc.data().name : 'Unknown',
          college: sData.college_name || 'N/A',
          skills: sData.profile_data?.skills || [],
          resume_url: sData.resume_url || null,
          projects_count: sData.projects?.length || 0,
          certificates_count: sData.certificates?.length || 0
        });
      }
    }
    
    res.json(students);
  } catch (error) {
    console.error("Fetch students error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 2. GET: Mentor's Dashboard Stats
router.get('/dashboard-stats', mentorOnly, async (req, res) => {
  try {
    const mentorDocs = await db.collection("mentors").where("user_id", "==", req.user.id).get();
    let mentorId = req.user.id;
    if (!mentorDocs.empty) {
      mentorId = mentorDocs.docs[0].id; // actual mentor doc id
    }
    
    // Total Students (from mentorQueries)
    const queriesSnap = await db.collection('mentorQueries')
      .where('mentor_id', '==', req.user.id)
      .get();
      
    let pending_requests = 0;
    const studentIds = new Set();
    
    queriesSnap.forEach(doc => {
      const data = doc.data();
      studentIds.add(data.student_id);
      if (data.status === 'Assigned' || data.status === 'In Progress') {
        pending_requests++;
      }
    });

    // Upcoming Sessions
    const sessionsSnap = await db.collection('mentorSessions')
      .where('mentor_id', '==', mentorId)
      .where('status', 'in', ['Pending', 'Scheduled'])
      .get();
    
    // Reviews
    const reviewsSnap = await db.collection('mentor_reviews')
      .where('mentor_id', '==', req.user.id)
      .get();

    // Resources
    const resourcesSnap = await db.collection('mentorResources')
      .where('mentor_id', '==', req.user.id)
      .get();

    res.json({
      total_students: studentIds.size,
      pending_requests: pending_requests,
      total_reviews: reviewsSnap.size,
      upcoming_sessions: sessionsSnap.size,
      resources_shared: resourcesSnap.size,
      revenue: 0 // Mock for future
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. GET: Fetch chat sessions / questions for this mentor
router.get('/chats', mentorOnly, async (req, res) => {
  try {
    const mentorId = req.user.id;
    const queriesSnap = await db.collection('mentorQueries')
      .where('mentor_id', '==', mentorId)
      .get();
      
    const chats = [];
    queriesSnap.forEach(doc => {
      chats.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by created descending
    chats.sort((a, b) => {
      const timeA = a.created_at?.toDate ? a.created_at.toDate().getTime() : new Date(a.created_at).getTime();
      const timeB = b.created_at?.toDate ? b.created_at.toDate().getTime() : new Date(b.created_at).getTime();
      return timeB - timeA;
    });

    res.json(chats);
  } catch (error) {
    console.error("Fetch chats error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 4. PUT: Update Question/Chat status (Reply, Mark as Answered, Close)
router.put('/chats/:id', mentorOnly, async (req, res) => {
  try {
    const { status, answer } = req.body;
    const validStatuses = ['Assigned', 'In Progress', 'Answered', 'Closed'];
    if (status && !validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const docRef = db.collection('mentorQueries').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Chat not found' });
    
    if (doc.data().mentor_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (status === 'Answered') updateData.responded_at = new Date();
    if (answer) updateData.answer = answer;

    await docRef.update(updateData);
    
    // Notify student via socket
    if (req.io) {
      req.io.to(`user_${doc.data().student_id}`).emit('chat_update', { id: doc.id, ...updateData });
    }

    res.json({ message: 'Chat updated successfully' });
  } catch (error) {
    console.error("Update chat error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 5. POST/GET: Messages inside a Chat Session
router.get('/chats/:chatId/messages', auth, async (req, res) => {
  try {
    const messagesSnap = await db.collection('mentorQueries')
      .doc(req.params.chatId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .get();
      
    const messages = [];
    messagesSnap.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/chats/:chatId/messages', auth, async (req, res) => {
  try {
    const { text, attachments } = req.body;
    const msgRef = db.collection('mentorQueries').doc(req.params.chatId).collection('messages').doc();
    const msg = {
      id: msgRef.id,
      sender_id: req.user.id,
      sender_role: req.user.role,
      text: text || '',
      attachments: attachments || [],
      timestamp: new Date(),
      read: false
    };
    
    await msgRef.set(msg);
    
    const chatDoc = await db.collection('mentorQueries').doc(req.params.chatId).get();
    
    if (req.io) {
      const room1 = `user_${chatDoc.data().student_id}`;
      const room2 = `user_${chatDoc.data().mentor_id}`; // For mentor connections
      req.io.to(room1).to(room2).emit('new_message', { chatId: req.params.chatId, message: msg });
    }
    
    res.json(msg);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE: Own Message
router.delete('/chats/:chatId/messages/:messageId', auth, async (req, res) => {
  try {
    const msgRef = db.collection('mentorQueries')
      .doc(req.params.chatId)
      .collection('messages')
      .doc(req.params.messageId);
      
    const msgDoc = await msgRef.get();
    if (!msgDoc.exists) return res.status(404).json({ message: 'Not found' });
    if (msgDoc.data().sender_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    
    await msgRef.delete();
    
    if (req.io) {
      const chatDoc = await db.collection('mentorQueries').doc(req.params.chatId).get();
      const room1 = `user_${chatDoc.data().student_id}`;
      const room2 = `user_${chatDoc.data().mentor_id}`;
      req.io.to(room1).to(room2).emit('message_deleted', { chatId: req.params.chatId, messageId: req.params.messageId });
    }
    
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
