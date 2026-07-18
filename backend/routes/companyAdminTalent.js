const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const auth = require('../middleware/auth');

// GET /api/company-admin/talent
// Fetch and filter students for recruiters
router.get('/', auth, async (req, res) => {
  try {
    const { skills, college, year, role } = req.query;
    
    let usersRef = db.collection('students');
    const snapshot = await usersRef.get();
    
    // Get currently shortlisted IDs for this recruiter
    const shortlistSnapshot = await db.collection('shortlists')
      .where('recruiter_id', '==', req.user.id)
      .get();
    const shortlistedIds = new Set(shortlistSnapshot.docs.map(doc => doc.data().student_id));
    
    let candidates = [];
    
    snapshot.forEach(doc => {
      const rawData = doc.data();
      const pd = rawData.profile_data || {};
      const data = { ...rawData, ...pd };

      let match = true;
      
      if (skills) {
        const skillsArray = skills.split(',').map(s => s.trim().toLowerCase());
        const userSkills = (data.skills || []).map(s => s.toLowerCase());
        if (!skillsArray.some(skill => userSkills.includes(skill))) {
          match = false;
        }
      }
      
      if (college && data.college) {
        if (!data.college.toLowerCase().includes(college.toLowerCase())) match = false;
      }
      
      if (year && data.year) {
        if (data.year !== year) match = false;
      }
      
      if (role && data.desired_roles) {
        const roles = data.desired_roles.map(r => r.toLowerCase());
        if (!roles.some(r => r.includes(role.toLowerCase()))) match = false;
      }
      
      if (match) {
        candidates.push({
          id: doc.id,
          name: data.name || data.full_name || 'Anonymous',
          email: data.email,
          college: data.college || 'Not specified',
          year: data.year || 'N/A',
          skills: data.skills || [],
          desired_roles: data.desired_roles || [],
          bio: data.bio || '',
          profile_photo: data.profile_photo,
          resume_url: data.resume_url,
          portfolio_url: data.portfolio_url,
          github_url: data.github_url,
          linkedin_url: data.linkedin_url,
          profile_completion: data.profile_completion || 0,
          profile_score: data.profile_score || 0,
          is_shortlisted: shortlistedIds.has(doc.id)
        });
      }
    });

    candidates.sort((a, b) => b.profile_score - a.profile_score);
    res.json(candidates);
  } catch (err) {
    console.error("Talent Search error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/company-admin/talent/:id/shortlist
// Toggle shortlist status
router.post('/:id/shortlist', auth, async (req, res) => {
  try {
    const student_id = req.params.id;
    const recruiter_id = req.user.id;
    
    const snapshot = await db.collection('shortlists')
      .where('recruiter_id', '==', recruiter_id)
      .where('student_id', '==', student_id)
      .get();
      
    if (snapshot.empty) {
      // Add to shortlist
      await db.collection('shortlists').add({
        recruiter_id,
        student_id,
        created_at: new Date()
      });
      res.json({ message: 'Added to shortlist', is_shortlisted: true });
    } else {
      // Remove from shortlist
      await snapshot.docs[0].ref.delete();
      res.json({ message: 'Removed from shortlist', is_shortlisted: false });
    }
  } catch (err) {
    console.error("Shortlist error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
