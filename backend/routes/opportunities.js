const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

// GET all opportunities — with real data
router.get("/", auth, async (req, res) => {
  try {
    const { type, search } = req.query;
    
    let opportunitiesRef = db.collection("opportunities").where("is_active", "==", true);
    
    if (type && type !== "All") {
      opportunitiesRef = opportunitiesRef.where("type", "==", type);
    }
    
    // Fetch student skills for matching algorithm
    const profileDoc = await db.collection("student_profiles").doc(req.user.id).get();
    const userSkills = profileDoc.exists ? (profileDoc.data().skills || []).map(s => s.toLowerCase()) : [];

    // Note: Firestore doesn't support ILIKE or text search natively.
    // For MVP, we will fetch all matching the above and filter by search in memory.
    const snapshot = await opportunitiesRef.get();
    
    let opportunities = [];
    for (const doc of snapshot.docs) {
      const opp = doc.data();
      opp.id = doc.id;
      
      // Filter by search text in memory
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesTitle = opp.title && opp.title.toLowerCase().includes(searchLower);
        const matchesCompany = opp.company && opp.company.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesCompany) continue;
      }
      
      // Calculate Match Score
      let match_score = 0;
      if (opp.required_skills && opp.required_skills.length > 0) {
        if (userSkills.length > 0) {
          const reqSkills = opp.required_skills.map(s => s.toLowerCase());
          let matchCount = 0;
          reqSkills.forEach(reqSkill => {
            if (userSkills.some(us => us.includes(reqSkill) || reqSkill.includes(us))) matchCount++;
          });
          match_score = Math.round((matchCount / reqSkills.length) * 100);
        }
      } else {
        match_score = 100; // Defaults to 100% if no skills are explicitly required
      }
      opp.match_score = match_score;

      // Get application count
      const appsSnapshot = await db.collection("applications").where("opportunity_id", "==", opp.id).get();
      opp.application_count = appsSnapshot.size;
      
      opportunities.push(opp);
    }
    
    // Sort
    opportunities.sort((a, b) => {
      // 1. Sort by match score (highest first)
      if (a.match_score !== b.match_score) return b.match_score - a.match_score;
      
      // 2. Sort by featured status
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      
      // 3. Sort by created date (newest first)
      const timeA = a.created_at?.toMillis ? a.created_at.toMillis() : new Date(a.created_at || 0).getTime();
      const timeB = b.created_at?.toMillis ? b.created_at.toMillis() : new Date(b.created_at || 0).getTime();
      return timeB - timeA;
    });

    res.json(opportunities);
  } catch (err) {
    console.error("Get opportunities error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// GET single opportunity
router.get("/:id", auth, async (req, res) => {
  try {
    const docRef = db.collection("opportunities").doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists)
      return res.status(404).json({ message: "Not found." });

    const opp = doc.data();
    opp.id = doc.id;

    // Increment view count
    await docRef.update({
      view_count: (opp.view_count || 0) + 1
    });

    const appsSnapshot = await db.collection("applications").where("opportunity_id", "==", opp.id).get();
    opp.application_count = appsSnapshot.size;

    res.json(opp);
  } catch (err) {
    console.error("Get opportunity error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

const { body, validationResult } = require("express-validator");

// POST add opportunity (admin only) — triggers real-time
router.post(
  "/",
  auth,
  [
    body("title").notEmpty().withMessage("Title is required.").trim().escape(),
    body("type").isIn(["Internship", "Hackathon", "Competition"]).withMessage("Invalid type."),
    body("company").notEmpty().withMessage("Company is required.").trim().escape(),
    body("registration_link").optional({ checkFalsy: true }).isURL().withMessage("Must be a valid URL."),
  ],
  async (req, res) => {
  if (!["admin", "super_admin", "college_admin", "company_admin"].includes(req.user.role))
    return res.status(403).json({ message: "Admin only." });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }

  const {
    title, type, description, company,
    deadline, prize_pool, eligibility,
    mode, location, registration_link,
    start_date, end_date, is_featured,
    required_skills
  } = req.body;

  try {
    const newOppRef = db.collection("opportunities").doc();
    const opp = {
      id: newOppRef.id,
      title, type, description: description || "", company,
      deadline: deadline || null, prize_pool: prize_pool || "",
      eligibility: eligibility || "", mode: mode || "", location: location || "",
      registration_link: registration_link || "",
      start_date: start_date || null, end_date: end_date || null,
      is_featured: is_featured || false,
      required_skills: required_skills || [],
      is_active: true,
      view_count: 0,
      created_at: new Date()
    };

    await newOppRef.set(opp);

    // 🔴 REAL-TIME: Emit to all connected users
    req.io.to("global").emit("new_opportunity", opp);

    // Send notification to all students
    const studentsSnapshot = await db.collection("students").where("is_active", "==", true).get();
    for (const studentDoc of studentsSnapshot.docs) {
      const s = studentDoc.data();
      const notifRef = db.collection("notifications").doc();
      await notifRef.set({
        id: notifRef.id,
        user_id: studentDoc.id,
        title: `New ${type}: ${title}`,
        body: `${company} has posted a new opportunity`,
        type: 'new_opportunity',
        ref_id: opp.id,
        is_read: false,
        created_at: new Date()
      });
      
      req.io.to(`user_${studentDoc.id}`).emit("new_notification", {
        title: `New ${type}: ${title}`,
        body: `${company} posted a new opportunity`,
      });
    }

    console.log(`✅ New opportunity added: ${title}`);
    res.status(201).json(opp);
  } catch (err) {
    console.error("Add opportunity error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// PUT edit opportunity (admin only)
router.put("/:id", auth, async (req, res) => {
  if (!["admin", "super_admin", "college_admin", "company_admin"].includes(req.user.role)) return res.status(403).json({ message: "Admin only." });

  const {
    title, type, description, company,
    deadline, prize_pool, eligibility,
    mode, location, registration_link,
    start_date, end_date, is_featured,
    required_skills
  } = req.body;

  try {
    const oppRef = db.collection("opportunities").doc(req.params.id);
    const doc = await oppRef.get();
    
    if (!doc.exists) return res.status(404).json({ message: "Opportunity not found." });

    const updateData = {
      title, type, description, company,
      deadline, prize_pool, eligibility,
      mode, location, registration_link,
      start_date, end_date, is_featured,
      required_skills
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

    await oppRef.update(updateData);
    const updatedDoc = await oppRef.get();
    const updatedOpp = updatedDoc.data();
    updatedOpp.id = updatedDoc.id;

    // 🔴 REAL-TIME: Emit update
    req.io.to("global").emit("update_opportunity", updatedOpp);

    res.json(updatedOpp);
  } catch (err) {
    console.error("Edit opportunity error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// DELETE opportunity (admin only)
router.delete("/:id", auth, async (req, res) => {
  if (!["admin", "super_admin", "college_admin", "company_admin"].includes(req.user.role)) return res.status(403).json({ message: "Admin only." });
  
  try {
    const oppRef = db.collection("opportunities").doc(req.params.id);
    const doc = await oppRef.get();
    if (!doc.exists) return res.status(404).json({ message: "Opportunity not found." });

    // Instead of deleting, just deactivate it so history is preserved
    await oppRef.update({ is_active: false });

    // 🔴 REAL-TIME: Emit delete
    req.io.to("global").emit("delete_opportunity", req.params.id);

    res.json({ message: "Opportunity deleted successfully." });
  } catch (err) {
    console.error("Delete opportunity error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;