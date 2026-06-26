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

// GET all companies
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const snapshot = await db.collection("companies").get();
    const companies = [];

    snapshot.docs.forEach(doc => {
      const c = doc.data();
      companies.push({
        id: doc.id,
        name: c.name || "Unknown Company",
        status: c.status || "pending",
        jobs: c.jobs || 0,
        internships: c.internships || 0,
        applications: c.applications || 0,
        hiring: c.hiring || 0,
        created_at: c.created_at ? (typeof c.created_at.toDate === "function" ? c.created_at.toDate().toISOString() : new Date(c.created_at).toISOString()) : null
      });
    });

    res.json(companies);
  } catch (err) {
    console.error("Companies fetch error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// PUT update company status
router.put("/:id/status", auth, adminOnly, async (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ message: "Invalid status." });
  }

  try {
    const compRef = db.collection("companies").doc(req.params.id);
    const doc = await compRef.get();
    if (!doc.exists) return res.status(404).json({ message: "Company not found." });

    await compRef.update({ status });

    await db.collection("audit_logs").add({
      actor_id: req.user.id,
      actor_email: req.user.email || "admin",
      action: "COMPANY_STATUS_UPDATED",
      module: "companies",
      entity_id: req.params.id,
      details: { name: doc.data().name, new_status: status },
      created_at: new Date()
    });

    res.json({ message: `Company status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
