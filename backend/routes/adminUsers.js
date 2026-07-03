const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const { body, validationResult, checkExact, matchedData } = require('express-validator');

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
    const usersSnapshot = await db.collection('users').get();
    const studentsSnapshot = await db.collection('students').get();
    const users = [];
    
    usersSnapshot.forEach(doc => {
      const u = doc.data();
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

    studentsSnapshot.forEach(doc => {
      const s = doc.data();
      const sp = s.profile_data || {};
      users.push({
        id: doc.id,
        name: sp.name || s.name || 'Anonymous',
        email: s.email,
        role: s.role || 'student',
        status: s.status || (s.is_active ? 'active' : 'inactive'),
        college_id: s.college_id,
        created_at: s.created_at
      });
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST new user
router.post('/', superAdminOnly, checkExact([
  body('name').trim().notEmpty().withMessage('Name is required').escape(),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('role').isIn(['student', 'mentor', 'college_admin', 'company_admin', 'admin', 'super_admin']).withMessage('Invalid role'),
  body('status').isIn(['active', 'pending', 'banned', 'suspended', 'inactive']).withMessage('Invalid status'),
  body('college_id').optional({ nullable: true }).trim().escape()
]), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const data = matchedData(req, { includeOptionals: true });
    const { name, email, role, status, college_id } = data;
    
    const targetCollection = role === 'student' ? 'students' : 'users';
    
    // Check if user already exists
    const existing = await db.collection(targetCollection).where('email', '==', email).get();
    if (!existing.empty) return res.status(400).json({ message: 'Email already exists' });

    const newUserRef = db.collection(targetCollection).doc();
    let newUser = {
      id: newUserRef.id,
      email,
      role,
      status,
      is_active: status === 'active',
      college_id: college_id || null,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (role === 'student') {
      newUser.profile_data = { name };
    } else {
      newUser.name = name;
    }

    await newUserRef.set(newUser);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("User POST error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update user
router.put('/:id', superAdminOnly, checkExact([
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').escape(),
  body('email').optional().trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('role').optional().isIn(['student', 'mentor', 'college_admin', 'company_admin', 'admin', 'super_admin']).withMessage('Invalid role'),
  body('status').optional().isIn(['active', 'pending', 'banned', 'suspended', 'inactive']).withMessage('Invalid status'),
  body('college_id').optional({ nullable: true }).trim().escape()
]), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    let userRef = db.collection('users').doc(req.params.id);
    let doc = await userRef.get();
    if (!doc.exists) {
      userRef = db.collection('students').doc(req.params.id);
      doc = await userRef.get();
      if (!doc.exists) return res.status(404).json({ message: 'User not found' });
    }

    const updateData = matchedData(req, { includeOptionals: true });
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    if (updateData.status) {
      updateData.is_active = updateData.status === 'active';
    }

    updateData.updated_at = admin.firestore.FieldValue.serverTimestamp();

    await userRef.update(updateData);
    const updated = await userRef.get();
    res.json(updated.data());
  } catch (error) {
    console.error("User PUT error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE (Soft delete) user
router.delete('/:id', superAdminOnly, async (req, res) => {
  try {
    let userRef = db.collection('users').doc(req.params.id);
    let doc = await userRef.get();
    if (!doc.exists) {
      userRef = db.collection('students').doc(req.params.id);
      doc = await userRef.get();
      if (!doc.exists) return res.status(404).json({ message: 'User not found' });
    }

    await userRef.update({ 
      status: 'inactive', 
      is_active: false,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      deleted_at: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error("User DELETE error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT status (used by the existing table)
router.put('/:id/status', superAdminOnly, checkExact([
  body('status').isIn(['active', 'pending', 'banned', 'suspended', 'inactive']).withMessage('Invalid status')
]), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    let userRef = db.collection('users').doc(req.params.id);
    let doc = await userRef.get();
    if (!doc.exists) {
      userRef = db.collection('students').doc(req.params.id);
      doc = await userRef.get();
      if (!doc.exists) return res.status(404).json({ message: 'User not found' });
    }
    const { status } = matchedData(req);
    await userRef.update({ 
      status, 
      is_active: status === 'active',
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ message: 'Status updated' });
  } catch (error) {
    console.error("User STATUS error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
