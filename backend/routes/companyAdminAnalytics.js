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
    
    // Fetch all applications for this company
    const applicationsSnap = await db.collection('applications').where('company_id', '==', targetCompanyId).get();
    
    let totalApplications = 0;
    
    // Funnel Data
    const funnel = {
      Applied: 0,
      Bookmarked: 0,
      Shortlisted: 0,
      Interviewing: 0,
      'Resume Requested': 0,
      Selected: 0,
      Rejected: 0
    };

    // Time to Hire Data
    let totalTimeToHireDays = 0;
    let hiredCount = 0;

    // Skills Distribution
    const skillCounts = {};
    let totalMatchScore = 0;
    let scoredCandidates = 0;

    for (const doc of applicationsSnap.docs) {
      const data = doc.data();
      totalApplications++;

      // Populate Funnel
      const status = data.status || 'Applied';
      if (funnel[status] !== undefined) {
        funnel[status]++;
      } else {
        // Fallback mapping for old statuses
        if (status === 'Under Review') funnel['Bookmarked']++;
      }

      // Calculate Time to Hire (if hired)
      if (status === 'Selected' && data.applied_at && data.updated_at) {
        const appliedDate = new Date(data.applied_at._seconds ? data.applied_at.toDate() : data.applied_at);
        const hiredDate = new Date(data.updated_at._seconds ? data.updated_at.toDate() : data.updated_at);
        const diffTime = Math.abs(hiredDate - appliedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalTimeToHireDays += diffDays;
        hiredCount++;
      }

      // We need to fetch the student's profile to get skills and calculate match score
      // In a real app with cloud functions, this would be pre-calculated in the document.
      try {
        const studentDoc = await db.collection('students').doc(data.user_id).get();
        if (studentDoc.exists) {
          const studentData = studentDoc.data();
          const skills = studentData.skills || [];
          
          // Count Skills
          skills.forEach(skill => {
            const cleanSkill = skill.trim();
            if (cleanSkill) {
              skillCounts[cleanSkill] = (skillCounts[cleanSkill] || 0) + 1;
            }
          });

          // Simulate Match Score logic (normally done by Cloud Function)
          // We will fetch the opportunity skills
          if (data.opportunity_id) {
            const oppDoc = await db.collection('opportunities').doc(data.opportunity_id).get();
            if (oppDoc.exists) {
              const oppData = oppDoc.data();
              const reqSkills = oppData.skills || [];
              if (reqSkills.length > 0) {
                let matches = 0;
                reqSkills.forEach(reqSkill => {
                  if (skills.some(s => s.toLowerCase() === reqSkill.toLowerCase())) {
                    matches++;
                  }
                });
                const matchRate = (matches / reqSkills.length) * 100;
                totalMatchScore += matchRate;
                scoredCandidates++;
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching student for analytics", err);
      }
    }

    // Process final metrics
    const avgTimeToHire = hiredCount > 0 ? Math.round(totalTimeToHireDays / hiredCount) : 0;
    const avgMatchRate = scoredCandidates > 0 ? Math.round(totalMatchScore / scoredCandidates) : 0;
    
    // Sort skills for chart
    const skillDistribution = Object.entries(skillCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7); // Top 7 skills

    res.json({
      totalApplications,
      funnel,
      avgTimeToHire,
      avgMatchRate,
      skillDistribution,
      totalHires: hiredCount
    });

  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
});

module.exports = router;
