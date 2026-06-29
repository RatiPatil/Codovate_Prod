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

const SETTINGS_DOC_ID = 'global_config';

// GET platform settings
router.get('/', superAdminOnly, async (req, res) => {
  try {
    const docRef = db.collection('platform_settings').doc(SETTINGS_DOC_ID);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      // Return default config if it doesn't exist
      const defaultSettings = {
        maintenance_mode: false,
        allow_registrations: true,
        contact_email: 'support@codovate.in',
        default_theme: 'dark'
      };
      await docRef.set(defaultSettings);
      return res.json(defaultSettings);
    }

    res.json(doc.data());
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching settings' });
  }
});

// PUT update platform settings
router.put('/', superAdminOnly, [
  body('maintenance_mode').isBoolean(),
  body('allow_registrations').isBoolean(),
  body('contact_email').isEmail().withMessage('Valid contact email required'),
  body('default_theme').isIn(['dark', 'light'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const docRef = db.collection('platform_settings').doc(SETTINGS_DOC_ID);
    await docRef.set(req.body, { merge: true });
    
    const updated = await docRef.get();
    res.json(updated.data());
  } catch (error) {
    res.status(500).json({ message: 'Server error updating settings' });
  }
});

module.exports = router;
