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

// GET all users
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = [];
    snapshot.forEach(doc => {
      const u = doc.data();
      // Only return necessary fields
      users.push({
        id: doc.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status || (u.is_active ? 'active' : 'inactive'),
        college_id: u.college_id,
        created_at: u.created_at
      });
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST new user
router.post('/', superAdminOnly, [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn(['student', 'mentor', 'college_admin', 'company_admin', 'admin', 'super_admin']).withMessage('Invalid role'),
  body('status').isIn(['active', 'pending', 'banned', 'suspended', 'inactive']).withMessage('Invalid status')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, email, role, status, college_id } = req.body;
    
    // Check if user already exists
    const existing = await db.collection('users').where('email', '==', email.toLowerCase()).get();
    if (!existing.empty) return res.status(400).json({ message: 'Email already exists' });

    const newUserRef = db.collection('users').doc();
    const newUser = {
      id: newUserRef.id,
      name,
      email: email.toLowerCase(),
      role,
      status,
      is_active: status === 'active',
      college_id: college_id || null,
      created_at: new Date()
    };

    await newUserRef.set(newUser);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update user
router.put('/:id', superAdminOnly, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['student', 'mentor', 'college_admin', 'company_admin', 'admin', 'super_admin']).withMessage('Invalid role'),
  body('status').optional().isIn(['active', 'pending', 'banned', 'suspended', 'inactive']).withMessage('Invalid status')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const userRef = db.collection('users').doc(req.params.id);
    const doc = await userRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'User not found' });

    const updateData = { ...req.body };
    if (updateData.status) {
      updateData.is_active = updateData.status === 'active';
    }

    await userRef.update(updateData);
    const updated = await userRef.get();
    res.json(updated.data());
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE (Soft delete) user
router.delete('/:id', superAdminOnly, async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.params.id);
    const doc = await userRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'User not found' });

    await userRef.update({ status: 'inactive', is_active: false });
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT status (used by the existing table)
router.put('/:id/status', superAdminOnly, async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.params.id);
    const { status } = req.body;
    await userRef.update({ status, is_active: status === 'active' });
    res.json({ message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
