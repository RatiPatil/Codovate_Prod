const express = require("express");
const router = express.Router();
const { db } = require("../../config/firebase");
const auth = require("../../middleware/auth");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

// GET saved opportunities
router.get("/", auth, async (req, res) => {
  try {
    const savesSnap = await db.collection("saved_opportunities")
      .where("student_id", "==", req.user.id)
      .where("is_deleted", "==", false)
      .get();
      
    if (savesSnap.empty) {
      return sendSuccess(res, "Saved opportunities fetched", { saved: [] });
    }

    const oppIds = savesSnap.docs.map(doc => doc.data().opportunity_id);
    
    // In production, batch this in chunks of 10 if oppIds.length > 10
    const oppsSnap = await db.collection("opportunities")
      .where("__name__", "in", oppIds.slice(0, 10)) 
      .where("is_deleted", "==", false)
      .get();

    const companyIds = new Set();
    const oppsMap = {};
    oppsSnap.docs.forEach(doc => {
      const opp = doc.data();
      opp.id = doc.id;
      oppsMap[opp.id] = opp;
      if (opp.company_id) companyIds.add(opp.company_id);
    });

    const companiesMap = {};
    if (companyIds.size > 0) {
      const cSnap = await db.collection("companies").where("__name__", "in", Array.from(companyIds).slice(0, 10)).get();
      cSnap.docs.forEach(d => companiesMap[d.id] = d.data());
    }

    const saved = [];
    savesSnap.docs.forEach(doc => {
      const saveData = doc.data();
      const opp = oppsMap[saveData.opportunity_id];
      if (opp) {
        const company = companiesMap[opp.company_id] || {};
        opp.company_name = company.name || 'Unknown Company';
        opp.company_logo = company.logo || '';
        opp.company_verified = company.verified || false;
        
        saved.push({
          save_id: doc.id,
          saved_at: saveData.created_at,
          ...opp
        });
      }
    });

    return sendSuccess(res, "Saved opportunities fetched", { saved });
  } catch (err) {
    console.error("Get V1 saved error:", err);
    return sendError(res, "Server error", err.message);
  }
});

// POST save opportunity
router.post("/", auth, async (req, res) => {
  const { opportunity_id } = req.body;
  if (!opportunity_id) return sendError(res, "opportunity_id required", null, 400);

  try {
    const oppDoc = await db.collection("opportunities").doc(opportunity_id).get();
    if (!oppDoc.exists || oppDoc.data().is_deleted) return sendError(res, "Opportunity not found", null, 404);

    const existingSnap = await db.collection("saved_opportunities")
      .where("student_id", "==", req.user.id)
      .where("opportunity_id", "==", opportunity_id)
      .where("is_deleted", "==", false)
      .get();
      
    if (!existingSnap.empty) return sendSuccess(res, "Already saved", null, 200);

    const saveRef = db.collection("saved_opportunities").doc();
    await saveRef.set({
      id: saveRef.id,
      student_id: req.user.id,
      opportunity_id,
      is_deleted: false,
      created_at: new Date()
    });

    // Log Activity
    db.collection("activity_logs").add({
      user_id: req.user.id,
      action: "Saved Opportunity",
      entity_type: "opportunity",
      entity_id: opportunity_id,
      created_at: new Date()
    }).catch(console.error);

    return sendSuccess(res, "Opportunity saved successfully", { save_id: saveRef.id });
  } catch (err) {
    console.error("Save V1 error:", err);
    return sendError(res, "Server error", err.message);
  }
});

// DELETE remove saved opportunity
router.delete("/:id", auth, async (req, res) => {
  try {
    const saveRef = db.collection("saved_opportunities").doc(req.params.id);
    const doc = await saveRef.get();
    if (!doc.exists) return sendError(res, "Not found", null, 404);
    
    const data = doc.data();
    if (data.student_id !== req.user.id) return sendError(res, "Unauthorized", null, 403);
    
    // Soft delete
    await saveRef.update({ 
      is_deleted: true, 
      deleted_at: new Date(),
      deleted_by: req.user.id
    });

    // Log Activity
    db.collection("activity_logs").add({
      user_id: req.user.id,
      action: "Removed Saved Opportunity",
      entity_type: "opportunity",
      entity_id: data.opportunity_id,
      created_at: new Date()
    }).catch(console.error);

    return sendSuccess(res, "Removed from saved");
  } catch (err) {
    console.error("Delete V1 save error:", err);
    return sendError(res, "Server error", err.message);
  }
});

module.exports = router;
