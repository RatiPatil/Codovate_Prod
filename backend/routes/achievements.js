const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

// ─── GET /api/achievements ─────────────────────────────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const snapshot = await db.collection("achievements")
      .where("uid", "==", req.user.id)
      .orderBy("earnedAt", "desc")
      .get();
      
    const achievements = snapshot.docs.map(doc => doc.data());
    res.json(achievements);
  } catch (err) {
    console.error("Fetch achievements error:", err);
    res.status(500).json({ message: "Failed to load achievements." });
  }
});

// ─── POST /api/achievements/award ──────────────────────────────────────────
// WARNING: This is currently exposed to any authenticated user for demonstration.
// In a production environment, this MUST be locked down to admin roles or internal system calls.
router.post("/award", auth, async (req, res) => {
  try {
    const { uid, badge, title, description, icon } = req.body;
    
    // In a real scenario, we'd verify req.user.role === 'admin'
    // if (req.user.role !== 'admin') return res.status(403).json({ message: "Forbidden" });

    const targetUid = uid || req.user.id;
    if (!badge || !title) {
      return res.status(400).json({ message: "Badge and title are required." });
    }

    const achRef = db.collection("achievements").doc();
    const achievement = {
      achievementId: achRef.id,
      uid: targetUid,
      badge,
      title,
      description: description || "",
      icon: icon || "",
      earnedAt: new Date()
    };
    
    await achRef.set(achievement);
    res.status(201).json({ message: "Achievement awarded successfully.", achievement });
  } catch (err) {
    console.error("Award achievement error:", err);
    res.status(500).json({ message: "Failed to award achievement." });
  }
});

module.exports = router;
