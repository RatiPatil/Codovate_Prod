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

// GET all global notifications
router.get('/', superAdminOnly, async (req, res) => {
  try {
    const snapshot = await db.collection('notifications')
                             .where('is_global', '==', true)
                             .orderBy('created_at', 'desc')
                             .get();
    const notifications = [];
    snapshot.forEach(doc => {
      notifications.push({ id: doc.id, ...doc.data() });
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// POST new global notification
router.post('/', superAdminOnly, [
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').isIn(['info', 'warning', 'success', 'error']).withMessage('Invalid type'),
  body('target_role').optional().isIn(['all', 'student', 'mentor', 'college_admin', 'company_admin'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, message, type, target_role } = req.body;
    const newDocRef = db.collection('notifications').doc();
    const newNotification = {
      id: newDocRef.id,
      title,
      message,
      type,
      target_role: target_role || 'all',
      is_global: true, // Special flag indicating it's an admin announcement
      created_at: new Date(),
      read: false
    };
    await newDocRef.set(newNotification);
    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating notification' });
  }
});

// PUT update global notification
router.put('/:id', superAdminOnly, [
  body('title').optional().notEmpty(),
  body('message').optional().notEmpty(),
  body('type').optional().isIn(['info', 'warning', 'success', 'error']),
  body('target_role').optional().isIn(['all', 'student', 'mentor', 'college_admin', 'company_admin'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const docRef = db.collection('notifications').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Notification not found' });

    await docRef.update(req.body);
    const updated = await docRef.get();
    res.json(updated.data());
  } catch (error) {
    res.status(500).json({ message: 'Server error updating notification' });
  }
});

// DELETE global notification
router.delete('/:id', superAdminOnly, async (req, res) => {
  try {
    const docRef = db.collection('notifications').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Notification not found' });

    await docRef.delete();
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting notification' });
  }
});

module.exports = router;
