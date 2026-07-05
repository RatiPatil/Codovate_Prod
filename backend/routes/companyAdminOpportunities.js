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
    
    let query = db.collection('opportunities').where('company_id', '==', targetCompanyId);
    if (req.query.type) {
      const formattedType = req.query.type === 'job' ? 'Job' : 'Internship';
      query = query.where('type', '==', formattedType);
    }

    const snapshot = await query.get();
    const ops = [];
    snapshot.forEach(doc => {
      ops.push({ id: doc.id, ...doc.data() });
    });
    res.json(ops);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching opportunities' });
  }
});

router.post('/', companyAdminOnly, [
  body('title').notEmpty().withMessage('Title is required'),
  body('type').isIn(['job', 'internship']).withMessage('Valid type required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const targetCompanyId = req.user.role === 'super_admin' ? req.body.company_id : req.user.company_id;
    const data = req.body;
    
    // Fetch company name
    const compDoc = await db.collection('companies').doc(targetCompanyId).get();
    const compName = compDoc.exists ? compDoc.data().name : 'Unknown Company';
    
    // Format type to Title Case so frontend filters match it
    const formattedType = data.type === 'job' ? 'Job' : 'Internship';
    
    const newDocRef = db.collection('opportunities').doc();
    const newOp = {
      id: newDocRef.id,
      title: data.title,
      type: formattedType,
      location: data.location || '',
      description: data.description || '',
      salary: data.salary || '',
      stipend: data.stipend || '',
      link: data.link || '',
      company_id: targetCompanyId,
      company: compName, // Add company name for frontend display
      status: data.status || 'open',
      is_active: true, // Make sure it's active so it shows in feed
      created_at: new Date()
    };
    await newDocRef.set(newOp);
    res.status(201).json(newOp);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating opportunity' });
  }
});

router.put('/:id', companyAdminOnly, async (req, res) => {
  try {
    const targetCompanyId = req.user.role === 'super_admin' ? req.body.company_id : req.user.company_id;
    const docRef = db.collection('opportunities').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Not found' });
    if (doc.data().company_id !== targetCompanyId && req.user.role !== 'super_admin') return res.status(403).json({ message: 'Forbidden' });
    
    const updateData = { ...req.body };
    delete updateData.company_id;
    if (updateData.type) {
      updateData.type = updateData.type === 'job' ? 'Job' : 'Internship';
    }
    await docRef.update(updateData);
    res.json((await docRef.get()).data());
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', companyAdminOnly, async (req, res) => {
  try {
    const targetCompanyId = req.user.role === 'super_admin' ? req.query.company_id : req.user.company_id;
    const docRef = db.collection('opportunities').doc(req.params.id);
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
