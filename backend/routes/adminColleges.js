const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { body, validationResult } = require('express-validator');

// Middleware to ensure super_admin
const superAdminOnly = (req, res, next) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Super Admin access required.' });
  }
  next();
};

// GET all colleges
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('colleges').get();
    const colleges = [];
    snapshot.forEach(doc => {
      colleges.push({ id: doc.id, ...doc.data() });
    });
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST new college
router.post('/', superAdminOnly, [
  body('name').notEmpty().withMessage('Name is required'),
  body('domain').notEmpty().withMessage('Domain is required'),
  body('status').isIn(['active', 'pending', 'suspended']).withMessage('Invalid status')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, domain, status, admin_email } = req.body;
    const newDocRef = db.collection('colleges').doc();
    const newCollege = {
      id: newDocRef.id,
      name,
      domain,
      status,
      admin_email: admin_email || '',
      created_at: new Date()
    };
    await newDocRef.set(newCollege);
    res.status(201).json(newCollege);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update college
router.put('/:id', superAdminOnly, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('domain').optional().notEmpty().withMessage('Domain cannot be empty'),
  body('status').optional().isIn(['active', 'pending', 'suspended']).withMessage('Invalid status')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const docRef = db.collection('colleges').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'College not found' });

    const updateData = { ...req.body };
    await docRef.update(updateData);
    
    const updated = await docRef.get();
    res.json(updated.data());
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE (Soft delete) college
router.delete('/:id', superAdminOnly, async (req, res) => {
  try {
    const docRef = db.collection('colleges').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'College not found' });

    await docRef.update({ status: 'suspended' });
    res.json({ message: 'College deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
