const express = require("express");
const router = express.Router();
const { db } = require("../../config/firebase");
const auth = require("../../middleware/auth");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

// GET company details and active opportunities
router.get("/:id", auth, async (req, res) => {
  try {
    const companyRef = db.collection("companies").doc(req.params.id);
    const companyDoc = await companyRef.get();

    if (!companyDoc.exists) return sendError(res, "Company not found", null, 404);
    
    const company = companyDoc.data();
    if (company.is_deleted) return sendError(res, "Company not found", null, 404);
    
    company.id = companyDoc.id;

    // Fetch active opportunities for this company
    const oppsSnap = await db.collection("opportunities")
      .where("company_id", "==", company.id)
      .where("is_deleted", "==", false)
      .where("status", "in", ["Published", "Open", "Closing Soon"])
      .get();
      
    const active_opportunities = [];
    oppsSnap.docs.forEach(doc => {
      const opp = doc.data();
      opp.id = doc.id;
      // We don't need to re-fetch company details since we already have them
      opp.company_name = company.name;
      opp.company_logo = company.logo;
      opp.company_verified = company.verified;
      active_opportunities.push(opp);
    });

    // Log Activity
    db.collection("activity_logs").add({
      user_id: req.user.id,
      action: "Viewed Company Profile",
      entity_type: "company",
      entity_id: company.id,
      created_at: new Date()
    }).catch(console.error);

    return sendSuccess(res, "Company fetched successfully", { company, active_opportunities });
  } catch (err) {
    console.error("Get V1 company error:", err);
    return sendError(res, "Server error", err.message);
  }
});

module.exports = router;
