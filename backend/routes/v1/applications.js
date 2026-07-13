const express = require("express");
const router = express.Router();
const { db } = require("../../config/firebase");
const auth = require("../../middleware/auth");
const { sendSuccess, sendError } = require("../../utils/apiResponse");

// GET my applications
router.get("/my", auth, async (req, res) => {
  try {
    const appsSnapshot = await db.collection("applications")
      .where("student_id", "==", req.user.id)
      .where("is_deleted", "==", false)
      .get();
    
    let applications = [];
    // We fetch companies and opportunities in bulk to avoid duplicates
    // In production, collect IDs and fetch via batched reads
    const companyIds = new Set();
    const oppIds = new Set();
    
    appsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.company_id) companyIds.add(data.company_id);
      if (data.opportunity_id) oppIds.add(data.opportunity_id);
    });

    const companiesMap = {};
    if (companyIds.size > 0) {
      const cSnap = await db.collection("companies").where("is_deleted", "==", false).get(); // optimize later
      cSnap.docs.forEach(d => companiesMap[d.id] = d.data());
    }

    const oppsMap = {};
    if (oppIds.size > 0) {
      const oSnap = await db.collection("opportunities").where("is_deleted", "==", false).get(); // optimize later
      oSnap.docs.forEach(d => oppsMap[d.id] = d.data());
    }

    for (const doc of appsSnapshot.docs) {
      const app = doc.data();
      app.id = doc.id;
      
      const opp = oppsMap[app.opportunity_id] || {};
      const company = companiesMap[app.company_id] || {};

      applications.push({
        ...app,
        opportunity_title: opp.title || 'Unknown Opportunity',
        opportunity_type: opp.type || 'Opportunity',
        opportunity_deadline: opp.deadline || null,
        company_name: company.name || 'Unknown Company',
        company_logo: company.logo || ''
      });
    }

    // Sort by last updated
    applications.sort((a, b) => {
      const timeA = a.last_updated?.toMillis ? a.last_updated.toMillis() : new Date(a.last_updated || 0).getTime();
      const timeB = b.last_updated?.toMillis ? b.last_updated.toMillis() : new Date(b.last_updated || 0).getTime();
      return timeB - timeA;
    });

    return sendSuccess(res, "Applications fetched successfully", { applications });
  } catch (err) {
    console.error("Get V1 applications error:", err);
    return sendError(res, "Server error", err.message);
  }
});

// START application (duplicate prevention)
router.post("/start", auth, async (req, res) => {
  const { opportunity_id } = req.body;
  if (!opportunity_id) return sendError(res, "opportunity_id is required", null, 400);

  try {
    const oppDoc = await db.collection("opportunities").doc(opportunity_id).get();
    if (!oppDoc.exists || oppDoc.data().is_deleted) return sendError(res, "Opportunity not found", null, 404);
    
    const opp = oppDoc.data();
    
    // Check if already started
    const existingSnap = await db.collection("applications")
      .where("student_id", "==", req.user.id)
      .where("opportunity_id", "==", opportunity_id)
      .where("is_deleted", "==", false)
      .get();
      
    if (!existingSnap.empty) {
      const existingApp = existingSnap.docs[0].data();
      existingApp.id = existingSnap.docs[0].id;
      return sendSuccess(res, "You have already started this application.", { 
        application: existingApp,
        already_started: true
      });
    }

    // Create new application
    const newAppRef = db.collection("applications").doc();
    
    const initialTimeline = [{
      status_code: "STARTED",
      title: "Application Started",
      description: "You began the application process.",
      date: new Date(),
      created_by: req.user.id
    }];

    const application = {
      id: newAppRef.id,
      student_id: req.user.id,
      opportunity_id: opportunity_id,
      company_id: opp.company_id || '',
      status: 'Started',
      clicked_apply_at: new Date(),
      applied_at: null,
      last_updated: new Date(),
      timeline: initialTimeline,
      notes: {
        interview_date: "",
        interview_round: "",
        interviewer: "",
        questions_asked: "",
        feedback: "",
        personal_notes: ""
      },
      resume_version: "latest", // to be implemented
      visible_to_company: false,
      recruiter_status: "Pending",
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: req.user.id,
      updated_by: req.user.id
    };
    
    await newAppRef.set(application);

    // Log Activity
    db.collection("activity_logs").add({
      user_id: req.user.id,
      action: "Started Application",
      entity_type: "application",
      entity_id: application.id,
      metadata: { opportunity_id },
      created_at: new Date()
    }).catch(console.error);

    return sendSuccess(res, "Application started", { application, already_started: false }, 201);
  } catch (err) {
    console.error("Start V1 application error:", err);
    return sendError(res, "Server error", err.message);
  }
});

// UPDATE application status manually
router.put("/:id/status/student", auth, async (req, res) => {
  const { status, status_code, description } = req.body;
  if (!status || !status_code) return sendError(res, "Status fields required", null, 400);

  try {
    const appRef = db.collection("applications").doc(req.params.id);
    const appDoc = await appRef.get();
    
    if (!appDoc.exists) return sendError(res, "Application not found", null, 404);
    
    const app = appDoc.data();
    if (app.student_id !== req.user.id) return sendError(res, "Unauthorized", null, 403);
    if (app.is_deleted) return sendError(res, "Application deleted", null, 404);

    const newTimelineEvent = {
      status_code,
      title: status,
      description: description || `Status updated to ${status}`,
      date: new Date(),
      created_by: req.user.id
    };

    const timeline = app.timeline || [];
    timeline.push(newTimelineEvent);

    const updateData = {
      status,
      timeline,
      last_updated: new Date(),
      updated_at: new Date(),
      updated_by: req.user.id
    };

    if (status_code === "APPLIED") {
      updateData.applied_at = new Date();
    }

    await appRef.update(updateData);

    // Log Activity
    db.collection("activity_logs").add({
      user_id: req.user.id,
      action: "Updated Application Status",
      entity_type: "application",
      entity_id: app.id,
      metadata: { status_code },
      created_at: new Date()
    }).catch(console.error);

    return sendSuccess(res, "Status updated successfully", { ...app, ...updateData });
  } catch (err) {
    console.error("Update V1 application status error:", err);
    return sendError(res, "Server error", err.message);
  }
});

module.exports = router;
