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

// GET faculty for this college
router.get('/', collegeAdminOnly, async (req, res) => {
  try {
    const targetCollegeId = req.user.role === 'super_admin' ? req.query.college_id : req.user.college_id;
    if (!targetCollegeId) return res.status(400).json({ message: 'College ID required.' });

    const snapshot = await db.collection('faculty')
                             .where('college_id', '==', targetCollegeId)
                             .get();
    
    const faculty = [];
    snapshot.forEach(doc => {
      faculty.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching faculty' });
  }
});

// POST add faculty
router.post('/', collegeAdminOnly, [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('department').notEmpty().withMessage('Department is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const targetCollegeId = req.user.role === 'super_admin' ? req.body.college_id : req.user.college_id;
    const { name, email, department } = req.body;

    const newDocRef = db.collection('faculty').doc();
    const newFaculty = {
      id: newDocRef.id,
      name,
      email,
      department,
      college_id: targetCollegeId,
      status: 'active',
      created_at: new Date()
    };
    await newDocRef.set(newFaculty);
    res.status(201).json(newFaculty);
  } catch (error) {
    res.status(500).json({ message: 'Server error adding faculty' });
  }
});

// PUT update faculty
router.put('/:id', collegeAdminOnly, [
  body('name').optional().notEmpty(),
  body('department').optional().notEmpty(),
  body('status').optional().isIn(['active', 'suspended'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const targetCollegeId = req.user.role === 'super_admin' ? req.body.college_id : req.user.college_id;
    const docRef = db.collection('faculty').doc(req.params.id);
    const doc = await docRef.get();
    
    if (!doc.exists) return res.status(404).json({ message: 'Faculty not found' });
    if (doc.data().college_id !== targetCollegeId && req.user.role !== 'super_admin') {
       return res.status(403).json({ message: 'Cannot modify faculty from another college.' });
    }

    const updateData = { ...req.body };
    delete updateData.college_id; // prevent changing college_id this way

    await docRef.update(updateData);
    const updated = await docRef.get();
    res.json(updated.data());
  } catch (error) {
    res.status(500).json({ message: 'Server error updating faculty' });
  }
});

// DELETE faculty (Soft delete)
router.delete('/:id', collegeAdminOnly, async (req, res) => {
  try {
    const targetCollegeId = req.user.role === 'super_admin' ? req.query.college_id : req.user.college_id;
    const docRef = db.collection('faculty').doc(req.params.id);
    const doc = await docRef.get();
    
    if (!doc.exists) return res.status(404).json({ message: 'Faculty not found' });
    if (doc.data().college_id !== targetCollegeId && req.user.role !== 'super_admin') {
       return res.status(403).json({ message: 'Cannot delete faculty from another college.' });
    }

    await docRef.update({ status: 'suspended' });
    res.json({ message: 'Faculty suspended successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting faculty' });
  }
});

module.exports = router;
