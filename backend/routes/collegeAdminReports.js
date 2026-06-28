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

router.get('/csv', collegeAdminOnly, async (req, res) => {
  try {
    const targetCollegeId = req.user.role === 'super_admin' ? req.query.college_id : req.user.college_id;
    if (!targetCollegeId) return res.status(400).json({ message: 'College ID required.' });

    // Fetch students
    const studentsSnapshot = await db.collection('students')
                                     .where('college_id', '==', targetCollegeId)
                                     .get();
    
    // In a real application, you'd aggregate projects/certificates per student here.
    // For this example, we generate CSV string from basic user data.
    
    let csvContent = "Name,Email,Status\n";
    studentsSnapshot.forEach(doc => {
      const data = doc.data();
      csvContent += `${data.name},${data.email},${data.status || 'active'}\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('student_outcomes_report.csv');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ message: 'Server error generating report' });
  }
});

module.exports = router;
