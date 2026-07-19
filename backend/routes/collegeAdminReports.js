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

    // 1. Fetch Students & Aggregate Skills and Departments
    const studentsSnapshot = await db.collection('students').where('college_id', '==', targetCollegeId).get();
    
    const skillCounts = {};
    const deptStats = {};
    const studentIds = new Set();
    
    studentsSnapshot.forEach(doc => {
      const data = doc.data();
      studentIds.add(doc.id);
      
      const pd = data.profile_data || {};
      const skills = data.skills || pd.skills || [];
      const branch = data.branch || pd.branch || 'Unknown';
      const score = data.profile_score || pd.profile_score || 0;
      
      skills.forEach(skill => {
        const s = skill.trim();
        skillCounts[s] = (skillCounts[s] || 0) + 1;
      });
      
      if (!deptStats[branch]) deptStats[branch] = { count: 0, total_score: 0 };
      deptStats[branch].count += 1;
      deptStats[branch].total_score += score;
    });
    
    const sortedSkills = Object.entries(skillCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
      
    const departments = Object.entries(deptStats)
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        avg_score: Math.round(stats.total_score / stats.count)
      }))
      .sort((a, b) => b.count - a.count);

    // 2. Fetch Opportunities to map type (Internship/Job)
    const oppsSnapshot = await db.collection('opportunities').get();
    const oppTypes = {};
    oppsSnapshot.forEach(doc => {
      oppTypes[doc.id] = doc.data().type;
    });

    // 3. Fetch Applications to aggregate Placements and Internships
    const appsSnapshot = await db.collection('applications').get();
    
    const monthlyPlacements = {};
    const monthlyInternships = {};
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Initialize last 6 months
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mName = monthNames[d.getMonth()];
      monthlyPlacements[mName] = { month: mName, applied: 0, interviewed: 0, hired: 0, sortKey: d.getTime() };
      monthlyInternships[mName] = { month: mName, count: 0, sortKey: d.getTime() };
    }

    appsSnapshot.forEach(doc => {
      const app = doc.data();
      const uid = app.user_id || app.student_id;
      if (!studentIds.has(uid)) return;
      
      const date = app.applied_at?.toDate ? app.applied_at.toDate() : new Date(app.applied_at);
      if (isNaN(date.getTime())) return;
      
      const mName = monthNames[date.getMonth()];
      
      // If the month is in our tracked months window
      if (monthlyPlacements[mName]) {
        monthlyPlacements[mName].applied += 1;
        if (app.status === 'Under Review' || app.status === 'Interview') monthlyPlacements[mName].interviewed += 1;
        if (app.status === 'Selected') monthlyPlacements[mName].hired += 1;
        
        const type = oppTypes[app.opportunity_id];
        if (type === 'Internship' && app.status === 'Selected') {
          monthlyInternships[mName].count += 1;
        }
      }
    });
    
    const placements = Object.values(monthlyPlacements).sort((a, b) => a.sortKey - b.sortKey);
    const internships = Object.values(monthlyInternships).sort((a, b) => a.sortKey - b.sortKey);

    const data = {
      skills: sortedSkills.length > 0 ? sortedSkills : [{ name: 'No data', count: 0 }],
      departments: departments.length > 0 ? departments : [{ name: 'No data', count: 0, avg_score: 0 }],
      placements,
      internships
    };

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
});

module.exports = router;
