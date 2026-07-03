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
router.post('/', superAdminOnly, checkExact([
  body('name').trim().notEmpty().withMessage('Name is required').escape(),
  body('domain').trim().notEmpty().withMessage('Domain is required'),
  body('admin_email').optional().trim().isEmail().withMessage('Invalid admin email').normalizeEmail(),
  body('status').isIn(['active', 'pending', 'suspended']).withMessage('Invalid status')
]), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const data = matchedData(req, { includeOptionals: true });
    const { name, domain, status, admin_email } = data;
    const newDocRef = db.collection('colleges').doc();
    const newCollege = {
      id: newDocRef.id,
      name,
      domain,
      status,
      admin_email: admin_email || '',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };
    await newDocRef.set(newCollege);
    res.status(201).json(newCollege);
  } catch (error) {
    console.error("College POST error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update college
router.put('/:id', superAdminOnly, checkExact([
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').escape(),
  body('domain').optional().trim().notEmpty().withMessage('Domain cannot be empty'),
  body('admin_email').optional().trim().isEmail().withMessage('Invalid admin email').normalizeEmail(),
  body('status').optional().isIn(['active', 'pending', 'suspended']).withMessage('Invalid status')
]), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const docRef = db.collection('colleges').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'College not found' });

    const updateData = matchedData(req, { includeOptionals: true });
    
    // Require at least one field to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    updateData.updated_at = admin.firestore.FieldValue.serverTimestamp();
    await docRef.update(updateData);
    
    const updated = await docRef.get();
    res.json(updated.data());
  } catch (error) {
    console.error("College PUT error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE (Soft delete) college
router.delete('/:id', superAdminOnly, async (req, res) => {
  try {
    const docRef = db.collection('colleges').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'College not found' });

    await docRef.update({ 
      status: 'suspended',
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      deleted_at: admin.firestore.FieldValue.serverTimestamp() 
    });
    res.json({ message: 'College deactivated successfully' });
  } catch (error) {
    console.error("College DELETE error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
