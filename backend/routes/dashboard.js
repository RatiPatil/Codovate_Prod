const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");
const { syncDashboard } = require("../services/dashboardService");

// ─── GET /api/dashboard ────────────────────────────────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const doc = await db.collection("dashboard").doc(req.user.id).get();
    
    // If it doesn't exist yet, we trigger a sync and wait for it
    if (!doc.exists) {
      await syncDashboard(req.user.id);
      const newDoc = await db.collection("dashboard").doc(req.user.id).get();
      return res.json(newDoc.data());
    }

    res.json(doc.data());
  } catch (err) {
    console.error("Fetch dashboard error:", err);
    res.status(500).json({ message: "Failed to load dashboard." });
  }
});

// ─── POST /api/dashboard/sync ─────────────────────────────────────────────
router.post("/sync", auth, async (req, res) => {
  try {
    // Explicit sync endpoint if frontend wants to force refresh
    await syncDashboard(req.user.id);
    res.json({ success: true, message: "Dashboard synced successfully." });
  } catch (err) {
    res.status(500).json({ message: "Sync failed." });
  }
});

module.exports = router;
