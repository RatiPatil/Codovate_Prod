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
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email.toLowerCase()).where('role', '==', 'mentor').get();

    if (snapshot.empty)
      return res.status(401).json({ message: "Invalid email or password." });

    const user = snapshot.docs[0].data();

    if (!user.is_active)
      return res.status(403).json({ message: "Your account has been suspended. Please contact the administrator." });

    if (!user.password_hash)
      return res.status(401).json({ message: "Invalid email or password." });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ message: "Invalid email or password." });

    await usersRef.doc(user.id).update({ last_login_at: new Date() });

    await db.collection('audit_logs').add({
      actor_id: user.id,
      actor_email: user.email,
      action: 'MENTOR_LOGIN',
      module: 'auth',
      entity_id: null,
      details: { role: user.role },
      created_at: new Date(),
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      }
    });
  } catch (err) {
    console.error("Mentor login error:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;
