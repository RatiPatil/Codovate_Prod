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

// Create a team
router.post("/", auth, async (req, res) => {
  const { name, opportunity_id } = req.body;
  if (!name) return res.status(400).json({ message: "Team name is required." });

  // Generate a random 6-character code
  const join_code = crypto.randomBytes(3).toString("hex").toUpperCase();

  try {
    const newTeamRef = db.collection("teams").doc();
    const team = {
      id: newTeamRef.id,
      name,
      join_code,
      opportunity_id: opportunity_id || null,
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
    
    const team_id = teamSnapshot.docs[0].id;

    // Check if already in team
    const checkSnapshot = await db.collection("team_members")
      .where("team_id", "==", team_id)
      .where("user_id", "==", req.user.id)
      .get();
      
    if (!checkSnapshot.empty) return res.status(400).json({ message: "You are already in this team." });

    const newMemberRef = db.collection("team_members").doc();
    await newMemberRef.set({
      id: newMemberRef.id,
      team_id,
      user_id: req.user.id,
      joined_at: new Date()
    });

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
      const userDoc = await db.collection("users").doc(tm.user_id).get();
      if (userDoc.exists) {
        members.push({
          id: userDoc.id,
          name: userDoc.data().name,
          email: userDoc.data().email,
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

module.exports = router;
