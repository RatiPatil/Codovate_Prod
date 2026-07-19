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
    
    let query = db.collection('applications').where('company_id', '==', targetCompanyId);
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
      
      // Phase 6: Calculate match score based on skills overlap
      let match_score = 0;
      if (o.skills && s.skills) {
        const requiredSkills = o.skills.map(skill => skill.toLowerCase());
        const userSkills = s.skills.map(skill => skill.toLowerCase());
        const matchCount = requiredSkills.filter(skill => userSkills.includes(skill)).length;
        match_score = requiredSkills.length > 0 ? Math.round((matchCount / requiredSkills.length) * 100) : 100;
      }
      
      apps.push({
        ...app,
        student_name: s.personalInfo?.name || u.name || "Unknown",
        student_email: u.email || "Unknown",
        opportunity_title: o.title || "Unknown",
        match_score: match_score
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
    const { status, interviewDetails } = req.body; 

    const docRef = db.collection('applications').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Not found' });
    if (doc.data().company_id !== targetCompanyId && req.user.role !== 'super_admin') return res.status(403).json({ message: 'Forbidden' });
    
    const appData = doc.data();
    await docRef.update({ status, updated_at: new Date() });
    
    // Phase 6: Update application status hooks & Notify student
    const notificationRef = db.collection('notifications').doc();
    let message = `Your application status has been updated to ${status}.`;
    let type = 'application_update';
    
    if (status === 'shortlisted') {
      message = `Congratulations! You have been shortlisted for an opportunity.`;
      type = 'shortlisted';
    } else if (status === 'interview') {
      message = `You have an interview scheduled! Check your dashboard.`;
      type = 'interview_scheduled';
      
      if (interviewDetails) {
        // Create an interview document
        await db.collection('interviews').add({
          application_id: req.params.id,
          student_id: appData.user_id,
          company_id: targetCompanyId,
          opportunity_id: appData.opportunity_id,
          date: interviewDetails.date,
          type: interviewDetails.type || 'technical',
          link: interviewDetails.link || '',
          status: 'scheduled',
          created_at: new Date()
        });
      }
    }
    
    await notificationRef.set({
      user_id: appData.user_id,
      title: 'Application Update',
      message: message,
      type: type,
      read: false,
      created_at: new Date()
    });
    
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
