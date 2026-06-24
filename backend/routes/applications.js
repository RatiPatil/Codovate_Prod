const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");

// POST /api/applications — Apply to opportunity
router.post("/", auth, async (req, res) => {
  const { opportunity_id } = req.body;

  if (!opportunity_id) {
    return res.status(400).json({ message: "Opportunity ID is required." });
  }

  try {
    // Get opportunity details
    const opp = await pool.query(
      "SELECT * FROM opportunities WHERE id = $1",
      [opportunity_id]
    );
    if (opp.rows.length === 0) {
      return res.status(404).json({ message: "Opportunity not found." });
    }

    // Get user details
    const user = await pool.query(
      "SELECT name, email FROM users WHERE id = $1",
      [req.user.id]
    );

    const result = await pool.query(
      `INSERT INTO applications (user_id, opportunity_id, status)
       VALUES ($1, $2, 'Applied') RETURNING *`,
      [req.user.id, opportunity_id]
    );

    const application = result.rows[0];

    // Emit real-time event to the user
    req.io.to(`user_${req.user.id}`).emit("application_update", {
      type: "new_application",
      application: {
        ...application,
        title: opp.rows[0].title,
        company: opp.rows[0].company,
        type: opp.rows[0].type,
      },
    });

    // Emit to global room (for admin/stats)
    req.io.to("global").emit("stats_update", {
      type: "new_application",
      user: user.rows[0].name,
      opportunity: opp.rows[0].title,
      timestamp: new Date(),
    });

    console.log(`✅ ${user.rows[0].name} applied to ${opp.rows[0].title}`);
    res.status(201).json(result.rows[0]);

  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "You already applied to this opportunity." });
    }
    console.error("Apply error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/applications/my
router.get("/my", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.id, a.status, a.applied_at, a.opportunity_id,
              o.title, o.type, o.company, o.deadline
       FROM applications a
       JOIN opportunities o ON a.opportunity_id = o.id
       WHERE a.user_id = $1
       ORDER BY a.applied_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get applications error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/applications/stats
router.get("/stats", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'Applied' THEN 1 END) as applied,
        COUNT(CASE WHEN status = 'Selected' THEN 1 END) as selected,
        COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected
       FROM applications
       WHERE user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Stats error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;