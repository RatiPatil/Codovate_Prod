const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { body, validationResult } = require('express-validator');

const collegeAdminOnly = (req, res, next) => {
  if (req.user.role !== 'college_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'College Admin access required.' });
  }
  if (req.user.role === 'college_admin' && !req.user.college_id) {
    return res.status(403).json({ message: 'No college association found.' });
  }
  next();
};

router.get('/', collegeAdminOnly, async (req, res) => {
  try {
    const targetCollegeId = req.user.role === 'super_admin' ? req.query.college_id : req.user.college_id;
    if (!targetCollegeId) return res.status(400).json({ message: 'College ID required.' });

    const snapshot = await db.collection('notifications')
                             .where('college_id', '==', targetCollegeId)
                             .get();
    const notes = [];
    snapshot.forEach(doc => {
      notes.push({ id: doc.id, ...doc.data() });
    });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

router.post('/', collegeAdminOnly, [
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').isIn(['info', 'warning', 'success', 'error'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const targetCollegeId = req.user.role === 'super_admin' ? req.body.college_id : req.user.college_id;
    const { title, message, type, target_role, expires_at } = req.body;
    
    const newDocRef = db.collection('notifications').doc();
    const newNote = {
      id: newDocRef.id,
      title,
      message,
      type,
      target_role: target_role || 'all',
      expires_at: expires_at ? new Date(expires_at) : null,
      college_id: targetCollegeId,
      is_global: false, // College specific
      created_at: new Date(),
      read: false
    };
    await newDocRef.set(newNote);
    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating notification' });
  }
});

router.put('/:id', collegeAdminOnly, async (req, res) => {
  try {
    const targetCollegeId = req.user.role === 'super_admin' ? req.body.college_id : req.user.college_id;
    const docRef = db.collection('notifications').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Not found' });
    if (doc.data().college_id !== targetCollegeId && req.user.role !== 'super_admin') return res.status(403).json({ message: 'Forbidden' });
    
    const updateData = { ...req.body };
    delete updateData.college_id;
    await docRef.update(updateData);
    res.json((await docRef.get()).data());
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', collegeAdminOnly, async (req, res) => {
  try {
    const targetCollegeId = req.user.role === 'super_admin' ? req.query.college_id : req.user.college_id;
    const docRef = db.collection('notifications').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Not found' });
    if (doc.data().college_id !== targetCollegeId && req.user.role !== 'super_admin') return res.status(403).json({ message: 'Forbidden' });
    
    await docRef.delete();
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
