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
    // Generate CSV string with more details
    let csvContent = "Name,Email,Status,ProfileScore,Skills\n";
    studentsSnapshot.forEach(doc => {
      const data = doc.data();
      const profileData = data.profile_data || {};
      const score = profileData.profile_score || 0;
      const skills = (profileData.skills || []).join(';');
      csvContent += `"${data.name || ''}","${data.email || ''}","${data.status || 'active'}",${score},"${skills}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('student_outcomes_report.csv');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ message: 'Server error generating report' });
  }
});

// GET /api/college-admin/reports/analytics
// Serve chart data for the College Reports page
router.get('/analytics', collegeAdminOnly, async (req, res) => {
  try {
    const targetCollegeId = req.user.role === 'super_admin' ? req.query.college_id : req.user.college_id;
    if (!targetCollegeId) return res.status(400).json({ message: 'College ID required.' });

    // In a production app, these would be complex aggregation queries.
    // For this MVP, we will send mock analytics data.
    
    const data = {
      skills: [
        { name: 'React', count: 120 },
        { name: 'Python', count: 98 },
        { name: 'Node.js', count: 85 },
        { name: 'Java', count: 60 },
        { name: 'MongoDB', count: 50 },
      ],
      placements: [
        { month: 'Jan', applied: 200, interviewed: 50, hired: 10 },
        { month: 'Feb', applied: 250, interviewed: 60, hired: 15 },
        { month: 'Mar', applied: 300, interviewed: 80, hired: 25 },
        { month: 'Apr', applied: 280, interviewed: 90, hired: 35 },
      ],
      internships: [
        { month: 'Jan', count: 20 },
        { month: 'Feb', count: 25 },
        { month: 'Mar', count: 40 },
        { month: 'Apr', count: 65 },
      ]
    };

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
});

module.exports = router;
