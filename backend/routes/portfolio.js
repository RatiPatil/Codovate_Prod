const express = require("express");
const router = express.Router();
const { db, admin } = require("../config/firebase");
const auth = require("../middleware/auth");
const { syncDashboard } = require("../services/dashboardService");

// ─── PUT /api/portfolio ──────────────────────────────────────────────────
router.put("/", auth, async (req, res) => {
  try {
    const { slug, theme, public: isPublic, featuredProjects, featuredSkills, about, bannerImage, seoTitle, seoDescription } = req.body;
    
    const portfolioRef = db.collection("portfolios").doc(req.user.id);
    const doc = await portfolioRef.get();
    
    const data = {
      uid: req.user.id,
      slug: slug || req.user.username || "",
      theme: theme || "light",
      public: isPublic !== undefined ? isPublic : true,
      featuredProjects: featuredProjects || [],
      featuredSkills: featuredSkills || [],
      about: about || "",
      bannerImage: bannerImage || "",
      seoTitle: seoTitle || "",
      seoDescription: seoDescription || "",
      updatedAt: new Date()
    };
    
    if (!doc.exists) {
      data.createdAt = new Date();
      data.views = 0;
      data.recruiterViews = 0;
    }
    
    await portfolioRef.set(data, { merge: true });
    
    // Asynchronously sync dashboard
    syncDashboard(req.user.id);
    
    res.json({ message: "Portfolio settings saved successfully." });
  } catch (err) {
    console.error("Save portfolio error:", err);
    res.status(500).json({ message: "Failed to save settings." });
  }
});

// ─── GET /api/portfolio ──────────────────────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const doc = await db.collection("portfolios").doc(req.user.id).get();
    if (!doc.exists) return res.json(null);
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ message: "Failed to load settings." });
  }
});

// ─── POST /api/portfolio/publish ───────────────────────────────────────────
router.post("/publish", auth, async (req, res) => {
  try {
    const portfolioRef = db.collection("portfolios").doc(req.user.id);
    await portfolioRef.set({ public: true, updatedAt: new Date() }, { merge: true });
    syncDashboard(req.user.id);
    res.json({ message: "Portfolio published successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to publish." });
  }
});

// ─── GET /api/portfolio/:username ──────────────────────────────────────────
router.get("/:username", async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase();
    
    // 1. Find user by username
    const usersSnapshot = await db.collection("users").where("username", "==", username).get();
    
    if (usersSnapshot.empty) {
      return res.status(404).json({ message: "Portfolio not found." });
    }
    
    const userDoc = usersSnapshot.docs[0];
    const user = userDoc.data();
    
    // Check if account is active
    if (user.is_active === false) {
      return res.status(403).json({ message: "Portfolio is currently unavailable." });
    }
    
    const userId = user.id;
    
    // 2. Perform parallel fetch for all relational data
    const [
      profileDoc,
      resumeDoc,
      portfolioDoc,
      skillsDoc,
      allProjectsSnapshot,
      certificatesSnapshot,
      achievementsSnapshot,
      activityLogsSnapshot
    ] = await Promise.all([
      db.collection("profiles").doc(userId).get(),
      db.collection("resumes").doc(userId).get(),
      db.collection("portfolios").doc(userId).get(),
      db.collection("skills").doc(userId).get(),
      db.collection("projects").where("userId", "==", userId).get(),
      db.collection("certificates").where("ownerUid", "==", userId).get(),
      db.collection("achievements").where("uid", "==", userId).orderBy("earnedAt", "desc").get(),
      db.collection("activityLogs").where("uid", "==", userId).orderBy("createdAt", "desc").limit(10).get()
    ]);

    const profile = profileDoc.exists ? profileDoc.data() : null;
    const resume = resumeDoc.exists ? resumeDoc.data() : null;
    const portfolioSettings = portfolioDoc.exists ? portfolioDoc.data() : { public: true, featuredProjects: [], theme: "light" };
    const skillsSet = skillsDoc.exists ? skillsDoc.data() : { technical: [], soft: [], tools: [], languages: [] };
    
    const certificates = certificatesSnapshot.docs.map(doc => doc.data());
    const achievements = achievementsSnapshot.docs.map(doc => doc.data());
    const activityLogs = activityLogsSnapshot.docs.map(doc => doc.data());

    if (!portfolioSettings.public) {
      return res.status(403).json({ message: "This portfolio is private." });
    }

    let projects = [];
    if (portfolioSettings.featuredProjects && portfolioSettings.featuredProjects.length > 0) {
      projects = allProjectsSnapshot.docs
        .filter(doc => portfolioSettings.featuredProjects.includes(doc.id))
        .map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      projects = allProjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // 3. Assemble unified relational tree
    const publicProfile = {
      user: {
        id: userId,
        username: user.username,
        name: user.name,
        avatar: user.avatar || "",
        email: user.email,
        providers: user.providers || []
      },
      profile: profile || {},
      skills: skillsSet,
      resume: resume || {},
      portfolio: {
        theme: portfolioSettings.theme || "light",
        bannerImage: portfolioSettings.bannerImage || "",
        about: portfolioSettings.about || resume?.aiSummary || resume?.targetSummary || "",
        seoTitle: portfolioSettings.seoTitle || `${user.name}'s Portfolio`,
        seoDescription: portfolioSettings.seoDescription || `View ${user.name}'s skills and projects.`
      },
      certificates: certificates,
      projects: projects,
      achievements: achievements,
      activityLogs: activityLogs
    };

    res.json(publicProfile);

  } catch (err) {
    console.error("Portfolio fetch error:", err);
    res.status(500).json({ message: "Failed to load portfolio." });
  }
});

// ─── POST /api/portfolio/:username/view ─────────────────────────────────────
router.post("/:username/view", async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase();
    const { isRecruiter } = req.body;
    
    const usersSnapshot = await db.collection("users").where("username", "==", username).get();
    if (usersSnapshot.empty) return res.status(404).json({ message: "Not found" });
    const userId = usersSnapshot.docs[0].id;
    
    // Update Portfolio Document
    const portfolioRef = db.collection("portfolios").doc(userId);
    const inc = admin.firestore.FieldValue.increment(1);
    
    const updateData = { views: inc };
    if (isRecruiter) updateData.recruiterViews = inc;
    
    await portfolioRef.set(updateData, { merge: true });
    
    // Update Analytics Document
    const analyticsRef = db.collection("portfolioAnalytics").doc(userId);
    const aDoc = await analyticsRef.get();
    if (!aDoc.exists) {
      await analyticsRef.set({
        uid: userId,
        totalViews: 1,
        recruiterViews: isRecruiter ? 1 : 0,
        uniqueVisitors: 1,
        downloads: 0,
        shares: 0,
        lastViewed: new Date()
      });
    } else {
      const aData = { totalViews: inc, lastViewed: new Date() };
      if (isRecruiter) aData.recruiterViews = inc;
      await analyticsRef.set(aData, { merge: true });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error("View track error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
