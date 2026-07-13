const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");
const crypto = require("crypto");

// Get user's teams
router.get("/my", auth, async (req, res) => {
  try {
    const tmSnapshot = await db.collection("team_members").where("user_id", "==", req.user.id).get();
    
    let teams = [];
    for (const doc of tmSnapshot.docs) {
      const tm = doc.data();
      const teamDoc = await db.collection("teams").doc(tm.team_id).get();
      if (!teamDoc.exists) continue;
      const team = teamDoc.data();
      team.id = teamDoc.id;
      
      const oppDoc = team.opportunity_id ? await db.collection("opportunities").doc(team.opportunity_id).get() : null;
      team.opportunity_title = oppDoc && oppDoc.exists ? oppDoc.data().title : null;
      
      const membersSnapshot = await db.collection("team_members").where("team_id", "==", team.id).get();
      team.member_count = membersSnapshot.size;
      team.my_role = tm.role || 'member';
      
      teams.push(team);
    }
    
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
    
    let teams = [];
    for (const doc of teamsSnapshot.docs) {
      const team = doc.data();
      team.id = doc.id;
      
      const membersSnapshot = await db.collection("team_members").where("team_id", "==", team.id).get();
      team.member_count = membersSnapshot.size;
      
      // Get owner info
      const ownerDoc = await db.collection("students").doc(team.created_by).get();
      if (ownerDoc.exists) {
        team.owner_name = ownerDoc.data().name || ownerDoc.data().full_name || 'Anonymous';
      }

      teams.push(team);
    }
    
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
    
    await newTeamRef.set(team);

    // Add creator as member
    const newMemberRef = db.collection("team_members").doc();
    await newMemberRef.set({
      id: newMemberRef.id,
      team_id: team.id,
      user_id: req.user.id,
      role: 'leader',
      joined_at: new Date()
    });

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
    const teamData = teamDoc.data();

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
      const tm = doc.data();
      const studentDoc = await db.collection("students").doc(tm.user_id).get();
      if (studentDoc.exists) {
        const s = studentDoc.data();
        const sp = s.profile_data || {};
        members.push({
          id: studentDoc.id,
          name: sp.name || 'Anonymous Student',
          email: s.email,
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

// ── Discover teammates ────────────────────────────────────────────────────
router.get("/discover", auth, async (req, res) => {
  try {
    const { skill, domain, experience, college } = req.query;

    const studentsSnap = await db.collection("students")
      .where("is_active", "==", true)
      .get();

    let students = [];
    for (const doc of studentsSnap.docs) {
      const s = doc.data();
      if (doc.id === req.user.id) continue; // Exclude self

      const sp = s.profile_data || {};

      students.push({
        id: doc.id,
        name: sp.name || 'Anonymous Student',
        email: s.email,
        college: sp.college || null,
        branch: sp.branch || null,
        skills: sp.skills || [],
        career_goal: sp.career_goal || null,
        career_interests: sp.career_interests || [],
        experience_level: sp.experience_level || null,
        bio: sp.bio || null,
        github_url: sp.github_url || null,
        linkedin_url: sp.linkedin_url || null,
        profile_completion: sp.profile_completion || 0,
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

    const studentDoc = await db.collection("students").doc(req.user.id).get();
    const s = studentDoc.exists ? studentDoc.data() : {};
    const sp = s.profile_data || {};
    const userName = sp.name || 'Anonymous';

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
      const d = doc.data();
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
    if (checkSnapshot.empty || checkSnapshot.docs[0].data().role !== 'leader') {
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
    if (leaderCheck.empty || leaderCheck.docs[0].data().role !== 'leader') {
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
    if (leaderCheck.empty || leaderCheck.docs[0].data().role !== 'leader') {
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

module.exports = router;
