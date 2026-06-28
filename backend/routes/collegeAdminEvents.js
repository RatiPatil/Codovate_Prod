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

    const snapshot = await db.collection('events')
                             .where('college_id', '==', targetCollegeId)
                             .get();
    const events = [];
    snapshot.forEach(doc => {
      events.push({ id: doc.id, ...doc.data() });
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching events' });
  }
});

router.post('/', collegeAdminOnly, [
  body('title').notEmpty().withMessage('Title is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('type').notEmpty().withMessage('Type is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const targetCollegeId = req.user.role === 'super_admin' ? req.body.college_id : req.user.college_id;
    const { title, description, date, type, link } = req.body;
    
    const newDocRef = db.collection('events').doc();
    const newEvent = {
      id: newDocRef.id,
      title,
      description: description || '',
      date,
      type,
      link: link || '',
      college_id: targetCollegeId,
      status: 'upcoming',
      created_at: new Date()
    };
    await newDocRef.set(newEvent);
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating event' });
  }
});

router.put('/:id', collegeAdminOnly, async (req, res) => {
  try {
    const targetCollegeId = req.user.role === 'super_admin' ? req.body.college_id : req.user.college_id;
    const docRef = db.collection('events').doc(req.params.id);
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
    const docRef = db.collection('events').doc(req.params.id);
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
