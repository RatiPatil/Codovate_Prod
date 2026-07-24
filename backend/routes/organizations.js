const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const { authenticate, authorize } = require("../middleware");

/**
 * ORGANIZATIONS API
 */

// Create Organization (Requires super_admin)
router.post("/", authenticate, authorize("system:manage"), async (req, res) => {
  try {
    const { name, type, domains } = req.body;
    if (!name || !type) return res.status(400).json({ message: "Name and type required." });

    const orgDoc = {
      name,
      type, // 'college', 'company'
      domains: domains || [],
      status: "active",
      settings: {},
      createdAt: new Date().toISOString(),
      createdBy: req.user.uid
    };

    const docRef = await db.collection("organizations").add(orgDoc);
    res.status(201).json({ message: "Organization created", id: docRef.id });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// List Organizations
router.get("/", authenticate, authorize("colleges:read", { any: true }), async (req, res) => {
  try {
    const orgs = await db.collection("organizations").get();
    const result = orgs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * DEPARTMENTS API
 */

// Create Department
router.post("/:orgId/departments", authenticate, authorize("colleges:manage", { any: true }), async (req, res) => {
  try {
    const { orgId } = req.params;
    const { name, parentDeptId } = req.body;

    if (!name) return res.status(400).json({ message: "Department name required." });

    const deptDoc = {
      orgId,
      name,
      parentDeptId: parentDeptId || null,
      status: "active",
      createdAt: new Date().toISOString(),
      createdBy: req.user.uid
    };

    const docRef = await db.collection("departments").add(deptDoc);
    res.status(201).json({ message: "Department created", id: docRef.id });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// List Departments in Org
router.get("/:orgId/departments", authenticate, async (req, res) => {
  try {
    const { orgId } = req.params;
    const depts = await db.collection("departments").where("orgId", "==", orgId).get();
    const result = depts.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
