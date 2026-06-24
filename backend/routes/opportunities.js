const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");

// GET /api/opportunities
router.get("/", auth, async (req, res) => {
  try {
    const { type } = req.query;
    let query = "SELECT * FROM opportunities ORDER BY created_at DESC";
    let params = [];

    if (type && type !== "All") {
      query = "SELECT * FROM opportunities WHERE type = $1 ORDER BY created_at DESC";
      params = [type];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Get opportunities error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/opportunities/:id
router.get("/:id", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM opportunities WHERE id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Opportunity not found." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get opportunity error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;