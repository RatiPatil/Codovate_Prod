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

// GET all colleges
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const snapshot = await db.collection("colleges").get();
    const colleges = [];

    snapshot.docs.forEach(doc => {
      const c = doc.data();
      colleges.push({
        id: doc.id,
        name: c.name || "Unknown College",
        district: c.district || "—",
        students: c.students || 0,
        participation: c.participation || 0,
        placements: c.placements || 0,
        projects: c.projects || 0,
        certs: c.certs || 0,
        created_at: c.created_at ? (typeof c.created_at.toDate === "function" ? c.created_at.toDate().toISOString() : new Date(c.created_at).toISOString()) : null
      });
    });

    res.json(colleges);
  } catch (err) {
    console.error("Colleges fetch error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// POST new college manually
router.post("/", auth, adminOnly, async (req, res) => {
  const { name, district } = req.body;
  if (!name) return res.status(400).json({ message: "College name is required." });

  try {
    const newCollegeRef = db.collection("colleges").doc();
    const data = {
      id: newCollegeRef.id,
      name,
      district: district || "",
      students: 0,
      participation: 0,
      placements: 0,
      projects: 0,
      certs: 0,
      created_at: new Date()
    };

    await newCollegeRef.set(data);

    // Optional: Log audit
    if (req.user) {
      await db.collection("audit_logs").add({
        actor_id: req.user.id,
        actor_email: req.user.email || "admin",
        action: "COLLEGE_CREATED",
        module: "colleges",
        entity_id: newCollegeRef.id,
        details: { name },
        created_at: new Date()
      });
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
