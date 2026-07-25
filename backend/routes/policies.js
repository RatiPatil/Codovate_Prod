const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const { authenticate, authorize } = require("../middleware");

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

/**
 * SECURITY POLICIES API
 */

// Get Policy (Global or Org)
router.get("/:policyId", authenticate, async (req, res) => {
  try {
    const { policyId } = req.params;
    
    // Non-admins can only read global or their own org's policy
    if (req.user.role !== 'super_admin' && policyId !== 'global' && policyId !== req.user.orgId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const policyDoc = await db.collection("securityPolicies").doc(policyId).get();
    
    if (!policyDoc.exists) {
      // If org policy doesn't exist, return global as fallback
      if (policyId !== 'global') {
        const globalPolicy = await db.collection("securityPolicies").doc("global").get();
        return res.status(200).json(mapDoc(globalPolicy) || {});
      }
      return res.status(404).json({ message: "Policy not found." });
    }

    res.status(200).json(mapDoc(policyDoc));
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update Policy (Requires super_admin for global, or org admin for org)
router.put("/:policyId", authenticate, authorize("system:manage"), async (req, res) => {
  try {
    const { policyId } = req.params;
    const { passwordPolicy, sessionTimeout, mfaRequired, rateLimits } = req.body;

    const updateData = {
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.uid
    };

    if (passwordPolicy !== undefined) updateData.passwordPolicy = passwordPolicy;
    if (sessionTimeout !== undefined) updateData.sessionTimeout = sessionTimeout;
    if (mfaRequired !== undefined) updateData.mfaRequired = mfaRequired;
    if (rateLimits !== undefined) updateData.rateLimits = rateLimits;

    await db.collection("securityPolicies").doc(policyId).set(updateData, { merge: true });
    
    res.status(200).json({ message: "Security policy updated." });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
