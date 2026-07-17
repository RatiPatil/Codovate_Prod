const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");
const { syncDashboard } = require("../services/dashboardService");

// ─── GET /api/skills ───────────────────────────────────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const doc = await db.collection("skills").doc(req.user.id).get();
    if (!doc.exists) {
      return res.json({ technical: [], soft: [], tools: [], languages: [] });
    }
    res.json(doc.data());
  } catch (err) {
    console.error("Fetch skills error:", err);
    res.status(500).json({ message: "Failed to load skills." });
  }
});

// ─── PUT /api/skills ──────────────────────────────────────────────────────
router.put("/", auth, async (req, res) => {
  try {
    const { technical, soft, tools, languages } = req.body;
    
    const skillsRef = db.collection("skills").doc(req.user.id);
    const updateData = { updatedAt: new Date() };
    
    if (technical !== undefined) updateData.technical = technical;
    if (soft !== undefined) updateData.soft = soft;
    if (tools !== undefined) updateData.tools = tools;
    if (languages !== undefined) updateData.languages = languages;

    await skillsRef.set(updateData, { merge: true });
    
    // Also sync to the old profile structure if necessary for legacy reasons
    const profileRef = db.collection("profiles").doc(req.user.id);
    const pDoc = await profileRef.get();
    if (pDoc.exists) {
      const existingSkills = pDoc.data().skills || [];
      // This is a naive merge, but helps keep legacy endpoints alive.
      // In a strict migration, we might replace this entirely.
      const newLegacySkills = [...new Set([...existingSkills, ...(technical || []), ...(tools || [])])];
      await profileRef.set({ skills: newLegacySkills }, { merge: true });
    }

    // Async sync dashboard
    syncDashboard(req.user.id);

    res.json({ message: "Skills updated successfully." });
  } catch (err) {
    console.error("Save skills error:", err);
    res.status(500).json({ message: "Failed to save skills." });
  }
});

module.exports = router;
