const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper: No longer expiring chats
async function checkExpiredChats(connectionId = null) {
  return; // Disabled expiration to make chat unlimited
}

// GET: Discover students (porting from teams/discover but tailored)
router.get('/discover', auth, async (req, res) => {
  try {
    const { skill, domain, experience, college, year, branch, desired_role, availability, location, interests, cursor, limit } = req.query;
    
    // Fetch existing connections to exclude them
    const sent = await db.collection('student_connections').where('sender_id', '==', req.user.id).get();
    const received = await db.collection('student_connections').where('receiver_id', '==', req.user.id).get();
    
    const excludedUserIds = new Set();
    sent.forEach(doc => {
      const d = doc.data();
      if (d.status !== 'rejected') excludedUserIds.add(d.receiver_id);
    });
    received.forEach(doc => {
      const d = doc.data();
      if (d.status !== 'rejected') excludedUserIds.add(d.sender_id);
    });

    // Exclude blocked users (if array exists on user doc)
    const currentUserDoc = await db.collection('students').doc(req.user.id).get();
    if (currentUserDoc.exists) {
      const data = currentUserDoc.data();
      const blocked = data.blocked_users || [];
      blocked.forEach(id => excludedUserIds.add(id));
    }

    let usersRef = db.collection('students').orderBy('__name__');
    
    if (cursor) {
      const cursorDoc = await db.collection('students').doc(cursor).get();
      if (cursorDoc.exists) {
        usersRef = usersRef.startAfter(cursorDoc);
      }
    }

    // Determine batch size: if filtering, fetch more to ensure we find matches
    const hasFilters = skill || domain || experience || college || year || branch || desired_role || availability || location || interests;
    const fetchLimit = hasFilters ? 200 : (parseInt(limit) || 20);
    
    usersRef = usersRef.limit(fetchLimit);
    const snapshot = await usersRef.get();
    let students = [];
    
    snapshot.forEach(doc => {
      // Don't discover self
      if (doc.id === req.user.id) return;
      
      // Exclude already connected, pending, or blocked users
      if (excludedUserIds.has(doc.id)) return;
      
      const rawData = doc.data();
      const pd = rawData.profile_data || {};
      const data = { ...rawData, ...pd }; // Merge profile_data into top level

      let match = true;
      
      if (skill && !(data.skills || []).some(s => s.toLowerCase().includes(skill.toLowerCase()))) match = false;
      if (domain && data.career_goal !== domain) match = false;
      if (experience && data.experience_level !== experience) match = false;
      if (college && (!data.college || !data.college.toLowerCase().includes(college.toLowerCase()))) match = false;
      if (year && data.year !== year) match = false;
      if (branch && (!data.branch || !data.branch.toLowerCase().includes(branch.toLowerCase()))) match = false;
      if (desired_role) {
        const roles = data.desired_roles || (data.career_goal ? [data.career_goal] : []);
        if (!roles.some(r => r.toLowerCase().includes(desired_role.toLowerCase()))) match = false;
      }
      if (availability && data.availability !== availability) match = false;
      if (location) {
        const userLoc = `${data.district || ''} ${data.state || ''}`.toLowerCase();
        if (!userLoc.includes(location.toLowerCase())) match = false;
      }
      if (interests) {
        const userInterests = [...(data.passionate_about || []), ...(data.seeking || [])];
        if (!userInterests.some(i => i.toLowerCase().includes(interests.toLowerCase()))) match = false;
      }
      
      if (match) {
        students.push({
          id: doc.id,
          name: data.name || data.full_name || 'Unknown',
          college: data.college,
          skills: data.skills || [],
          career_goal: data.career_goal,
          bio: data.bio,
          desired_roles: data.desired_roles || [],
          year: data.year,
          degree: data.degree,
          branch: data.branch,
          district: data.district,
          state: data.state,
          achievements: data.achievements || [],
          seeking: data.seeking || [],
          passionate_about: data.passionate_about || [],
          experience_level: data.experience_level,
          github_url: data.github_url,
          linkedin_url: data.linkedin_url,
          portfolio_url: data.portfolio_url,
          resume_url: data.resume_url,
          activity_score: data.activity_score || 0,
          points: data.points || 0,
          badges: data.badges || [],
          profile_completion: data.profile_completion || 0
        });
      }
    });

    const nextCursor = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null;
    const hasMore = snapshot.docs.length === fetchLimit;

    res.json({ data: students, nextCursor, hasMore });
  } catch (err) {
    console.error("Discover error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET: AI Team Matching
router.get('/ai-match', auth, async (req, res) => {
  try {
    // 1. Fetch current user
    const currentUserDoc = await db.collection('students').doc(req.user.id).get();
    if (!currentUserDoc.exists) return res.status(404).json({ message: "User not found" });
    const userData = currentUserDoc.data();
    const userProfile = {
      skills: userData.skills || [],
      goals: userData.career_goal || '',
      interests: userData.passionate_about || []
    };

    // 2. Fetch all other active students (simplified for MVP: top 50)
    const snapshot = await db.collection('students').limit(50).get();
    let candidates = [];
    
    snapshot.forEach(doc => {
      if (doc.id === req.user.id) return;
      const data = doc.data();
      candidates.push({
        id: doc.id,
        name: data.name || data.full_name || 'Anonymous',
        skills: data.skills || [],
        goals: data.career_goal || '',
        college: data.college || ''
      });
    });

    if (candidates.length === 0) return res.json({ matches: [] });

    // 3. Ask Gemini to find the top 5 matches based on complementary skills
    const prompt = `
You are an expert team matchmaker for a student coding platform.
The current user is looking for teammates with complementary skills (e.g., frontend matching with backend).

Current User Profile:
- Skills: ${userProfile.skills.join(', ')}
- Goal: ${userProfile.goals}
- Interests: ${userProfile.interests.join(', ')}

Available Candidates (JSON):
${JSON.stringify(candidates.map(c => ({ id: c.id, skills: c.skills, goals: c.goals })))}

Select the top 5 candidates that best complement the user's skills for a hackathon team. 
Return ONLY a JSON array of objects with the exact structure:
[
  { "id": "candidate_id", "synergy_score": 95, "reason": "Short 1-sentence reason why they match" }
]
`;

    const model = await getConfiguredModel();
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.startsWith('\`\`\`json')) text = text.slice(7);
    if (text.startsWith('\`\`\`')) text = text.slice(3);
    if (text.endsWith('\`\`\`')) text = text.slice(0, -3);
    text = text.trim();

    const aiMatches = JSON.parse(text);

    // 4. Map the AI results back to the full candidate profiles
    const finalMatches = aiMatches.map(match => {
      const fullProfile = candidates.find(c => c.id === match.id);
      return {
        ...fullProfile,
        synergy_score: match.synergy_score,
        match_reason: match.reason
      };
    }).filter(m => m.name !== undefined); // Filter out if AI hallucinated an ID

    res.json({ matches: finalMatches });
  } catch (err) {
    console.error("AI Match error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST: Send connection request
router.post('/connect', auth, async (req, res) => {
  const { receiver_id } = req.body;
  if (!receiver_id) return res.status(400).json({ message: 'receiver_id is required' });
  if (receiver_id === req.user.id) return res.status(400).json({ message: 'Cannot connect with yourself' });

  try {
    // Check if connection already exists
    const existingSender = await db.collection('student_connections')
      .where('sender_id', '==', req.user.id)
      .where('receiver_id', '==', receiver_id)
      .get();
    
    const existingReceiver = await db.collection('student_connections')
      .where('sender_id', '==', receiver_id)
      .where('receiver_id', '==', req.user.id)
      .get();
      
    if (!existingSender.empty || !existingReceiver.empty) {
      // If there's an existing one, check status
      const existing = !existingSender.empty ? existingSender.docs[0] : existingReceiver.docs[0];
      if (existing.data().status === 'pending') {
        return res.status(400).json({ message: 'Connection request already pending.' });
      }
      if (existing.data().status === 'accepted') {
        return res.status(400).json({ message: 'Already connected.' });
      }
      // If 'rejected' or 'expired', we can create a new one, so we just delete the old one
      await db.collection('student_connections').doc(existing.id).delete();
    }

    const connRef = db.collection('student_connections').doc();
    const newConn = {
      id: connRef.id,
      sender_id: req.user.id,
      receiver_id,
      status: 'pending',
      created_at: new Date()
    };

    await connRef.set(newConn);

    const notifRef = db.collection('notifications').doc();
    const notifData = {
      id: notifRef.id,
      user_id: receiver_id,
      title: 'New Connection Request',
      message: 'Someone wants to connect with you!',
      type: 'connection_request',
      is_read: false,
      created_at: new Date()
    };
    await notifRef.set(notifData);

    if (req.io) {
      req.io.to(`user_${receiver_id}`).emit('new_notification', notifData);
      // Emit the raw connection request for real-time UI updates
      req.io.to(`user_${receiver_id}`).emit('connection_request', {
        ...newConn,
        sender_name: req.user.name || 'A student'
      });
    }

    res.status(201).json(newConn);
  } catch (err) {
    console.error("Connect error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT: Accept/Reject connection
router.put('/connect/:id', auth, async (req, res) => {
  const { action } = req.body; // 'accept' or 'reject'
  if (!['accept', 'reject'].includes(action)) return res.status(400).json({ message: 'Invalid action' });

  try {
    const docRef = db.collection('student_connections').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Connection not found' });
    
    const data = doc.data();
    if (data.receiver_id !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    if (action === 'reject') {
      await docRef.update({ status: 'rejected' });
      if (req.io) {
        // Emit to the other user so their UI updates if they are online
        const otherId = data.sender_id === req.user.id ? data.receiver_id : data.sender_id;
        req.io.to(`user_${otherId}`).emit('connection_rejected', { id: doc.id });
      }
      return res.json({ message: 'Request rejected' });
    }

    // Accept: No expiry
    const now = new Date();
    
    await docRef.update({
      status: 'accepted',
      accepted_at: now
    });

    const notifRef = db.collection('notifications').doc();
    const notifData = {
      id: notifRef.id,
      user_id: data.sender_id,
      title: 'Connection Accepted',
      message: 'Your connection request was accepted. You can now chat unlimitedly!',
      type: 'connection_accepted',
      is_read: false,
      created_at: new Date()
    };
    await notifRef.set(notifData);

    if (req.io) {
      req.io.to(`user_${data.sender_id}`).emit('new_notification', notifData);
      req.io.to(`user_${data.sender_id}`).emit('connection_accepted', { id: doc.id });
    }

    res.json({ message: 'Request accepted. Chat is now active.' });
  } catch (err) {
    console.error("Accept connect error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET: My connections (Pending & Accepted)
router.get('/connections', auth, async (req, res) => {
  try {
    await checkExpiredChats(); // Sweep expired ones

    const sent = await db.collection('student_connections').where('sender_id', '==', req.user.id).get();
    const received = await db.collection('student_connections').where('receiver_id', '==', req.user.id).get();
    
    let connections = [];
    
    const extract = async (docs) => {
      for (const doc of docs) {
        const d = doc.data();
        if (d.status === 'rejected' || d.status === 'expired') continue; // Don't show
        
        const otherId = d.sender_id === req.user.id ? d.receiver_id : d.sender_id;
        const otherDoc = await db.collection('students').doc(otherId).get();
        const rawOtherData = otherDoc.exists ? otherDoc.data() : { name: 'Unknown' };
        const pd = rawOtherData.profile_data || {};
        const otherData = { ...rawOtherData, ...pd };
        
        connections.push({
          ...d,
          id: doc.id,
          other_user: {
            id: otherId,
            name: otherData.name || otherData.full_name || 'Unknown',
            college: otherData.college,
            skills: otherData.skills || [],
            career_goal: otherData.career_goal,
            desired_roles: otherData.desired_roles || [],
            year: otherData.year,
            degree: otherData.degree,
            branch: otherData.branch,
            district: otherData.district,
            state: otherData.state,
            achievements: otherData.achievements || [],
            seeking: otherData.seeking || [],
            passionate_about: otherData.passionate_about || [],
            experience_level: otherData.experience_level,
            github_url: otherData.github_url,
            linkedin_url: otherData.linkedin_url,
            portfolio_url: otherData.portfolio_url,
            resume_url: otherData.resume_url,
            activity_score: otherData.activity_score || 0,
            points: otherData.points || 0,
            badges: otherData.badges || [],
            profile_completion: otherData.profile_completion || 0
          }
        });
      }
    };

    await extract(sent.docs);
    await extract(received.docs);

    res.json(connections);
  } catch (err) {
    console.error("Get connections error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
