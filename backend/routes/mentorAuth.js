const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { db } = require("../config/firebase");
require("dotenv").config();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required." });

  try {
    const mentorsRef = db.collection('mentors');
    const snapshot = await mentorsRef.where('email', '==', email.toLowerCase()).get();

    if (snapshot.empty)
      return res.status(401).json({ message: "Invalid email or password." });

    const mentor = snapshot.docs[0].data();

    if (!mentor.is_active)
      return res.status(403).json({ message: "Your account has been suspended. Please contact the administrator." });

    if (!mentor.password_hash)
      return res.status(401).json({ message: "Invalid email or password." });

    const match = await bcrypt.compare(password, mentor.password_hash);
    if (!match)
      return res.status(401).json({ message: "Invalid email or password." });

    await mentorsRef.doc(mentor.id).update({ last_login_at: new Date() });

    await db.collection('audit_logs').add({
      actor_id: mentor.id,
      actor_email: mentor.email,
      action: 'MENTOR_LOGIN',
      module: 'auth',
      entity_id: null,
      details: { role: 'mentor' },
      created_at: new Date(),
    });

    const token = jwt.sign(
      { id: mentor.id, role: 'mentor' },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: mentor.id,
        name: mentor.name,
        email: mentor.email,
        avatar: mentor.avatar || mentor.profile_photo || null,
        role: 'mentor',
      }
    });
  } catch (err) {
    console.error("Mentor login error:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;
