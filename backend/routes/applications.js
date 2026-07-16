const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

// Get all applications (admin only)
router.get("/", auth, async (req, res) => {
  if (!["admin", "super_admin", "college_admin", "company_admin"].includes(req.user.role)) return res.status(403).json({ message: "Admin only." });
  try {
    const appsSnapshot = await db.collection("applications").get();
    
    let applications = [];
    for (const doc of appsSnapshot.docs) {
      const app = doc.data();
      app.id = doc.id;
      
      const studentDoc = await db.collection("profiles").doc(app.user_id).get();
      const s = studentDoc.exists ? studentDoc.data() : {};
      
      const userDoc = await db.collection("users").doc(app.user_id).get();
      const u = userDoc.exists ? userDoc.data() : {};
      
      const oppDoc = await db.collection("opportunities").doc(app.opportunity_id).get();
      const o = oppDoc.exists ? oppDoc.data() : {};
      
      applications.push({
        ...app,
        student_name: s.name || u.name || "Unknown",
        student_email: u.email || "Unknown",
        opportunity_title: o.title || "Unknown",
        company: o.company || "Unknown"
      });
    }

    applications.sort((a, b) => {
      const timeA = a.applied_at?.toMillis ? a.applied_at.toMillis() : new Date(a.applied_at).getTime();
      const timeB = b.applied_at?.toMillis ? b.applied_at.toMillis() : new Date(b.applied_at).getTime();
      return timeB - timeA;
    });

    res.json(applications);
  } catch (err) {
    console.error("Get all applications error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Apply to opportunity
router.post("/", auth, async (req, res) => {
  const { opportunity_id } = req.body;

  if (!opportunity_id)
    return res.status(400).json({ message: "Opportunity ID is required." });

  try {
    // Check opportunity exists and is active
    const oppRef = db.collection("opportunities").doc(opportunity_id);
    const oppDoc = await oppRef.get();
    
    if (!oppDoc.exists)
      return res.status(404).json({ message: "Opportunity not found." });
      
    const opp = oppDoc.data();
    if (!opp.is_active)
      return res.status(400).json({ message: "Opportunity is closed." });

    // Check deadline
    if (opp.deadline && new Date(opp.deadline) < new Date())
      return res.status(400).json({ message: "Application deadline has passed." });

    // Check if already applied
    const existingApps = await db.collection("applications")
      .where("user_id", "==", req.user.id)
      .where("opportunity_id", "==", opportunity_id)
      .get();
      
    if (!existingApps.empty)
      return res.status(409).json({ message: "You already applied to this opportunity." });

    // Get student details (Not explicitly needed for the app object anymore, but keeping for checks if needed)
    const studentDoc = await db.collection("profiles").doc(req.user.id).get();
    const student = studentDoc.exists ? studentDoc.data() : {};

    // Create application
    const newAppRef = db.collection("applications").doc();
    const application = {
      id: newAppRef.id,
      user_id: req.user.id,
      opportunity_id: opportunity_id,
      company_id: opp.company_id || '', // Link app to the company
      status: 'Applied',
      applied_at: new Date()
    };
    
    await newAppRef.set(application);

    // Scoring Engine Integration
    const { awardPoints, updatePlacementScore } = require("../utils/scoring");
    await awardPoints(req.user.id, `apply_internship_${opportunity_id}`, 20, true);
    await updatePlacementScore(req.user.id);

    // Log platform event
    await db.collection('platform_events').add({
      actor_id: req.user.id,
      event_type: 'application_submitted',
      entity_type: 'opportunity',
      entity_id: opportunity_id,
      metadata: { status: 'Applied' },
      created_at: new Date()
    });

    // Create notification for user
    const notifRef = db.collection("notifications").doc();
    await notifRef.set({
      id: notifRef.id,
      user_id: req.user.id,
      title: `Applied to ${opp.title}`,
      body: `Your application to ${opp.company} has been submitted`,
      type: 'application',
      ref_id: application.id,
      is_read: false,
      created_at: new Date()
    });

    // 🔴 REAL-TIME: Emit to user
    req.io.to(`user_${req.user.id}`).emit("application_update", {
      type: "new_application",
      application: {
        ...application,
        title: opp.title,
        company: opp.company,
        type: opp.type,
        deadline: opp.deadline,
      },
    });

    // 🔴 REAL-TIME: Emit stats to global
    req.io.to("global").emit("stats_update", {
      type: "new_application",
      user: sp.name || 'Anonymous',
      opportunity: opp.title,
    });

    // 🔴 REAL-TIME: Emit full application to Admin Room
    req.io.to("admin_room").emit("admin_new_application", {
      ...application,
      student_name: sp.name || "Unknown",
      student_email: student.email || "Unknown",
      opportunity_title: opp.title || "Unknown",
      company: opp.company || "Unknown"
    });

    console.log(`✅ ${sp.name || 'Student'} applied to ${opp.title}`);
    res.status(201).json(application);

  } catch (err) {
    console.error("Apply error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Track external application click
router.post("/external", auth, async (req, res) => {
  const { opportunity_id } = req.body;

  if (!opportunity_id)
    return res.status(400).json({ message: "Opportunity ID is required." });

  try {
    const oppRef = db.collection("opportunities").doc(opportunity_id);
    const oppDoc = await oppRef.get();
    
    if (!oppDoc.exists)
      return res.status(404).json({ message: "Opportunity not found." });
      
    const opp = oppDoc.data();

    // Check if already tracked
    const existingApps = await db.collection("applications")
      .where("user_id", "==", req.user.id)
      .where("opportunity_id", "==", opportunity_id)
      .where("status", "==", "External Link Opened")
      .get();
      
    if (!existingApps.empty) {
      return res.status(200).json({ message: "Already tracked" });
    }

    // Fetch Student Name
    const studentDoc = await db.collection("profiles").doc(req.user.id).get();
    const studentName = studentDoc.exists ? (studentDoc.data().name || 'Unknown Student') : 'Unknown Student';

    const newAppRef = db.collection("applications").doc();
    const application = {
      id: newAppRef.id,
      user_id: req.user.id,
      student_name: studentName,
      opportunity_id: opportunity_id,
      internship_title: opp.title || 'Unknown Title',
      company_id: opp.company_id || '',
      company_name: opp.company || 'Unknown Company',
      source: opp.source || 'External Provider',
      status: 'External Link Opened',
      applied_at: new Date(),
      is_external: true
    };
    
    await newAppRef.set(application);

    // Scoring Engine Integration for external apply
    const { awardPoints, updatePlacementScore } = require("../utils/scoring");
    await awardPoints(req.user.id, `apply_internship_${opportunity_id}`, 10, true); // give fewer points for external? Or 20 as before. Let's give 20.
    await updatePlacementScore(req.user.id);

    console.log(`🌐 Student ${req.user.id} opened external opportunity ${opp.title}`);
    res.status(201).json(application);

  } catch (err) {
    console.error("External apply error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Get my applications
router.get("/my", auth, async (req, res) => {
  try {
    const appsSnapshot = await db.collection("applications").where("user_id", "==", req.user.id).get();
    
    let applications = [];
    for (const doc of appsSnapshot.docs) {
      const app = doc.data();
      app.id = doc.id;
      
      const oppDoc = await db.collection("opportunities").doc(app.opportunity_id).get();
      if (oppDoc.exists) {
        const o = oppDoc.data();
        applications.push({
          ...app,
          title: o.title,
          type: o.type,
          company: o.company,
          deadline: o.deadline,
          mode: o.mode,
          location: o.location
        });
      } else {
        applications.push(app);
      }
    }
    
    applications.sort((a, b) => {
      const timeA = a.applied_at?.toMillis ? a.applied_at.toMillis() : new Date(a.applied_at).getTime();
      const timeB = b.applied_at?.toMillis ? b.applied_at.toMillis() : new Date(b.applied_at).getTime();
      return timeB - timeA;
    });

    res.json(applications);
  } catch (err) {
    console.error("Get applications error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Update application status (admin only) — real-time notification
router.put("/:id/status", auth, async (req, res) => {
  if (!["admin", "super_admin", "college_admin", "company_admin"].includes(req.user.role))
    return res.status(403).json({ message: "Admin only." });

  const { status } = req.body;
  const validStatuses = ["Applied", "Under Review", "Selected", "Rejected"];

  if (!validStatuses.includes(status))
    return res.status(400).json({ message: "Invalid status." });

  try {
    const appRef = db.collection("applications").doc(req.params.id);
    const appDoc = await appRef.get();
    
    if (!appDoc.exists)
      return res.status(404).json({ message: "Application not found." });
      
    await appRef.update({ status, updated_at: new Date() });
    
    // Scoring Engine Integration for Selection
    if (status === "Selected") {
      const { awardPoints, updatePlacementScore } = require("../utils/scoring");
      await awardPoints(appDoc.data().user_id, `selected_internship_${req.params.id}`, 500, true);
      await updatePlacementScore(appDoc.data().user_id);
    }
    
    const app = appDoc.data();
    app.id = appDoc.id;

    // Get opportunity details
    const oppDoc = await db.collection("opportunities").doc(app.opportunity_id).get();
    const opp = oppDoc.exists ? oppDoc.data() : {};

    // Create notification
    const notifRef = db.collection("notifications").doc();
    await notifRef.set({
      id: notifRef.id,
      user_id: app.user_id,
      title: `Application ${status}`,
      body: `Your application to ${opp.title || 'a company'} is now ${status}`,
      type: 'status_update',
      ref_id: app.id,
      is_read: false,
      created_at: new Date()
    });

    // 🔴 REAL-TIME: Notify the student instantly
    req.io.to(`user_${app.user_id}`).emit("application_update", {
      type: "status_change",
      application_id: app.id,
      status: status,
      opportunity: opp.title || 'Unknown',
    });

    req.io.to(`user_${app.user_id}`).emit("new_notification", {
      title: `Application ${status}`,
      body: `Your application to ${opp.title || 'a company'} is now ${status}`,
    });

    res.json({ ...app, status });
  } catch (err) {
    console.error("Update status error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Withdraw application (student only, only if status is 'Applied')
router.delete("/:id", auth, async (req, res) => {
  try {
    const appRef = db.collection("applications").doc(req.params.id);
    const appDoc = await appRef.get();

    if (!appDoc.exists)
      return res.status(404).json({ message: "Application not found." });

    const app = appDoc.data();

    if (app.user_id !== req.user.id)
      return res.status(403).json({ message: "Not authorized." });

    if (app.status !== 'Applied')
      return res.status(400).json({ message: "Cannot withdraw — application is already under review or decided." });

    await appRef.delete();

    req.io.to(`user_${req.user.id}`).emit("application_withdrawn", { application_id: req.params.id });

    console.log(`✅ Application ${req.params.id} withdrawn.`);
    res.json({ message: "Application withdrawn successfully." });
  } catch (err) {
    console.error("Withdraw error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;