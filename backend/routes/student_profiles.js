const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

router.get("/profile", auth, async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found." });
    }

    const u = userDoc.data();
    const profileDoc = await db.collection("student_profiles").doc(req.user.id).get();
    const sp = profileDoc.exists ? profileDoc.data() : {};

    res.json({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      created_at: u.created_at,
      ...sp // Spread all student_profiles fields
    });
  } catch (err) {
    console.error("Get profile error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

router.put("/profile", auth, async (req, res) => {
  const { name, college, branch, year, skills } = req.body;

  try {
    if (name) {
      await db.collection("users").doc(req.user.id).update({ name });
    }

    const updateData = {
      college,
      branch,
      year: year || null,
      skills: skills || []
    };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await db.collection("student_profiles").doc(req.user.id).set(updateData, { merge: true });

    res.json({ message: "Profile updated successfully." });
  } catch (err) {
    console.error("Update profile error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;