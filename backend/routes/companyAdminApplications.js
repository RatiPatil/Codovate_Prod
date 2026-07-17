const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

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
    
    // In our simplified model, we might just store company_id on applications directly
    // Or we fetch opportunities for this company, then applications for those opps
    
    let query = db.collection('applications');
    
    // Assuming application docs have company_id OR we need to do a join.
    // For Codovate, let's assume applications have company_id (standard practice for fast reads)
    query = query.where('company_id', '==', targetCompanyId);

    const snapshot = await query.get();
    const apps = [];
    for (const doc of snapshot.docs) {
      const app = doc.data();
      app.id = doc.id;
      
      const studentDoc = await db.collection("profiles").doc(app.user_id).get();
      const s = studentDoc.exists ? studentDoc.data() : {};
      const userDoc = await db.collection("users").doc(app.user_id).get();
      const u = userDoc.exists ? userDoc.data() : {};
      
      const oppDoc = await db.collection("opportunities").doc(app.opportunity_id).get();
      const o = oppDoc.exists ? oppDoc.data() : {};
      
      apps.push({
        ...app,
        student_name: s.personalInfo?.name || u.name || "Unknown",
        student_email: u.email || "Unknown",
        opportunity_title: o.title || "Unknown"
      });
    }
    res.json(apps);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching applications' });
  }
});

router.put('/:id/status', companyAdminOnly, async (req, res) => {
  try {
    const targetCompanyId = req.user.role === 'super_admin' ? req.body.company_id : req.user.company_id;
    const { status } = req.body; // e.g. 'interview', 'rejected', 'selected'

    const docRef = db.collection('applications').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Not found' });
    if (doc.data().company_id !== targetCompanyId && req.user.role !== 'super_admin') return res.status(403).json({ message: 'Forbidden' });
    
    await docRef.update({ status, updated_at: new Date() });
    res.json((await docRef.get()).data());
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', companyAdminOnly, async (req, res) => {
  try {
    const targetCompanyId = req.user.role === 'super_admin' ? req.query.company_id : req.user.company_id;
    const docRef = db.collection('applications').doc(req.params.id);
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
