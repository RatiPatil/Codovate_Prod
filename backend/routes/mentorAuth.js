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

const auth = require('../middleware/auth');

router.get("/me", auth, async (req, res) => {
  if (req.user.role !== 'mentor') return res.status(403).json({ message: 'Forbidden' });
  try {
    const doc = await db.collection('mentors').doc(req.user.id).get();
    if (!doc.exists) return res.status(404).json({ message: 'Mentor not found' });
    const { password_hash, ...safeData } = doc.data();
    res.json(safeData);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put("/profile", auth, async (req, res) => {
  if (req.user.role !== 'mentor') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { name, mobile, designation, company, experience, bio } = req.body;
    await db.collection('mentors').doc(req.user.id).update({
      name, mobile, designation, company, experience, bio
    });
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post("/change-password", auth, async (req, res) => {
  if (req.user.role !== 'mentor') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { current_password, new_password } = req.body;
    const doc = await db.collection('mentors').doc(req.user.id).get();
    if (!doc.exists) return res.status(404).json({ message: 'Mentor not found' });
    
    const mentor = doc.data();
    const match = await bcrypt.compare(current_password, mentor.password_hash);
    if (!match) return res.status(400).json({ message: 'Incorrect current password' });
    
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);
    
    await db.collection('mentors').doc(req.user.id).update({ password_hash });
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
