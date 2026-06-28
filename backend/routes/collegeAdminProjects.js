const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

const collegeAdminOnly = (req, res, next) => {
  if (req.user.role !== 'college_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'College Admin access required.' });
  }
  if (req.user.role === 'college_admin' && !req.user.college_id) {
    return res.status(403).json({ message: 'No college association found.' });
  }
  next();
};

// GET projects belonging to students from this college
router.get('/', collegeAdminOnly, async (req, res) => {
  try {
    const targetCollegeId = req.user.role === 'super_admin' ? req.query.college_id : req.user.college_id;
    if (!targetCollegeId) return res.status(400).json({ message: 'College ID required.' });

    // Note: In a real NoSQL DB, we might need to store college_id on the project doc itself for efficient querying.
    // For now, if we assume project has college_id:
    const snapshot = await db.collection('projects')
                             .where('college_id', '==', targetCollegeId)
                             .get();
    
    const projects = [];
    snapshot.forEach(doc => {
      projects.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching projects' });
  }
});

module.exports = router;
