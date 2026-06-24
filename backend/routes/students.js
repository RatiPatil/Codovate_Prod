const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");

router.get("/profile", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
              s.college, s.branch, s.year, s.skills
       FROM users u
       LEFT JOIN students s ON u.id = s.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get profile error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

router.put("/profile", auth, async (req, res) => {
  const { name, college, branch, year, skills } = req.body;

  try {
    await pool.query("UPDATE users SET name = $1 WHERE id = $2", [name, req.user.id]);
    await pool.query(
      "UPDATE students SET college = $1, branch = $2, year = $3, skills = $4 WHERE user_id = $5",
      [college, branch, year || null, skills || [], req.user.id]
    );

    res.json({ message: "Profile updated successfully." });
  } catch (err) {
    console.error("Update profile error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;