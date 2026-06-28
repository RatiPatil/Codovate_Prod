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

// GET all opportunities (including inactive)
router.get('/', superAdminOnly, async (req, res) => {
  try {
    const snapshot = await db.collection('opportunities').get();
    const opps = [];
    snapshot.forEach(doc => {
      opps.push({ id: doc.id, ...doc.data() });
    });
    res.json(opps);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// We can just rely on the existing /api/opportunities POST/PUT/DELETE for the rest,
// but since the user requested full CRUD, we'll implement it here for completeness and safety.

// POST new opportunity
router.post('/', superAdminOnly, [
  body('title').notEmpty().withMessage('Title is required'),
  body('type').isIn(['Internship', 'Hackathon', 'Competition', 'Job']).withMessage('Invalid type'),
  body('company').notEmpty().withMessage('Company is required'),
  body('status').isIn(['active', 'inactive']).withMessage('Invalid status')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, type, company, description, status, mode, location, deadline } = req.body;
    const newDocRef = db.collection('opportunities').doc();
    const newOpp = {
      id: newDocRef.id,
      title,
      type,
      company,
      description: description || '',
      mode: mode || '',
      location: location || '',
      deadline: deadline || null,
      is_active: status === 'active',
      created_at: new Date()
    };
    await newDocRef.set(newOpp);
    res.status(201).json(newOpp);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update opportunity
router.put('/:id', superAdminOnly, [
  body('title').optional().notEmpty(),
  body('type').optional().isIn(['Internship', 'Hackathon', 'Competition', 'Job']),
  body('status').optional().isIn(['active', 'inactive'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const docRef = db.collection('opportunities').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Opportunity not found' });

    const updateData = { ...req.body };
    if (updateData.status) {
      updateData.is_active = updateData.status === 'active';
      delete updateData.status;
    }
    
    await docRef.update(updateData);
    const updated = await docRef.get();
    res.json(updated.data());
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE (Soft delete) opportunity
router.delete('/:id', superAdminOnly, async (req, res) => {
  try {
    const docRef = db.collection('opportunities').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Opportunity not found' });

    await docRef.update({ is_active: false });
    res.json({ message: 'Opportunity deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
