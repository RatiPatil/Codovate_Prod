const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const auth = require('../middleware/auth');

// GET /api/company-admin/talent
// Fetch and filter students for recruiters
router.get('/', auth, async (req, res) => {
  try {
    const { 
      skills, college, year, role,
      branch, location, experience_level,
      resume_score, coding_score, project_count, availability
    } = req.query;
    
    let usersRef = db.collection('students');
    const snapshot = await usersRef.get();
    
    // Get currently shortlisted IDs for this recruiter
    const shortlistSnapshot = await db.collection('shortlists')
      .where('recruiter_id', '==', req.user.id)
      .get();
    const shortlistedIds = new Set(shortlistSnapshot.docs.map(doc => doc.data().student_id));
    
    let matchedDocs = [];
    
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
      
      if (branch && data.branch) {
        if (!data.branch.toLowerCase().includes(branch.toLowerCase())) match = false;
      }
      
      if (location && data.location) {
        if (!data.location.toLowerCase().includes(location.toLowerCase())) match = false;
      }
      
      if (experience_level && data.experience_level) {
        if (data.experience_level.toLowerCase() !== experience_level.toLowerCase()) match = false;
      }
      
      if (project_count && !isNaN(parseInt(project_count))) {
        const count = data.projects ? data.projects.length : 0;
        if (count < parseInt(project_count)) match = false;
      }
      
      if (availability && availability === 'true') {
        if (data.actively_looking === false) match = false;
      }
      
      if (match) {
        matchedDocs.push({ doc, data });
      }
    });

    const candidates = await Promise.all(matchedDocs.map(async ({ doc, data }) => {
      // Fetch placementReadiness
      let readinessData = null;
      try {
        const readinessDoc = await db.collection('placementReadiness').doc(doc.id).get();
        if (readinessDoc.exists) {
          readinessData = readinessDoc.data();
        }
      } catch (err) {
        console.error(`Failed to fetch readiness for ${doc.id}`);
      }

      let includeCandidate = true;
      
      if (resume_score && !isNaN(parseInt(resume_score))) {
        const rScore = readinessData?.resume_score || 0;
        if (rScore < parseInt(resume_score)) includeCandidate = false;
      }
      
      if (coding_score && !isNaN(parseInt(coding_score))) {
        const cScore = readinessData?.coding_score || 0;
        if (cScore < parseInt(coding_score)) includeCandidate = false;
      }

      if (!includeCandidate) return null;

      return {
        id: doc.id,
        name: data.name || data.full_name || 'Anonymous',
        email: data.email,
        college: data.college || 'Not specified',
        branch: data.branch || 'Not specified',
        year: data.year || 'N/A',
        location: data.location || '',
        experience_level: data.experience_level || 'Beginner',
        project_count: data.projects ? data.projects.length : 0,
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
        is_shortlisted: shortlistedIds.has(doc.id),
        actively_looking: data.actively_looking !== false,
        readiness: readinessData
      };
    }));

    // Filter out nulls from score filtering
    const filteredCandidates = candidates.filter(c => c !== null);

    filteredCandidates.sort((a, b) => b.profile_score - a.profile_score);
    res.json(filteredCandidates);
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
