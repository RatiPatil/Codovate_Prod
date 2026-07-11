const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

const superAdminOnly = (req, res, next) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Super Admin access required.' });
  }
  next();
};

// GET all mentors
router.get('/', superAdminOnly, async (req, res) => {
  try {
    const snapshot = await db.collection('mentors').get();
    const mentors = snapshot.docs.map(doc => {
      const data = doc.data();
      delete data.password_hash; // never send password hash to client
      return { id: doc.id, ...data };
    });
    res.json(mentors);
  } catch (error) {
    console.error("Fetch mentors error:", error);
    res.status(500).json({ message: 'Server error fetching mentors.' });
  }
});

// POST new mentor
router.post('/', superAdminOnly, [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('mobile').optional().isString(),
  body('designation').optional().isString(),
  body('company').optional().isString(),
  body('experience').optional().isNumeric(),
  body('skills').optional().isArray(),
  body('specialization').optional().isString(),
  body('bio').optional().isString(),
  body('availability').optional().isString(),
  body('linkedin').optional().isURL(),
  body('github').optional().isURL(),
  body('portfolio').optional().isURL(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const data = req.body;
    const email = data.email.toLowerCase();
    
    // Check if email already in use across users or mentors
    const mentorSnap = await db.collection('mentors').where('email', '==', email).get();
    if (!mentorSnap.empty) {
      return res.status(400).json({ message: 'Email already exists in mentors.' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(data.password, 10);

    const newDocRef = db.collection('mentors').doc();
    const newMentor = {
      id: newDocRef.id,
      name: data.name,
      email: email,
      mobile: data.mobile || '',
      password_hash: password_hash,
      profile_photo: data.profile_photo || '',
      designation: data.designation || '',
      company: data.company || '',
      experience: Number(data.experience) || 0,
      skills: data.skills || [],
      specialization: data.specialization || '',
      bio: data.bio || '',
      availability: data.availability || '',
      social_links: {
        linkedin: data.linkedin || '',
        github: data.github || '',
        portfolio: data.portfolio || ''
      },
      status: 'active',
      is_active: true,
      created_at: new Date(),
      last_login_at: null,
      stats: {
        total_students: 0,
        pending_questions: 0,
        answered_questions: 0,
        total_chats: 0,
        sessions_completed: 0
      }
    };

    await newDocRef.set(newMentor);
    
    const responseData = { ...newMentor };
    delete responseData.password_hash;
    
    res.status(201).json(responseData);
  } catch (error) {
    console.error("Create mentor error:", error);
    res.status(500).json({ message: 'Server error creating mentor.' });
  }
});

// PUT update mentor
router.put('/:id', superAdminOnly, async (req, res) => {
  try {
    const docRef = db.collection('mentors').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Mentor not found' });

    const updateData = { ...req.body };
    delete updateData.email; // Do not allow email update easily
    delete updateData.password; // Handled separately if needed
    delete updateData.password_hash;

    // Status overrides
    if (updateData.status) {
      updateData.is_active = updateData.status === 'active';
    }

    await docRef.update(updateData);
    res.json({ message: 'Mentor updated successfully', id: doc.id });
  } catch (error) {
    console.error("Update mentor error:", error);
    res.status(500).json({ message: 'Server error updating mentor' });
  }
});

// DELETE mentor
router.delete('/:id', superAdminOnly, async (req, res) => {
  try {
    const docRef = db.collection('mentors').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Mentor not found' });

    await docRef.delete();
    res.json({ message: 'Mentor deleted successfully' });
  } catch (error) {
    console.error("Delete mentor error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// SUSPEND mentor
router.post('/:id/suspend', superAdminOnly, async (req, res) => {
  try {
    const docRef = db.collection('mentors').doc(req.params.id);
    await docRef.update({ status: 'suspended', is_active: false });
    res.json({ message: 'Mentor suspended successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ACTIVATE / VERIFY mentor
router.post('/:id/activate', superAdminOnly, async (req, res) => {
  try {
    const docRef = db.collection('mentors').doc(req.params.id);
    await docRef.update({ status: 'active', is_active: true });
    res.json({ message: 'Mentor activated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// RESET PASSWORD
router.post('/:id/reset-password', superAdminOnly, [
  body('new_password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const newHash = await bcrypt.hash(req.body.new_password, 10);
    const docRef = db.collection('mentors').doc(req.params.id);
    await docRef.update({ password_hash: newHash });
    res.json({ message: 'Mentor password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
