const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { body, validationResult } = require('express-validator');

const collegeAdminOnly = (req, res, next) => {
  if (req.user.role !== 'college_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'College Admin access required.' });
  }
  if (req.user.role === 'college_admin' && !req.user.college_id) {
    return res.status(403).json({ message: 'No college association found.' });
  }
  next();
};

router.get('/', collegeAdminOnly, async (req, res) => {
  try {
    const targetCollegeId = req.user.role === 'super_admin' ? req.query.college_id : req.user.college_id;
    if (!targetCollegeId) return res.status(400).json({ message: 'College ID required.' });

    const snapshot = await db.collection('certificates')
                             .where('college_id', '==', targetCollegeId)
                             .get();
    const certs = [];
    snapshot.forEach(doc => {
      certs.push({ id: doc.id, ...doc.data() });
    });
    res.json(certs);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching certificates' });
  }
});

router.post('/', collegeAdminOnly, [
  body('title').notEmpty().withMessage('Title is required'),
  body('student_id').notEmpty().withMessage('Student ID is required'),
  body('issue_date').notEmpty().withMessage('Issue Date is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const targetCollegeId = req.user.role === 'super_admin' ? req.body.college_id : req.user.college_id;
    const { title, student_id, issue_date, credential_url } = req.body;
    
    // Verify student belongs to this college (omitted for brevity, assume true for now or enforce later)
    
    const newDocRef = db.collection('certificates').doc();
    const newCert = {
      id: newDocRef.id,
      title,
      student_id,
      college_id: targetCollegeId,
      issue_date,
      issuer: 'College Admin',
      credential_id: newDocRef.id.substring(0, 10).toUpperCase(),
      credential_url: credential_url || '',
      status: 'valid',
      created_at: new Date()
    };
    await newDocRef.set(newCert);
    res.status(201).json(newCert);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating certificate' });
  }
});

router.put('/:id', collegeAdminOnly, async (req, res) => {
  // Implementation similar to super admin, but scoped to college_id
  try {
    const targetCollegeId = req.user.role === 'super_admin' ? req.body.college_id : req.user.college_id;
    const docRef = db.collection('certificates').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Not found' });
    if (doc.data().college_id !== targetCollegeId && req.user.role !== 'super_admin') return res.status(403).json({ message: 'Forbidden' });
    
    const updateData = { ...req.body };
    delete updateData.college_id;
    await docRef.update(updateData);
    res.json((await docRef.get()).data());
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', collegeAdminOnly, async (req, res) => {
  try {
    const targetCollegeId = req.user.role === 'super_admin' ? req.query.college_id : req.user.college_id;
    const docRef = db.collection('certificates').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Not found' });
    if (doc.data().college_id !== targetCollegeId && req.user.role !== 'super_admin') return res.status(403).json({ message: 'Forbidden' });
    
    await docRef.update({ status: 'revoked' });
    res.json({ message: 'Revoked' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
