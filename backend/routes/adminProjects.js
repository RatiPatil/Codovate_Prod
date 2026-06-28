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

// GET all projects
router.get('/', superAdminOnly, async (req, res) => {
  try {
    const snapshot = await db.collection('projects').get();
    const projects = [];
    snapshot.forEach(doc => {
      projects.push({ id: doc.id, ...doc.data() });
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST new project
router.post('/', superAdminOnly, [
  body('title').notEmpty().withMessage('Title is required'),
  body('author_id').notEmpty().withMessage('Author ID is required'),
  body('status').isIn(['active', 'suspended']).withMessage('Invalid status')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, description, author_id, tags, github_url, live_url, status } = req.body;
    const newDocRef = db.collection('projects').doc();
    const newProject = {
      id: newDocRef.id,
      title,
      description: description || '',
      author_id,
      tags: typeof tags === 'string' ? tags.split(',').map(t=>t.trim()) : (tags || []),
      github_url: github_url || '',
      live_url: live_url || '',
      status,
      created_at: new Date()
    };
    await newDocRef.set(newProject);
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update project
router.put('/:id', superAdminOnly, [
  body('title').optional().notEmpty(),
  body('status').optional().isIn(['active', 'suspended'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const docRef = db.collection('projects').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Project not found' });

    const updateData = { ...req.body };
    if (typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(t=>t.trim());
    }

    await docRef.update(updateData);
    const updated = await docRef.get();
    res.json(updated.data());
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE (Soft delete) project
router.delete('/:id', superAdminOnly, async (req, res) => {
  try {
    const docRef = db.collection('projects').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Project not found' });

    await docRef.update({ status: 'suspended' });
    res.json({ message: 'Project deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
