const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");

router.post("/save", auth, async (req, res) => {
  try {
    const {
      full_name, phone, city,
      college, branch, year,
      career_goal, career_interests, experience_level,
      skills,
      portfolio_url, github_url, linkedin_url, bio,
      profile_completion, onboarding_completed,
    } = req.body;

    console.log("📥 Saving onboarding for user:", req.user.id);

    // Update name in users table
    if (full_name) {
      await pool.query(
        "UPDATE users SET name = $1 WHERE id = $2",
        [full_name, req.user.id]
      );
    }

    // Make sure student row exists
    const check = await pool.query(
      "SELECT id FROM students WHERE user_id = $1",
      [req.user.id]
    );
    if (check.rows.length === 0) {
      await pool.query(
        "INSERT INTO students (user_id) VALUES ($1)",
        [req.user.id]
      );
    }

    // Clean the values
    const cleanYear = year ? parseInt(year) : null;
    const cleanCompletion = profile_completion !== undefined && profile_completion !== "" 
      ? parseInt(profile_completion) 
      : null;
    const cleanInterests = Array.isArray(career_interests) && career_interests.length > 0 
      ? career_interests 
      : null;
    const cleanSkills = Array.isArray(skills) && skills.length > 0 
      ? skills 
      : null;

    await pool.query(
      `UPDATE students SET
        full_name         = COALESCE($1,  full_name),
        phone             = COALESCE($2,  phone),
        city              = COALESCE($3,  city),
        college           = COALESCE($4,  college),
        branch            = COALESCE($5,  branch),
        year              = COALESCE($6,  year),
        career_goal       = COALESCE($7,  career_goal),
        career_interests  = COALESCE($8,  career_interests),
        experience_level  = COALESCE($9,  experience_level),
        skills            = COALESCE($10, skills),
        portfolio_url     = COALESCE($11, portfolio_url),
        github_url        = COALESCE($12, github_url),
        linkedin_url      = COALESCE($13, linkedin_url),
        bio               = COALESCE($14, bio),
        profile_completion   = COALESCE($15, profile_completion),
        onboarding_completed = COALESCE($16, onboarding_completed)
      WHERE user_id = $17`,
      [
        full_name        || null,
        phone            || null,
        city             || null,
        college          || null,
        branch           || null,
        cleanYear,
        career_goal      || null,
        cleanInterests,
        experience_level || null,
        cleanSkills,
        portfolio_url    || null,
        github_url       || null,
        linkedin_url     || null,
        bio              || null,
        cleanCompletion,
        onboarding_completed !== undefined ? onboarding_completed : null,
        req.user.id,
      ]
    );

    console.log("✅ Onboarding saved successfully");
    res.json({ message: "Saved successfully.", profile_completion: cleanCompletion });

  } catch (err) {
    console.error("❌ Onboarding save error:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

router.get("/status", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.onboarding_completed, s.profile_completion, u.name, u.email
       FROM students s
       JOIN users u ON u.id = s.user_id
       WHERE s.user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({ onboarding_completed: false, profile_completion: 0 });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Status error:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;