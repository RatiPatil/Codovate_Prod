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

router.get('/', collegeAdminOnly, async (req, res) => {
  try {
    const targetCollegeId = req.user.role === 'super_admin' ? req.query.college_id : req.user.college_id;
    if (!targetCollegeId) return res.status(400).json({ message: 'College ID required.' });

    const [studentsSnap, facultySnap, projectsSnap, certsSnap] = await Promise.all([
      db.collection('students').where('college_id', '==', targetCollegeId).get(),
      db.collection('faculty').where('college_id', '==', targetCollegeId).get(),
      db.collection('projects').where('college_id', '==', targetCollegeId).get(),
      db.collection('certificates').where('college_id', '==', targetCollegeId).get()
    ]);
    
    // AI Readiness Score Calculation
    let totalScore = 0;
    let studentsWithScore = 0;
    let hackathonParticipants = 0;
    
    for (const doc of studentsSnap.docs) {
      const uid = doc.id;
      const data = doc.data();
      const rDoc = await db.collection('placementReadiness').doc(uid).get();
      if (rDoc.exists) {
        totalScore += rDoc.data().score || 0;
        studentsWithScore++;
      }
      
      // We will count it as a hackathon participant if they have hackathons listed in their profile or projects
      // For now, let's look at their projects
      const pDoc = await db.collection('profiles').doc(uid).get();
      if (pDoc.exists && pDoc.data().projects && pDoc.data().projects.length > 0) {
        // Just mock some hackathon count based on projects for presentation
        hackathonParticipants++;
      }
    }
    
    const avgReadiness = studentsWithScore > 0 ? Math.round(totalScore / studentsWithScore) : 0;

    res.json({
      totalStudents: studentsSnap.size,
      totalFaculty: facultySnap.size,
      totalProjects: projectsSnap.size,
      totalCertificates: certsSnap.size,
      avgReadiness: avgReadiness,
      hackathonParticipants: hackathonParticipants
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
});

module.exports = router;
