const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { body, validationResult } = require('express-validator');

const superAdminOnly = (req, res, next) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Super Admin access required.' });
  }
  next();
};

// GET all companies
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('companies').get();
    const companies = [];
    snapshot.forEach(doc => {
      companies.push({ id: doc.id, ...doc.data() });
    });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST new company
router.post('/', superAdminOnly, [
  body('name').notEmpty().withMessage('Name is required'),
  body('industry').notEmpty().withMessage('Industry is required'),
  body('status').isIn(['active', 'pending', 'suspended']).withMessage('Invalid status')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, industry, status, admin_email } = req.body;
    const newDocRef = db.collection('companies').doc();
    const newCompany = {
      id: newDocRef.id,
      name,
      industry,
      status,
      admin_email: admin_email || '',
      created_at: new Date()
    };
    await newDocRef.set(newCompany);
    res.status(201).json(newCompany);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update company
router.put('/:id', superAdminOnly, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('industry').optional().notEmpty().withMessage('Industry cannot be empty'),
  body('status').optional().isIn(['active', 'pending', 'suspended']).withMessage('Invalid status')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const docRef = db.collection('companies').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Company not found' });

    const updateData = { ...req.body };
    await docRef.update(updateData);
    
    const updated = await docRef.get();
    res.json(updated.data());
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE (Soft delete) company
router.delete('/:id', superAdminOnly, async (req, res) => {
  try {
    const docRef = db.collection('companies').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Company not found' });

    await docRef.update({ status: 'suspended' });
    res.json({ message: 'Company deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
