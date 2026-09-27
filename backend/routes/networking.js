const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');
const { calculateMatchScore } = require("../services/matchingService");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper: No longer expiring chats
async function checkExpiredChats(connectionId = null) {
  return; // Disabled expiration to make chat unlimited
}

// GET: Discover students (queries canonical profiles collection)
router.get('/discover', auth, async (req, res) => {
  try {
    const { skill, domain, experience, college, year, branch, desired_role, availability, location, interests, cursor, limit } = req.query;
    
    // Fetch existing connections & requests to exclude them
    const [sent, received, sentReqs, receivedReqs] = await Promise.all([
      db.collection('student_connections').where('sender_id', '==', req.user.id).get(),
      db.collection('student_connections').where('receiver_id', '==', req.user.id).get(),
      db.collection('connection_requests').where('from_user', '==', req.user.id).get(),
      db.collection('connection_requests').where('to_user', '==', req.user.id).get()
    ]);
    
    const excludedUserIds = new Set();
    sent.forEach(doc => {
      const d = mapDoc(doc);
      if (d.status !== 'rejected') excludedUserIds.add(d.receiver_id);
    });
    received.forEach(doc => {
      const d = mapDoc(doc);
      if (d.status !== 'rejected') excludedUserIds.add(d.sender_id);
    });
    sentReqs.forEach(doc => {
      const d = mapDoc(doc);
      if (d.status === 'pending') excludedUserIds.add(d.to_user);
    });
    receivedReqs.forEach(doc => {
      const d = mapDoc(doc);
      if (d.status === 'pending') excludedUserIds.add(d.from_user);
    });

    // Exclude blocked users
    const currentUserDoc = await db.collection('profiles').doc(req.user.id).get();
    if (currentUserDoc.exists) {
      const data = mapDoc(currentUserDoc);
      const blocked = data.blocked_users || [];
      blocked.forEach(id => excludedUserIds.add(id));
    }

    // Fetch candidate profiles from profiles collection
    let profilesSnap = await db.collection('profiles').get();
    let candidateDocs = profilesSnap.docs;

    // Fallback: If profiles collection is empty, check legacy students collection
    if (candidateDocs.length === 0) {
      const studentsSnap = await db.collection('students').get();
      candidateDocs = studentsSnap.docs;
    }

    let students = [];
    
    candidateDocs.forEach(doc => {
      // 1. Exclude self
      if (doc.id === req.user.id) return;
      
      // 2. Exclude already connected, pending, or blocked users
      if (excludedUserIds.has(doc.id)) return;
      
      const rawData = mapDoc(doc);
      const personalInfo = rawData.personalInfo || {};
      const education = rawData.education || {};
      const socialLinks = rawData.socialLinks || {};

      const name = personalInfo.name || rawData.name || rawData.full_name || 'Codovate Student';
      const userCollege = education.college || rawData.college || '';
      const userBranch = education.branch || rawData.branch || '';
      const userYear = education.year || rawData.year || '';
      const userDegree = education.degree || rawData.degree || '';
      
      // Extract skill names cleanly
      const rawSkills = rawData.skills || [];
      const skillNames = rawSkills.map(s => typeof s === 'string' ? s : (s.name || s.title || ''));
      
      const careerGoal = rawData.careerGoal || rawData.career_goal || '';
      const experienceLevel = rawData.experienceLevel || rawData.experience_level || '';
      const bio = rawData.bio || '';
      const profilePhoto = personalInfo.avatar || rawData.profile_photo || rawData.profileImage || null;

      let match = true;
      
      if (skill && !skillNames.some(s => s.toLowerCase().includes(skill.toLowerCase().trim()))) match = false;
      if (domain && !careerGoal.toLowerCase().includes(domain.toLowerCase().trim())) match = false;
      if (experience && experienceLevel.toLowerCase() !== experience.toLowerCase().trim()) match = false;
      if (college && !userCollege.toLowerCase().includes(college.toLowerCase().trim())) match = false;
      if (year && userYear.toString() !== year.toString().trim()) match = false;
      if (branch && !userBranch.toLowerCase().includes(branch.toLowerCase().trim())) match = false;
      if (desired_role) {
        const roles = rawData.desired_roles || [careerGoal];
        if (!roles.some(r => r.toLowerCase().includes(desired_role.toLowerCase().trim()))) match = false;
      }
      if (location) {
        const userLoc = `${personalInfo.location || ''} ${rawData.district || ''} ${rawData.state || ''}`.toLowerCase();
        if (!userLoc.includes(location.toLowerCase().trim())) match = false;
      }
      
      if (match) {
        students.push({
          id: doc.id,
          name,
          college: userCollege,
          branch: userBranch,
          year: userYear,
          degree: userDegree,
          skills: skillNames,
          career_goal: careerGoal,
          bio,
          profile_photo: profilePhoto,
          desired_roles: rawData.desired_roles || [careerGoal],
          experience_level: experienceLevel,
          github_url: socialLinks.github || rawData.github_url || null,
          linkedin_url: socialLinks.linkedin || rawData.linkedin_url || null,
          portfolio_url: socialLinks.portfolio || rawData.portfolio_url || null,
          resume_url: socialLinks.resume || rawData.resume_url || null,
          profile_completion: rawData.profileCompletion || rawData.profile_completion || 0
        });
      }
    });

    // Sort candidates by profile completeness
    students.sort((a, b) => b.profile_completion - a.profile_completion);

    res.json({ data: students.slice(0, parseInt(limit) || 50), nextCursor: null, hasMore: false });
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
    const userData = mapDoc(currentUserDoc);
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
      const data = mapDoc(doc);
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
  const { receiver_id, targetUserId } = req.body;
  const targetId = receiver_id || targetUserId;

  if (!targetId) return res.status(400).json({ message: 'Target user ID is required' });
  if (targetId === req.user.id) return res.status(400).json({ message: 'Cannot connect with yourself' });

  try {
    const uid = req.user.id;

    // Check existing connections
    const connCheck = await db.collection("connections")
      .where("user1", "in", [uid, targetId])
      .get();

    const existingConn = connCheck.docs.find(d => {
      const data = d.data();
      return (data.user1 === uid && data.user2 === targetId) || (data.user1 === targetId && data.user2 === uid);
    });

    if (existingConn && existingConn.data().status === 'connected') {
      return res.status(400).json({ message: 'Already connected.' });
    }

    // Check pending request in connection_requests
    const pendingSnap = await db.collection("connection_requests")
      .where("from_user", "==", uid)
      .where("to_user", "==", targetId)
      .where("status", "==", "pending")
      .get();

    if (!pendingSnap.empty) {
      return res.status(400).json({ message: 'Connection request already pending.' });
    }

    const reqRef = db.collection('connection_requests').doc();
    const newReq = {
      id: reqRef.id,
      from_user: uid,
      sender_id: uid,
      to_user: targetId,
      receiver_id: targetId,
      status: 'pending',
      created_at: new Date()
    };

    await reqRef.set(newReq);

    const notifRef = db.collection('notifications').doc();
    const notifData = {
      id: notifRef.id,
      user_id: targetId,
      title: 'New Connection Request',
      message: 'Someone wants to connect with you!',
      type: 'connection_request',
      is_read: false,
      created_at: new Date()
    };
    await notifRef.set(notifData);

    if (req.io) {
      req.io.to(`user_${targetId}`).emit('new_notification', notifData);
      req.io.to(`user_${targetId}`).emit('connection_request', {
        ...newReq,
        sender_name: req.user.name || 'A student'
      });
    }

    res.status(201).json(newReq);
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
    let docRef = db.collection('connection_requests').doc(req.params.id);
    let doc = await docRef.get();
    
    // Fallback check in student_connections
    if (!doc.exists) {
      docRef = db.collection('student_connections').doc(req.params.id);
      doc = await docRef.get();
    }

    if (!doc.exists) return res.status(404).json({ message: 'Connection request not found' });
    
    const data = mapDoc(doc);
    const toUser = data.to_user || data.receiver_id;
    const fromUser = data.from_user || data.sender_id;

    if (toUser !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    if (action === 'reject') {
      await docRef.update({ status: 'rejected' });
      if (req.io) {
        req.io.to(`user_${fromUser}`).emit('connection_rejected', { id: doc.id });
      }
      return res.json({ message: 'Request rejected' });
    }

    // Accept: Update request status
    const now = new Date();
    await docRef.update({
      status: 'accepted',
      accepted_at: now
    });

    // Create single canonical connection document in connections collection
    const connRef = db.collection("connections").doc();
    await connRef.set({
      id: connRef.id,
      user1: fromUser,
      user2: toUser,
      status: "connected",
      created_at: now
    });

    const notifRef = db.collection('notifications').doc();
    const notifData = {
      id: notifRef.id,
      user_id: fromUser,
      title: 'Connection Accepted',
      message: 'Your connection request was accepted. You can now chat!',
      type: 'connection_accepted',
      is_read: false,
      created_at: now
    };
    await notifRef.set(notifData);

    if (req.io) {
      req.io.to(`user_${fromUser}`).emit('new_notification', notifData);
      req.io.to(`user_${fromUser}`).emit('connection_accepted', { id: doc.id });
    }

    res.json({ message: 'Request accepted. Connection is now active.' });
  } catch (err) {
    console.error("Accept connect error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET: My connections (Pending & Accepted)
router.get('/connections', auth, async (req, res) => {
  try {
    const uid = req.user.id;

    const [connSnap1, connSnap2, pendingIncoming, pendingOutgoing, legacySent, legacyReceived] = await Promise.all([
      db.collection("connections").where("user1", "==", uid).where("status", "==", "connected").get(),
      db.collection("connections").where("user2", "==", uid).where("status", "==", "connected").get(),
      db.collection("connection_requests").where("to_user", "==", uid).where("status", "==", "pending").get(),
      db.collection("connection_requests").where("from_user", "==", uid).where("status", "==", "pending").get(),
      db.collection("student_connections").where("sender_id", "==", uid).get(),
      db.collection("student_connections").where("receiver_id", "==", uid).get()
    ]);

    const resultList = [];

    // Process established connections
    const connectedPeerIds = new Set();
    connSnap1.docs.forEach(d => connectedPeerIds.add(d.data().user2));
    connSnap2.docs.forEach(d => connectedPeerIds.add(d.data().user1));

    for (const peerId of connectedPeerIds) {
      if (!peerId) continue;
      const profileDoc = await db.collection("profiles").doc(peerId).get();
      const p = profileDoc.exists ? mapDoc(profileDoc) : {};
      const personalInfo = p.personalInfo || {};
      const education = p.education || {};

      resultList.push({
        id: `conn_${peerId}`,
        sender_id: uid,
        receiver_id: peerId,
        status: 'accepted',
        other_user: {
          id: peerId,
          name: personalInfo.name || p.name || 'Student',
          college: education.college || p.college || null,
          skills: p.skills || [],
          career_goal: p.careerGoal || p.career_goal || null,
          profile_photo: personalInfo.avatar || p.profile_photo || null
        }
      });
    }

    // Process incoming pending requests
    for (const doc of pendingIncoming.docs) {
      const r = mapDoc(doc);
      const fromDoc = await db.collection("profiles").doc(r.from_user).get();
      const p = fromDoc.exists ? mapDoc(fromDoc) : {};
      const personalInfo = p.personalInfo || {};
      const education = p.education || {};

      resultList.push({
        id: doc.id,
        sender_id: r.from_user,
        receiver_id: uid,
        status: 'pending',
        other_user: {
          id: r.from_user,
          name: personalInfo.name || p.name || 'Student',
          college: education.college || p.college || null,
          skills: p.skills || [],
          career_goal: p.careerGoal || p.career_goal || null,
          profile_photo: personalInfo.avatar || p.profile_photo || null
        }
      });
    }

    // Process outgoing pending requests
    for (const doc of pendingOutgoing.docs) {
      const r = mapDoc(doc);
      const toDoc = await db.collection("profiles").doc(r.to_user).get();
      const p = toDoc.exists ? mapDoc(toDoc) : {};
      const personalInfo = p.personalInfo || {};
      const education = p.education || {};

      resultList.push({
        id: doc.id,
        sender_id: uid,
        receiver_id: r.to_user,
        status: 'pending',
        other_user: {
          id: r.to_user,
          name: personalInfo.name || p.name || 'Student',
          college: education.college || p.college || null,
          skills: p.skills || [],
          career_goal: p.careerGoal || p.career_goal || null,
          profile_photo: personalInfo.avatar || p.profile_photo || null
        }
      });
    }

    // Process legacy student_connections for backward compatibility
    const legacyDocs = [...legacySent.docs, ...legacyReceived.docs];
    for (const doc of legacyDocs) {
      const d = mapDoc(doc);
      if (d.status === 'rejected') continue;
      const otherId = d.sender_id === uid ? d.receiver_id : d.sender_id;
      if (connectedPeerIds.has(otherId)) continue; // Already mapped

      const otherDoc = await db.collection('profiles').doc(otherId).get();
      const p = otherDoc.exists ? mapDoc(otherDoc) : {};
      const personalInfo = p.personalInfo || {};
      const education = p.education || {};

      resultList.push({
        ...d,
        id: doc.id,
        other_user: {
          id: otherId,
          name: personalInfo.name || p.name || 'Student',
          college: education.college || p.college || null,
          skills: p.skills || [],
          career_goal: p.careerGoal || p.career_goal || null,
          profile_photo: personalInfo.avatar || p.profile_photo || null
        }
      });
    }

    res.json(resultList);
  } catch (err) {
    console.error("Get connections error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
