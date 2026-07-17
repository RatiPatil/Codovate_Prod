const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

// ─── GET /api/activity ───────────────────────────────────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const snapshot = await db.collection("activityLogs")
      .where("uid", "==", req.user.id)
      .orderBy("createdAt", "desc")
      .limit(50) // Pagination limit to keep response fast
      .get();
      
    const logs = snapshot.docs.map(doc => doc.data());
    res.json(logs);
  } catch (err) {
    console.error("Fetch activity logs error:", err);
    res.status(500).json({ message: "Failed to load activity timeline." });
  }
});

// ─── POST /api/activity ──────────────────────────────────────────────────────
router.post("/", auth, async (req, res) => {
  try {
    const { type, title, description, metadata } = req.body;
    
    if (!type || !title) {
      return res.status(400).json({ message: "Type and title are required." });
    }

    const logRef = db.collection("activityLogs").doc();
    const logData = {
      activityId: logRef.id,
      uid: req.user.id,
      type,
      title,
      description: description || "",
      metadata: metadata || {},
      createdAt: new Date()
    };
    
    await logRef.set(logData);
    res.status(201).json({ message: "Activity logged successfully.", log: logData });
  } catch (err) {
    console.error("Create activity log error:", err);
    res.status(500).json({ message: "Failed to create activity log." });
  }
});

module.exports = router;
