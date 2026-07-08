const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const auth = require('../middleware/auth');

// Helper to find an available mentor using a basic FCFS / Least-Loaded approach
async function assignMentor() {
  const mentorsSnapshot = await db.collection('mentors').get();
  
  // Filter active mentors
  const activeMentors = mentorsSnapshot.docs.filter(doc => {
    const data = doc.data();
    return data.is_active === true || data.status === 'active';
  });

  if (activeMentors.length === 0) return null;

  // We'll do a quick check of active queries to find the least loaded mentor.
  let leastLoadedMentor = null;
  let minQueries = Infinity;

  for (const mentorDoc of activeMentors) {
    const activeQueries = await db.collection('mentor_queries')
      .where('mentor_id', '==', mentorDoc.id)
      .where('status', 'in', ['Assigned', 'In Progress'])
      .get();
      
    if (activeQueries.size < minQueries) {
      minQueries = activeQueries.size;
      leastLoadedMentor = mentorDoc.id;
    }
  }

  return leastLoadedMentor;
}

// Helper to check for SLA Escalation (4 hours)
async function checkEscalations() {
  const now = new Date();
  const queriesRef = db.collection('mentor_queries');
  const snapshot = await queriesRef.where('status', 'in', ['Assigned', 'In Progress']).get();
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.deadline_at) {
      const deadline = data.deadline_at.toDate ? data.deadline_at.toDate() : new Date(data.deadline_at);
      if (now > deadline) {
        // Escalate!
        await queriesRef.doc(doc.id).update({
          status: 'Escalated',
          escalated_at: now
        });
        console.log(`🚨 Query ${doc.id} escalated due to SLA breach.`);
      }
    }
  }
}

// POST: Submit a new query
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can submit queries.' });

  const { title, description, attachments, session_id } = req.body;
  if (!title || !description) return res.status(400).json({ message: 'Title and description required.' });

  try {
    let assignedMentorId = null;
    let finalSessionId = session_id;

    // If part of an existing session, find the assigned mentor for that session
    if (finalSessionId) {
      const sessionQueries = await db.collection('mentor_queries')
        .where('session_id', '==', finalSessionId)
        .where('student_id', '==', req.user.id)
        .limit(1)
        .get();
        
      if (!sessionQueries.empty) {
        assignedMentorId = sessionQueries.docs[0].data().mentor_id;
      }
    }

    // If no existing session or no mentor found, create new session and assign a mentor (FCFS)
    if (!assignedMentorId) {
      finalSessionId = finalSessionId || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      assignedMentorId = await assignMentor();
    }

    if (!assignedMentorId) {
      return res.status(503).json({ message: 'No mentors available at the moment. Please try again later.' });
    }

    const now = new Date();
    const deadline = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours SLA

    const queryRef = db.collection('mentor_queries').doc();
    const newQuery = {
      id: queryRef.id,
      student_id: req.user.id,
      student_name: req.user.name || 'Student',
      mentor_id: assignedMentorId,
      session_id: finalSessionId,
      title,
      description,
      attachments: attachments || [],
      status: 'Assigned',
      created_at: now,
      assigned_at: now,
      deadline_at: deadline
    };

    await queryRef.set(newQuery);

    // Notify mentor via socket if connected
    if (req.io) {
      req.io.to(`admin_mentor_${assignedMentorId}`).emit('new_query', newQuery);
    }

    res.status(201).json(newQuery);
  } catch (err) {
    console.error("Submit query error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET: List queries
router.get('/', auth, async (req, res) => {
  try {
    // Also run escalation check opportunistically
    await checkEscalations();

    let queriesRef = db.collection('mentor_queries');
    
    if (req.user.role === 'student') {
      queriesRef = queriesRef.where('student_id', '==', req.user.id);
    } else if (req.user.role === 'mentor') {
      queriesRef = queriesRef.where('mentor_id', '==', req.user.id);
    } else if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      // Admins see all
    } else {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const snapshot = await queriesRef.get();
    let queries = [];
    snapshot.forEach(doc => queries.push({ id: doc.id, ...doc.data() }));

    // Sort by created_at DESC (newest first)
    queries.sort((a, b) => {
      const timeA = a.created_at?.toDate ? a.created_at.toDate().getTime() : new Date(a.created_at).getTime();
      const timeB = b.created_at?.toDate ? b.created_at.toDate().getTime() : new Date(b.created_at).getTime();
      return timeB - timeA;
    });

    res.json(queries);
  } catch (err) {
    console.error("Get queries error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT: Update status (Mentor or Admin)
router.put('/:id/status', auth, async (req, res) => {
  const { status, answer } = req.body; // Answer is optional but useful if answering
  const validStatuses = ['Assigned', 'In Progress', 'Answered', 'Closed', 'Escalated'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const docRef = db.collection('mentor_queries').doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) return res.status(404).json({ message: 'Query not found' });
    
    const queryData = doc.data();

    // Permissions: Only assigned mentor or student (can close) or admin
    const isMentor = req.user.role === 'mentor' && queryData.mentor_id === req.user.id;
    const isStudent = req.user.role === 'student' && queryData.student_id === req.user.id;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

    if (!isMentor && !isStudent && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Students can only close queries
    if (isStudent && status !== 'Closed') {
      return res.status(403).json({ message: 'Students can only close queries.' });
    }

    const updateData = { status };
    if (status === 'Answered') updateData.responded_at = new Date();
    if (answer) updateData.answer = answer;

    await docRef.update(updateData);

    const updatedDoc = (await docRef.get()).data();

    // Notify the other party
    if (req.io) {
      if (isMentor) req.io.to(`user_${queryData.student_id}`).emit('query_update', updatedDoc);
      if (isStudent) req.io.to(`admin_mentor_${queryData.mentor_id}`).emit('query_update', updatedDoc);
    }

    res.json(updatedDoc);
  } catch (err) {
    console.error("Update query error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
