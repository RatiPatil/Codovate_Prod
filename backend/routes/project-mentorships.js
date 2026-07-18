const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

// Invite a mentor to a project
router.post("/invite", auth, async (req, res) => {
  try {
    const { project_id, mentor_id, message } = req.body;
    if (!project_id || !mentor_id) {
      return res.status(400).json({ message: "Project ID and Mentor ID are required." });
    }

    // Ensure project belongs to student
    const projectDoc = await db.collection("projects").doc(project_id).get();
    if (!projectDoc.exists || projectDoc.data().userId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized or project not found." });
    }

    const inviteRef = db.collection("project_mentorships").doc();
    const inviteData = {
      id: inviteRef.id,
      project_id,
      project_title: projectDoc.data().title,
      student_id: req.user.id,
      student_name: req.user.name,
      mentor_id,
      message: message || "Please review my project.",
      status: 'Pending', // Pending, Reviewed, Approved
      feedback: '',
      created_at: new Date(),
      updated_at: new Date()
    };

    await inviteRef.set(inviteData);
    res.status(201).json(inviteData);
  } catch (err) {
    console.error("Invite mentor error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// Get all project mentorships for a mentor
router.get("/mentor", auth, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ message: "Mentor access required." });
    }

    // Get the mentor document for this user
    const mentorDocs = await db.collection("mentors").where("user_id", "==", req.user.id).get();
    if (mentorDocs.empty) return res.json([]);
    const mentorId = mentorDocs.docs[0].id;

    const snapshot = await db.collection("project_mentorships")
      .where("mentor_id", "==", mentorId)
      .orderBy("updated_at", "desc")
      .get();

    const invites = await Promise.all(snapshot.docs.map(async doc => {
      const data = doc.data();
      // Fetch full project data
      const pDoc = await db.collection("projects").doc(data.project_id).get();
      data.project = pDoc.exists ? pDoc.data() : null;
      return data;
    }));

    res.json(invites);
  } catch (err) {
    console.error("Get mentor projects error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// Review/Approve a project (Mentor only)
router.put("/:id/review", auth, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ message: "Mentor access required." });
    }

    const { status, feedback } = req.body;
    if (!['Reviewed', 'Approved'].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be Reviewed or Approved." });
    }

    const mentorshipRef = db.collection("project_mentorships").doc(req.params.id);
    const mDoc = await mentorshipRef.get();
    if (!mDoc.exists) {
      return res.status(404).json({ message: "Mentorship request not found." });
    }

    await mentorshipRef.update({
      status,
      feedback: feedback || '',
      updated_at: new Date()
    });

    res.json({ message: "Project reviewed successfully." });
  } catch (err) {
    console.error("Review project error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
