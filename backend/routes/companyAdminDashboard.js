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
    const recruiterId = req.user.id;
    if (!targetCompanyId) return res.status(400).json({ message: 'Company ID required.' });
    
    // Total Candidates (all students on platform)
    const totalCandidatesSnap = await db.collection('students').count().get();
    const totalCandidates = totalCandidatesSnap.data().count;

    // Saved Candidates
    const savedCandidatesSnap = await db.collection('shortlists').where('recruiter_id', '==', recruiterId).count().get();
    const savedCandidates = savedCandidatesSnap.data().count;

    // Active Jobs & Internships
    const opportunitiesSnap = await db.collection('opportunities').where('company_id', '==', targetCompanyId).get();
    let activeJobs = 0;
    let activeInternships = 0;
    opportunitiesSnap.forEach(doc => {
      const data = doc.data();
      if (data.type === 'Job') activeJobs++;
      if (data.type === 'Internship') activeInternships++;
    });

    // Total Applications, Shortlisted, Selected
    const applicationsSnap = await db.collection('applications').where('company_id', '==', targetCompanyId).get();
    let totalApplications = 0;
    let shortlistedCandidates = 0;
    let selectedCandidates = 0;
    
    applicationsSnap.forEach(doc => {
      totalApplications++;
      const data = doc.data();
      if (data.status === 'shortlisted') shortlistedCandidates++;
      if (data.status === 'selected') selectedCandidates++;
    });

    // Interviews Scheduled
    const interviewsSnap = await db.collection('interviews')
      .where('company_id', '==', targetCompanyId)
      .where('status', '==', 'scheduled')
      .count().get();
    const interviewsScheduled = interviewsSnap.data().count;

    res.json({
      activeJobs,
      activeInternships,
      totalApplications,
      shortlistedCandidates,
      selectedCandidates,
      totalCandidates,
      savedCandidates,
      interviewsScheduled
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: 'Server error fetching dashboard metrics' });
  }
});

module.exports = router;
