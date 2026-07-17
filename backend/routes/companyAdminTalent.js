const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// GET /api/company-admin/talent
// Fetch and filter students for recruiters
router.get('/', async (req, res) => {
  try {
    const { skills, college, year, role } = req.query;
    
    let usersRef = db.collection('students');
    const snapshot = await usersRef.get();
    
    let candidates = [];
    
    snapshot.forEach(doc => {
      const rawData = doc.data();
      const pd = rawData.profile_data || {};
      const data = { ...rawData, ...pd };

      // Optional: Skip users who are not open to work (if that field exists)
      // if (data.open_to_work === false) return;

      let match = true;
      
      // Filter by skills
      if (skills) {
        const skillsArray = skills.split(',').map(s => s.trim().toLowerCase());
        const userSkills = (data.skills || []).map(s => s.toLowerCase());
        // Candidate must have ALL requested skills (or at least one, depending on design)
        // Let's do: must have AT LEAST ONE of the requested skills to be more forgiving
        if (!skillsArray.some(skill => userSkills.includes(skill))) {
          match = false;
        }
      }
      
      // Filter by college
      if (college && data.college) {
        if (!data.college.toLowerCase().includes(college.toLowerCase())) match = false;
      }
      
      // Filter by graduation year
      if (year && data.year) {
        if (data.year !== year) match = false;
      }
      
      // Filter by role
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
          profile_score: data.profile_score || 0
        });
      }
    });

    // Sort by profile score descending
    candidates.sort((a, b) => b.profile_score - a.profile_score);

    res.json(candidates);
  } catch (err) {
    console.error("Talent Search error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
