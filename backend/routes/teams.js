const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");
const crypto = require("crypto");

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');
const { calculateMatchScore } = require("../services/matchingService");

// Get user's teams
router.get("/my", auth, async (req, res) => {
  try {
    const tmSnapshot = await db.collection("team_members").where("user_id", "==", req.user.id).get();
    
    let teams = await Promise.all(tmSnapshot.docs.map(async (doc) => {
      const tm = mapDoc(doc);
      const teamDoc = await db.collection("teams").doc(tm.team_id).get();
      if (!teamDoc.exists) return null;
      const team = mapDoc(teamDoc);
      team.id = teamDoc.id;
      
      const [oppDoc, membersSnapshot] = await Promise.all([
        team.opportunity_id ? db.collection("opportunities").doc(team.opportunity_id).get() : Promise.resolve(null),
        db.collection("team_members").where("team_id", "==", team.id).get()
      ]);
      
      team.opportunity_title = oppDoc && oppDoc.exists ? mapDoc(oppDoc).title : null;
      team.member_count = membersSnapshot.size;
      team.my_role = tm.role || 'member';
      
      return team;
    }));
    
    teams = teams.filter(t => t !== null);
    
    teams.sort((a, b) => {
      const timeA = a.created_at?.toMillis ? a.created_at.toMillis() : new Date(a.created_at || 0).getTime();
      const timeB = b.created_at?.toMillis ? b.created_at.toMillis() : new Date(b.created_at || 0).getTime();
      return timeB - timeA;
    });

    res.json(teams);
  } catch (err) {
    console.error("Get teams error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Get all public teams (for Teams Home Page)
router.get("/all", auth, async (req, res) => {
  try {
    const teamsSnapshot = await db.collection("teams").where("status", "==", "Recruiting").get();
    
    let teams = await Promise.all(teamsSnapshot.docs.map(async (doc) => {
      const team = mapDoc(doc);
      team.id = doc.id;
      
      const [membersSnapshot, ownerDoc] = await Promise.all([
        db.collection("team_members").where("team_id", "==", team.id).get(),
        db.collection("profiles").doc(team.created_by).get()
      ]);
      
      team.member_count = membersSnapshot.size;
      if (ownerDoc.exists) {
        team.owner_name = mapDoc(ownerDoc).personalInfo?.name || 'Anonymous';
      }

      return team;
    }));
    
    teams.sort((a, b) => {
      const timeA = a.created_at?.toMillis ? a.created_at.toMillis() : new Date(a.created_at || 0).getTime();
      const timeB = b.created_at?.toMillis ? b.created_at.toMillis() : new Date(b.created_at || 0).getTime();
      return timeB - timeA;
    });

    res.json(teams);
  } catch (err) {
    console.error("Get all teams error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Create a team
router.post("/", auth, async (req, res) => {
  const { name, project_title, description, category, required_skills, capacity, status, work_mode, college, logo, tags } = req.body;
  if (!name) return res.status(400).json({ message: "Team name is required." });

  // Generate a random 6-character code
  const join_code = crypto.randomBytes(3).toString("hex").toUpperCase();

  try {
    const newTeamRef = db.collection("teams").doc();
    const team = {
      id: newTeamRef.id,
      name,
      project_title: project_title || '',
      description: description || '',
      category: category || 'General',
      required_skills: required_skills || [],
      tags: tags || [],
      capacity: parseInt(capacity) || 4,
      status: status || 'Recruiting',
      work_mode: work_mode || 'Remote',
      college: college || null,
      logo: logo || null,
      join_code,
      created_by: req.user.id,
      created_at: new Date()
    };
    
    const newMemberRef = db.collection("team_members").doc();
    const memberData = {
      id: newMemberRef.id,
      team_id: team.id,
      user_id: req.user.id,
      role: 'leader',
      joined_at: new Date()
    };

    // Atomic batch write ensuring team and owner membership are written together
    const batch = db.batch();
    batch.set(newTeamRef, team);
    batch.set(newMemberRef, memberData);
    await batch.commit();

    res.json(team);
  } catch (err) {
    console.error("Create team error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Join a team
router.post("/join", auth, async (req, res) => {
  const { join_code } = req.body;
  if (!join_code) return res.status(400).json({ message: "Join code is required." });

  try {
    const teamSnapshot = await db.collection("teams").where("join_code", "==", join_code).get();
    if (teamSnapshot.empty) return res.status(404).json({ message: "Invalid join code." });
    
    const teamDoc = teamSnapshot.docs[0];
    const team_id = teamDoc.id;
    const teamData = mapDoc(teamDoc);

    // Check if already in team
    const checkSnapshot = await db.collection("team_members")
      .where("team_id", "==", team_id)
      .where("user_id", "==", req.user.id)
      .get();
      
    if (!checkSnapshot.empty) return res.status(400).json({ message: "You are already in this team." });

    // Check capacity
    const membersSnapshot = await db.collection("team_members").where("team_id", "==", team_id).get();
    if (teamData.capacity && membersSnapshot.size >= teamData.capacity) {
      return res.status(400).json({ message: "This team is already full." });
    }

    const newMemberRef = db.collection("team_members").doc();
    await newMemberRef.set({
      id: newMemberRef.id,
      team_id,
      user_id: req.user.id,
      role: 'member',
      joined_at: new Date()
    });

    if (teamData.capacity && membersSnapshot.size + 1 >= teamData.capacity) {
      await teamDoc.ref.update({ status: 'Full' });
    }

    res.json({ message: "Successfully joined team!" });
  } catch (err) {
    console.error("Join team error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Get team members
router.get("/:id/members", auth, async (req, res) => {
  try {
    const tmSnapshot = await db.collection("team_members").where("team_id", "==", req.params.id).get();
    
    let members = [];
    for (const doc of tmSnapshot.docs) {
      const tm = mapDoc(doc);
      const studentDoc = await db.collection("profiles").doc(tm.user_id).get();
      let name = 'Unknown User';
      let email = '';
      if (studentDoc.exists) {
        const pd = mapDoc(studentDoc);
        name = pd.personalInfo?.name || 'Anonymous Student';
        email = pd.personalInfo?.email || '';
        members.push({
          id: studentDoc.id,
          name: name,
          email: email,
          role: tm.role || 'member',
          joined_at: tm.joined_at
        });
      }
    }
    
    members.sort((a, b) => {
      const timeA = a.joined_at?.toMillis ? a.joined_at.toMillis() : new Date(a.joined_at || 0).getTime();
      const timeB = b.joined_at?.toMillis ? b.joined_at.toMillis() : new Date(b.joined_at || 0).getTime();
      return timeA - timeB; // Ascending
    });

    res.json(members);
  } catch (err) {
    console.error("Get team members error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Leave a team
router.delete("/:id/leave", auth, async (req, res) => {
  try {
    const memberSnapshot = await db.collection("team_members")
      .where("team_id", "==", req.params.id)
      .where("user_id", "==", req.user.id)
      .get();

    if (memberSnapshot.empty)
      return res.status(404).json({ message: "You are not a member of this team." });

    await memberSnapshot.docs[0].ref.delete();

    res.json({ message: "You have left the team successfully." });
  } catch (err) {
    console.error("Leave team error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ── Intelligent Student-to-Student Complementary Matching ───────────────
router.get("/matches", auth, async (req, res) => {
  try {
    const uid = req.user.id;

    // Fetch requesting user profile
    const myProfileDoc = await db.collection("profiles").doc(uid).get();
    const myP = myProfileDoc.exists ? mapDoc(myProfileDoc) : {};

    const mySkills = (myP.skills || []).map(s => (typeof s === 'string' ? s : s.name || '').toLowerCase()).filter(Boolean);
    const myRole = (myP.desiredRole || myP.careerGoal || '').toLowerCase();
    const myCollege = (myP.education?.college || '').toLowerCase();
    const myInterests = (myP.interests || []).map(i => i.toLowerCase());

    // Fetch candidates
    const studentsSnap = await db.collection("profiles").where("is_active", "==", true).limit(100).get();

    // Fetch user connection statuses
    const myConnsSnap = await db.collection("connections").where("user1", "==", uid).get();
    const myConnsSnap2 = await db.collection("connections").where("user2", "==", uid).get();
    const connectedPeerIds = new Set();
    myConnsSnap.docs.forEach(d => connectedPeerIds.add(d.data().user2));
    myConnsSnap2.docs.forEach(d => connectedPeerIds.add(d.data().user1));

    const outgoingReqsSnap = await db.collection("connection_requests").where("from_user", "==", uid).where("status", "==", "pending").get();
    const pendingToPeerIds = new Set(outgoingReqsSnap.docs.map(d => d.data().to_user));

    const matches = [];

    studentsSnap.docs.forEach(doc => {
      if (doc.id === uid) return; // Exclude self

      const sp = mapDoc(doc);
      const { score, reasons } = calculateMatchScore(myP, sp);

      let connectionStatus = 'none';
      if (connectedPeerIds.has(doc.id)) connectionStatus = 'connected';
      else if (pendingToPeerIds.has(doc.id)) connectionStatus = 'request_sent';

      matches.push({
        id: doc.id,
        name: sp.personalInfo?.name || 'Student Candidate',
        role: sp.desiredRole || (sp.skills?.length > 0 ? `${sp.skills[0]} Developer` : 'Software Developer'),
        college: sp.education?.college || 'Engineering College',
        location: sp.personalInfo?.location || sp.location || 'India',
        skills: (sp.skills || []).slice(0, 4),
        avatar: sp.personalInfo?.avatar || sp.profile_photo || null,
        matchPercentage: score,
        matchReasons: reasons.length > 0 ? reasons : ['✓ Student collaborator'],
        connectionStatus
      });
    });

    matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
    res.json(matches.slice(0, 12));
  } catch (err) {
    console.error("Get matches error:", err);
    res.status(500).json({ message: "Failed to generate matches." });
  }
});

// ── Discover teammates ────────────────────────────────────────────────────
router.get("/discover", auth, async (req, res) => {
  try {
    const { skill, domain, experience, college } = req.query;

    const studentsSnap = await db.collection("profiles")
      .where("is_active", "==", true)
      .get();

    let students = [];
    for (const doc of studentsSnap.docs) {
      const s = mapDoc(doc);
      if (doc.id === req.user.id) continue; // Exclude self

      const sp = s || {};

      students.push({
        id: doc.id,
        name: sp.personalInfo?.name || 'Anonymous Student',
        email: sp.personalInfo?.email || s.email,
        college: sp.education?.college || null,
        branch: sp.education?.branch || null,
        skills: sp.skills || [],
        career_goal: sp.careerGoal || null,
        career_interests: sp.interests || [],
        experience_level: sp.experienceLevel || null,
        bio: sp.bio || null,
        github_url: sp.socialLinks?.github || null,
        linkedin_url: sp.socialLinks?.linkedin || null,
        profile_completion: sp.profileCompletion || 0,
      });
    }

    // Apply filters
    if (skill) {
      const skillLower = skill.toLowerCase();
      students = students.filter(s => s.skills.some(sk => sk.toLowerCase().includes(skillLower)));
    }
    if (domain) {
      const domainLower = domain.toLowerCase();
      students = students.filter(s =>
        (s.career_interests || []).some(i => i.toLowerCase().includes(domainLower)) ||
        (s.career_goal || '').toLowerCase().includes(domainLower)
      );
    }
    if (experience) {
      students = students.filter(s => s.experience_level === experience);
    }
    if (college) {
      const collegeLower = college.toLowerCase();
      students = students.filter(s => (s.college || '').toLowerCase().includes(collegeLower));
    }

    // Sort by profile completeness
    students.sort((a, b) => b.profile_completion - a.profile_completion);

    res.json(students.slice(0, 50));
  } catch (err) {
    console.error("Discover error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ── Team discussions ──────────────────────────────────────────────────────
router.post("/:id/discussions", auth, async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ message: "Message is required." });

  try {
    // Verify user is a member
    const memberCheck = await db.collection("team_members")
      .where("team_id", "==", req.params.id)
      .where("user_id", "==", req.user.id)
      .get();
    if (memberCheck.empty) return res.status(403).json({ message: "You are not a member of this team." });

    const studentDoc = await db.collection("profiles").doc(req.user.id).get();
    const s = studentDoc.exists ? mapDoc(studentDoc) : {};
    const userName = s.personalInfo?.name || 'Anonymous';

    const msgRef = db.collection("team_discussions").doc();
    const msg = {
      id: msgRef.id,
      team_id: req.params.id,
      user_id: req.user.id,
      user_name: userName,
      message: message.trim(),
      created_at: new Date()
    };
    await msgRef.set(msg);

    if (req.io) {
      req.io.to(`team_${req.params.id}`).emit('new_team_message', msg);
    }

    res.json(msg);
  } catch (err) {
    console.error("Discussion post error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

router.get("/:id/discussions", auth, async (req, res) => {
  try {
    const snap = await db.collection("team_discussions")
      .where("team_id", "==", req.params.id)
      .get();

    const messages = snap.docs.map(doc => {
      const d = mapDoc(doc);
      return {
        ...d,
        created_at: d.created_at?.toDate ? d.created_at.toDate() : d.created_at,
      };
    });

    messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    res.json(messages.slice(-50)); // Last 50 messages
  } catch (err) {
    console.error("Discussion get error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ── Update team metadata ──────────────────────────────────────────────────
router.put("/:id", auth, async (req, res) => {
  const { description, required_skills, capacity, status } = req.body;
  try {
    const checkSnapshot = await db.collection("team_members")
      .where("team_id", "==", req.params.id)
      .where("user_id", "==", req.user.id)
      .get();
    if (checkSnapshot.empty || mapDoc(checkSnapshot.docs[0]).role !== 'leader') {
      return res.status(403).json({ message: "Only team leaders can update team details." });
    }

    const updateData = {};
    if (description !== undefined) updateData.description = description;
    if (required_skills !== undefined) updateData.required_skills = required_skills;
    if (capacity !== undefined) updateData.capacity = parseInt(capacity);
    if (status !== undefined) updateData.status = status;

    await db.collection("teams").doc(req.params.id).update(updateData);
    res.json({ message: "Team updated successfully." });
  } catch (err) {
    console.error("Update team error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ── Manage team members ───────────────────────────────────────────────────
router.put("/:id/members/:userId/role", auth, async (req, res) => {
  const { role } = req.body;
  if (!['leader', 'member', 'mentor'].includes(role)) {
    return res.status(400).json({ message: "Invalid role." });
  }

  try {
    const leaderCheck = await db.collection("team_members")
      .where("team_id", "==", req.params.id)
      .where("user_id", "==", req.user.id)
      .get();
    if (leaderCheck.empty || mapDoc(leaderCheck.docs[0]).role !== 'leader') {
      return res.status(403).json({ message: "Only team leaders can change roles." });
    }

    const memberCheck = await db.collection("team_members")
      .where("team_id", "==", req.params.id)
      .where("user_id", "==", req.params.userId)
      .get();
    if (memberCheck.empty) return res.status(404).json({ message: "Member not found." });

    await memberCheck.docs[0].ref.update({ role });
    res.json({ message: "Role updated successfully." });
  } catch (err) {
    console.error("Update role error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

router.delete("/:id/members/:userId", auth, async (req, res) => {
  try {
    const leaderCheck = await db.collection("team_members")
      .where("team_id", "==", req.params.id)
      .where("user_id", "==", req.user.id)
      .get();
    if (leaderCheck.empty || mapDoc(leaderCheck.docs[0]).role !== 'leader') {
      return res.status(403).json({ message: "Only team leaders can remove members." });
    }

    const memberCheck = await db.collection("team_members")
      .where("team_id", "==", req.params.id)
      .where("user_id", "==", req.params.userId)
      .get();
    if (memberCheck.empty) return res.status(404).json({ message: "Member not found." });

    if (req.params.userId === req.user.id) {
      return res.status(400).json({ message: "You cannot remove yourself using this endpoint. Use leave team instead." });
    }

    await memberCheck.docs[0].ref.delete();
    res.json({ message: "Member removed successfully." });
  } catch (err) {
    console.error("Remove member error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ── AI Recommendations ──────────────────────────────────────────────────────
router.get("/:id/recommendations", auth, async (req, res) => {
  try {
    const teamDoc = await db.collection("teams").doc(req.params.id).get();
    if (!teamDoc.exists) return res.status(404).json({ message: "Team not found" });
    const team = mapDoc(teamDoc);
    
    const reqSkills = team.required_skills || [];
    if (reqSkills.length === 0) return res.json([]);

    const profilesSnap = await db.collection("profiles").get();
    const recommendations = [];

    profilesSnap.forEach(doc => {
      const p = mapDoc(doc);
      if (!p.skills) return;
      // Match if the user's skill names match any required skills (case-insensitive)
      const userSkillNames = p.skills.map(s => (s.name || s).toLowerCase());
      const matchCount = reqSkills.filter(rs => userSkillNames.includes(rs.toLowerCase())).length;
      
      if (matchCount > 0 && doc.id !== req.user.id) {
        recommendations.push({
          id: doc.id,
          name: p.personalInfo?.name || "Student",
          skills: p.skills,
          matchScore: Math.round((matchCount / reqSkills.length) * 100),
          avatar: p.personalInfo?.avatar || null
        });
      }
    });

    recommendations.sort((a, b) => b.matchScore - a.matchScore);
    res.json(recommendations.slice(0, 10));
  } catch (err) {
    console.error("AI recommendations error:", err.message);
    res.status(500).json({ message: "Server error fetching recommendations." });
  }
});

// ── Team Invitations Endpoints ──────────────────────────────────────────
// GET my pending team invites
router.get("/invites/my", auth, async (req, res) => {
  try {
    const snapshot = await db.collection("team_invites")
      .where("to_user", "==", req.user.id)
      .where("status", "==", "pending")
      .get();
      
    const invites = await Promise.all(snapshot.docs.map(async doc => {
      const d = mapDoc(doc);
      const teamDoc = await db.collection("teams").doc(d.team_id).get();
      const teamData = teamDoc.exists ? mapDoc(teamDoc) : { name: "Team" };
      const senderDoc = await db.collection("profiles").doc(d.from_user).get();
      const senderData = senderDoc.exists ? mapDoc(senderDoc) : {};

      return {
        id: doc.id,
        ...d,
        team_name: teamData.name,
        team_project: teamData.project_title || teamData.description,
        sender_name: senderData.personalInfo?.name || "Team Leader",
        sender_avatar: senderData.personalInfo?.avatar || null
      };
    }));

    res.json(invites);
  } catch (err) {
    console.error("Get invites error:", err.message);
    res.status(500).json({ message: "Server error fetching invitations." });
  }
});

// POST accept invite
router.post("/invites/:id/accept", auth, async (req, res) => {
  try {
    const inviteRef = db.collection("team_invites").doc(req.params.id);
    const inviteDoc = await inviteRef.get();

    if (!inviteDoc.exists) return res.status(404).json({ message: "Invitation not found." });
    const invite = mapDoc(inviteDoc);
    if (invite.to_user !== req.user.id) return res.status(403).json({ message: "Unauthorized." });

    // Check team capacity
    const teamDoc = await db.collection("teams").doc(invite.team_id).get();
    if (!teamDoc.exists) return res.status(404).json({ message: "Team no longer exists." });
    const team = mapDoc(teamDoc);

    const membersSnap = await db.collection("team_members").where("team_id", "==", invite.team_id).get();
    if (membersSnap.size >= (team.capacity || 5)) {
      return res.status(400).json({ message: "Team has reached maximum member capacity." });
    }

    // Check existing membership
    const existingMember = membersSnap.docs.find(d => d.data().user_id === req.user.id);
    if (!existingMember) {
      const newMemberRef = db.collection("team_members").doc();
      await newMemberRef.set({
        id: newMemberRef.id,
        team_id: invite.team_id,
        user_id: req.user.id,
        role: "member",
        joined_at: new Date()
      });
    }

    await inviteRef.update({ status: "accepted", accepted_at: new Date() });
    res.json({ message: "Invitation accepted! Welcome to the team." });
  } catch (err) {
    console.error("Accept invite error:", err.message);
    res.status(500).json({ message: "Server error accepting invitation." });
  }
});

// POST reject invite
router.post("/invites/:id/reject", auth, async (req, res) => {
  try {
    const inviteRef = db.collection("team_invites").doc(req.params.id);
    const inviteDoc = await inviteRef.get();

    if (!inviteDoc.exists) return res.status(404).json({ message: "Invitation not found." });
    const invite = mapDoc(inviteDoc);
    if (invite.to_user !== req.user.id) return res.status(403).json({ message: "Unauthorized." });

    await inviteRef.update({ status: "rejected", rejected_at: new Date() });
    res.json({ message: "Invitation declined." });
  } catch (err) {
    console.error("Reject invite error:", err.message);
    res.status(500).json({ message: "Server error declining invitation." });
  }
});

module.exports = router;
