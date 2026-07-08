const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const auth = require('../middleware/auth');

// Helper to find an available mentor using a basic FCFS / Least-Loaded approach
async function assignMentor() {
  console.log(`[AssignMentor] Starting mentor assignment process...`);
  const mentorsSnapshot = await db.collection('mentors').get();
  console.log(`[AssignMentor] Found ${mentorsSnapshot.size} total mentors in DB.`);
  
  // Filter active mentors
  const activeMentors = mentorsSnapshot.docs.filter(doc => {
    const data = doc.data();
    return data.is_active === true || data.status === 'active';
  });
  console.log(`[AssignMentor] Filtered down to ${activeMentors.length} active/approved mentors.`);

  if (activeMentors.length === 0) {
    console.log(`[AssignMentor] No active mentors available. Returning null.`);
    return null;
  }

  // We'll do a quick check of active queries to find the least loaded mentor.
  let leastLoadedMentor = null;
  let minQueries = Infinity;

  for (const mentorDoc of activeMentors) {
    const activeQueries = await db.collection('mentor_queries')
      .where('mentor_id', '==', mentorDoc.id)
      .where('status', 'in', ['Assigned', 'In Progress'])
      .get();
      
    console.log(`[AssignMentor] Mentor ${mentorDoc.id} has ${activeQueries.size} active queries.`);
    
    if (activeQueries.size < minQueries) {
      minQueries = activeQueries.size;
      leastLoadedMentor = mentorDoc.id;
    }
  }

  console.log(`[AssignMentor] Selected mentor ${leastLoadedMentor} with ${minQueries} active queries.`);
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

  const { title, description, category, priority, target_mentor_id, attachments, session_id } = req.body;
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

    // Assign specific mentor if provided, else FCFS
    if (!assignedMentorId) {
      finalSessionId = finalSessionId || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      
      if (target_mentor_id && target_mentor_id !== 'auto') {
        const mentorDoc = await db.collection('mentors').doc(target_mentor_id).get();
        if (mentorDoc.exists && (mentorDoc.data().is_active === true || mentorDoc.data().status === 'active')) {
          assignedMentorId = target_mentor_id;
        } else {
          return res.status(400).json({ message: 'Selected mentor is not available.' });
        }
      } else {
        assignedMentorId = await assignMentor();
      }
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
      category: category || 'General',
      priority: priority || 'Medium',
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
      // Find the mentor document associated with this user
      const mentorDocs = await db.collection('mentors').where('user_id', '==', req.user.id).get();
      if (!mentorDocs.empty) {
        queriesRef = queriesRef.where('mentor_id', '==', mentorDocs.docs[0].id);
      } else {
        // If they don't have a mentor profile, they won't have queries
        return res.json([]);
      }
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

    let mentorId = null;
    if (req.user.role === 'mentor') {
      const mentorDocs = await db.collection('mentors').where('user_id', '==', req.user.id).get();
      if (!mentorDocs.empty) mentorId = mentorDocs.docs[0].id;
    }

    // Permissions: Only assigned mentor or student (can close) or admin
    const isMentor = req.user.role === 'mentor' && queryData.mentor_id === mentorId;
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
