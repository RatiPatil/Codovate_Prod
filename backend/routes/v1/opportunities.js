const express = require("express");
const router = express.Router();
const { db } = require("../../config/firebase");
const auth = require("../../middleware/auth");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

// GET all opportunities (v1 with pagination, search, filters)
router.get("/", auth, async (req, res) => {
  try {
    const { 
      type, category, location, work_mode, search,
      limit = 20, last_visible 
    } = req.query;
    
    let opportunitiesRef = db.collection("opportunities")
      .where("is_deleted", "==", false)
      .where("status", "in", ["Published", "Open", "Closing Soon"]);
    
    if (type && type !== "All") opportunitiesRef = opportunitiesRef.where("type", "==", type);
    if (category) opportunitiesRef = opportunitiesRef.where("category", "==", category);
    if (location) opportunitiesRef = opportunitiesRef.where("location", "==", location);
    if (work_mode) opportunitiesRef = opportunitiesRef.where("work_mode", "==", work_mode);

    // If search is provided, use search_keywords array-contains logic if we structure it that way,
    // or fallback to in-memory filter if not fully set up.
    if (search) {
      const searchLower = search.toLowerCase();
      opportunitiesRef = opportunitiesRef.where("search_keywords", "array-contains", searchLower);
    }
    
    // Sort & Limit
    opportunitiesRef = opportunitiesRef.orderBy("created_at", "desc").limit(parseInt(limit));
    
    const snapshot = await opportunitiesRef.get();
    
    // Fetch all companies to map without duplicating data in opportunities
    // To scale, we'd normally fetch just the companies in the current result set
    const companiesSnapshot = await db.collection("companies").where("is_deleted", "==", false).get();
    const companiesMap = {};
    companiesSnapshot.docs.forEach(doc => {
      companiesMap[doc.id] = doc.data();
    });

    let opportunities = [];
    for (const doc of snapshot.docs) {
      const opp = doc.data();
      opp.id = doc.id;
      
      const companyData = companiesMap[opp.company_id] || {};
      opp.company_name = companyData.name || opp.company_name || 'Unknown Company';
      opp.company_logo = companyData.logo || '';
      opp.company_verified = companyData.verified || false;

      // Ensure required skills is an array for AI Match logic on frontend
      opp.required_skills = opp.required_skills || [];
      
      opportunities.push(opp);
    }
    
    return sendSuccess(res, "Opportunities fetched successfully", { opportunities });
  } catch (err) {
    console.error("Get V1 opportunities error:", err);
    return sendError(res, "Server error", err.message);
  }
});

// GET single opportunity
router.get("/:id", auth, async (req, res) => {
  try {
    const docRef = db.collection("opportunities").doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) return sendError(res, "Opportunity not found", null, 404);

    const opp = doc.data();
    if (opp.is_deleted) return sendError(res, "Opportunity not found", null, 404);
    
    opp.id = doc.id;

    // Async log the view in activity_logs (fire and forget)
    db.collection("activity_logs").add({
      user_id: req.user.id,
      action: "Viewed Opportunity",
      entity_type: "opportunity",
      entity_id: opp.id,
      created_at: new Date()
    }).catch(console.error);

    // Fetch company
    if (opp.company_id) {
      const companyDoc = await db.collection("companies").doc(opp.company_id).get();
      if (companyDoc.exists) {
        const c = companyDoc.data();
        opp.company_name = c.name;
        opp.company_logo = c.logo;
        opp.company_verified = c.verified;
        opp.company_industry = c.industry;
        opp.company_website = c.website;
      }
    }

    return sendSuccess(res, "Opportunity fetched", { opportunity: opp });
  } catch (err) {
    console.error("Get V1 opportunity error:", err);
    return sendError(res, "Server error", err.message);
  }
});

module.exports = router;
