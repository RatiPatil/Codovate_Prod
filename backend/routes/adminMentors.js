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

// GET all mentors
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('mentors').get();
    const mentors = await Promise.all(snapshot.docs.map(async (doc) => {
      const m = doc.data();
      const userDoc = m.user_id ? await db.collection('users').doc(m.user_id).get() : null;
      return {
        id: doc.id,
        ...m,
        name: (userDoc && userDoc.exists) ? userDoc.data().name : (m.name || 'Unknown'),
        email: (userDoc && userDoc.exists) ? userDoc.data().email : (m.email || 'Unknown')
      };
    }));
    res.json(mentors);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST new mentor
router.post('/', superAdminOnly, [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('hourly_rate').isNumeric().withMessage('Hourly rate must be a number'),
  body('bio').optional().isString(),
  body('status').isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { name, email, hourly_rate, bio, expertise, status } = req.body;
    
    // Look up the user by email to link accounts if they exist
    const usersSnap = await db.collection('users').where('email', '==', email.toLowerCase()).get();
    
    let user_id = null;
    if (!usersSnap.empty) {
      user_id = usersSnap.docs[0].id;
      // Check if mentor already exists
      const existingSnap = await db.collection('mentors').where('user_id', '==', user_id).get();
      if (!existingSnap.empty) {
        return res.status(400).json({ message: 'This user is already a mentor.' });
      }
    }

    const newDocRef = db.collection('mentors').doc();
    const newMentor = {
      id: newDocRef.id,
      user_id,
      name,
      email: email.toLowerCase(),
      hourly_rate: Number(hourly_rate),
      bio: bio || '',
      expertise: expertise || [],
      status,
      is_active: status === 'active',
      created_at: new Date()
    };
    await newDocRef.set(newMentor);
    res.status(201).json(newMentor);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update mentor
router.put('/:id', superAdminOnly, [
  body('hourly_rate').optional().isNumeric(),
  body('status').optional().isIn(['active', 'inactive', 'suspended'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const docRef = db.collection('mentors').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Mentor not found' });

    const updateData = { ...req.body };
    delete updateData.email;
    delete updateData.name;
    
    if (updateData.status) {
      updateData.is_active = updateData.status === 'active';
    }
    
    await docRef.update(updateData);
    const updated = await docRef.get();
    res.json(updated.data());
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE (Soft delete) mentor
router.delete('/:id', superAdminOnly, async (req, res) => {
  try {
    const docRef = db.collection('mentors').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Mentor not found' });

    await docRef.update({ status: 'suspended', is_active: false });
    res.json({ message: 'Mentor deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
