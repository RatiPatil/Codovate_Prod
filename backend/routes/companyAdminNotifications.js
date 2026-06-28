const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { body, validationResult } = require('express-validator');

const companyAdminOnly = (req, res, next) => {
  if (req.user.role !== 'company_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Company Admin access required.' });
  }
  if (req.user.role === 'company_admin' && !req.user.company_id) {
    return res.status(403).json({ message: 'No company association found.' });
  }
  next();
};

router.get('/', companyAdminOnly, async (req, res) => {
  try {
    const targetCompanyId = req.user.role === 'super_admin' ? req.query.company_id : req.user.company_id;
    if (!targetCompanyId) return res.status(400).json({ message: 'Company ID required.' });
    
    const snapshot = await db.collection('notifications').where('company_id', '==', targetCompanyId).get();
    const items = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', companyAdminOnly, [
  body('title').notEmpty(),
  body('message').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const targetCompanyId = req.user.role === 'super_admin' ? req.body.company_id : req.user.company_id;
    
    const newDocRef = db.collection('notifications').doc();
    const newItem = {
      id: newDocRef.id,
      ...req.body,
      company_id: targetCompanyId,
      created_at: new Date()
    };
    await newDocRef.set(newItem);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', companyAdminOnly, async (req, res) => {
  try {
    const targetCompanyId = req.user.role === 'super_admin' ? req.body.company_id : req.user.company_id;
    const docRef = db.collection('notifications').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Not found' });
    if (doc.data().company_id !== targetCompanyId && req.user.role !== 'super_admin') return res.status(403).json({ message: 'Forbidden' });
    
    const updateData = { ...req.body };
    delete updateData.company_id;
    await docRef.update(updateData);
    res.json((await docRef.get()).data());
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', companyAdminOnly, async (req, res) => {
  try {
    const targetCompanyId = req.user.role === 'super_admin' ? req.query.company_id : req.user.company_id;
    const docRef = db.collection('notifications').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Not found' });
    if (doc.data().company_id !== targetCompanyId && req.user.role !== 'super_admin') return res.status(403).json({ message: 'Forbidden' });
    
    await docRef.delete();
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
