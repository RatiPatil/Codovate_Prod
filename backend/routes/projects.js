const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

const adminOnly = (req, res, next) => {
  if (!["admin", "super_admin", "college_admin", "company_admin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
};

// GET all projects for admin moderation
router.get("/admin", auth, adminOnly, async (req, res) => {
  try {
    const snapshot = await db.collection("projects").get();
    const projects = [];

    snapshot.docs.forEach(doc => {
      const p = doc.data();
      projects.push({
        id: doc.id,
        title: p.title || "Untitled Project",
        author: p.author_name || "Unknown Author",
        college: p.college_name || "—",
        tech: p.tech_stack || "—",
        likes: p.likes || 0,
        status: p.status || "pending",
        is_featured: p.is_featured || false,
        created_at: p.created_at ? (typeof p.created_at.toDate === "function" ? p.created_at.toDate().toISOString() : new Date(p.created_at).toISOString()) : null
      });
    });

    // Sort by latest
    projects.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    res.json(projects);
  } catch (err) {
    console.error("Projects fetch error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// PUT update project status or feature flag
router.put("/:id/status", auth, adminOnly, async (req, res) => {
  const { status, is_featured } = req.body;
  
  try {
    const projRef = db.collection("projects").doc(req.params.id);
    const doc = await projRef.get();
    if (!doc.exists) return res.status(404).json({ message: "Project not found." });

    const update = {};
    if (status !== undefined) update.status = status;
    if (is_featured !== undefined) update.is_featured = is_featured;

    await projRef.update(update);

    await db.collection("audit_logs").add({
      actor_id: req.user.id,
      actor_email: req.user.email || "admin",
      action: "PROJECT_MODERATED",
      module: "projects",
      entity_id: req.params.id,
      details: { title: doc.data().title, ...update },
      created_at: new Date()
    });

    res.json({ message: `Project updated.` });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
