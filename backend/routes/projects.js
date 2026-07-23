const express = require("express");
const router = express.Router();
const { db, admin, FieldValue } = require("../config/firebase");
const auth = require("../middleware/auth");
const https = require("https");
const { syncDashboard } = require("../services/dashboardService");
const eventBus = require("../events/eventBus");

const { getConfiguredModel, genAI } = require("../utils/aiConfig");

const adminOnly = (req, res, next) => {
  if (!["admin", "super_admin", "college_admin", "company_admin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
};

const serializeProject = (doc) => {
  const d = doc.data();
  return {
    id: doc.id,
    ...d,
    createdAt: d.createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: d.updatedAt?.toDate?.()?.toISOString() || null,
  };
};

// ── STUDENT ROUTES ────────────────────────────────────────────────

// GET /api/projects/my
router.get("/my", auth, async (req, res) => {
  try {
    const snap = await db.collection("projects")
      .where("uid", "==", req.user.id)
      .get();
    let projects = snap.docs.map(serializeProject);
    projects.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json(projects);
  } catch (err) {
    console.error("Fetch my projects:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/projects (Alias for /my)
router.get("/", auth, async (req, res) => {
  try {
    const snap = await db.collection("projects")
      .where("uid", "==", req.user.id)
      .get();
    let projects = snap.docs.map(serializeProject);
    projects.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json(projects);
  } catch (err) {
    console.error("Fetch projects:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});


// GET /api/projects/public/:uid
router.get("/public/:uid", async (req, res) => {
  try {
    const snap = await db.collection("projects")
      .where("uid", "==", req.params.uid)
      .where("visibility", "==", "public")
      .get();
    let projects = snap.docs.map(serializeProject);
    projects.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json(projects);
  } catch (err) {
    console.error("Public projects:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/projects/invites
router.get("/invites", auth, async (req, res) => {
  try {
    const snap = await db.collection("projectInvites").where("toEmail", "==", req.user.email).get();
    res.json(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/projects/invites/:id/accept
router.post("/invites/:id/accept", auth, async (req, res) => {
  try {
    const inviteRef = db.collection("projectInvites").doc(req.params.id);
    const doc = await inviteRef.get();
    if (!doc.exists) return res.status(404).json({ message: "Invite not found" });
    if (doc.data().toEmail !== req.user.email) return res.status(403).json({ message: "Unauthorized" });

    // Add to project teamMembers
    await db.collection("projects").doc(doc.data().projectId).update({
      teamMembers: FieldValue.arrayUnion(req.user.name || req.user.email)
    });

    await inviteRef.delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/projects/invites/:id/reject
router.post("/invites/:id/reject", auth, async (req, res) => {
  try {
    const inviteRef = db.collection("projectInvites").doc(req.params.id);
    const doc = await inviteRef.get();
    if (doc.exists && doc.data().toEmail === req.user.email) {
      await inviteRef.delete();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/projects/:id/invite
router.post("/:id/invite", auth, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email required" });
  
  try {
    const projectDoc = await db.collection("projects").doc(req.params.id).get();
    if (!projectDoc.exists || projectDoc.data().uid !== req.user.id) return res.status(403).json({ message: "Unauthorized" });

    await db.collection("projectInvites").add({
      projectId: req.params.id,
      projectTitle: projectDoc.data().title,
      fromName: req.user.name || req.user.email,
      toEmail: email,
      createdAt: FieldValue.serverTimestamp()
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/projects
router.post("/", auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const {
      title, description, problemStatement = "", solution = "", features = [], 
      skillsLearned = [], techStack = [], githubUrl = "", liveUrl = "",
      thumbnailUrl = "", screenshots = [], videoUrl = "",
      teamMembers = [], milestones = [],
      status = "in_progress", visibility = "public", featured = false,
    } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required." });

    const profileDoc = await db.collection("profiles").doc(uid).get();
    const authorName = profileDoc.exists ? profileDoc.data().name || "" : "";

    const projectData = {
      uid, authorName, title, description, problemStatement, solution, features,
      skillsLearned, techStack, githubUrl, liveUrl, thumbnailUrl, screenshots, videoUrl,
      teamMembers, milestones, status, visibility, featured, likes: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const ref = db.collection("projects").doc();
    
    await db.runTransaction(async (t) => {
      const userRef = db.collection("users").doc(uid);
      const userDoc = await t.get(userRef);
      const userData = userDoc.exists ? userDoc.data() : {};
      
      t.set(ref, projectData);
      
      t.set(db.collection("careerProfiles").doc(uid), {
        projects: FieldValue.arrayUnion(ref.id)
      }, { merge: true });
      
      t.update(userRef, {
        total_points: (userData.total_points || 0) + 50
      });
      
      t.set(db.collection("point_ledger").doc(), {
        student_id: uid,
        action: 'project_created',
        points: 50,
        created_at: FieldValue.serverTimestamp()
      });
    });

    syncDashboard(uid);
    eventBus.emit("PROJECT_ADDED", { uid, projectData });

    res.status(201).json({ id: ref.id, ...projectData, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error("Create project:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// PUT /api/projects/:id
router.put("/:id", auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const ref = db.collection("projects").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ message: "Not found." });
    if (doc.data().uid !== uid) return res.status(403).json({ message: "Not authorized." });

    const allowed = ["title","description","problemStatement","solution","features",
      "skillsLearned","techStack","githubUrl","liveUrl",
      "thumbnailUrl","screenshots","videoUrl","teamMembers","milestones","status","visibility","featured"];
    const update = { updatedAt: FieldValue.serverTimestamp() };
    allowed.forEach((k) => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    await ref.update(update);
    syncDashboard(uid);
    res.json({ success: true });
  } catch (err) {
    console.error("Update project:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// DELETE /api/projects/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const ref = db.collection("projects").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ message: "Not found." });
    if (doc.data().uid !== uid) return res.status(403).json({ message: "Not authorized." });

    await ref.delete();
    await db.collection("careerProfiles").doc(uid).update({
      projects: FieldValue.arrayRemove(req.params.id),
    });
    syncDashboard(uid);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete project:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/projects/github/repos?username=...
router.get("/github/repos", auth, async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ message: "GitHub username required." });

  try {
    const options = {
      hostname: "api.github.com",
      path: `/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=20`,
      method: "GET",
      headers: {
        "User-Agent": "Codovate-App",
        Accept: "application/vnd.github.v3+json",
        ...(process.env.GITHUB_TOKEN ? { Authorization: `token ${process.env.GITHUB_TOKEN}` } : {}),
      },
    };

    const data = await new Promise((resolve, reject) => {
      const r = https.request(options, (ghRes) => {
        let raw = "";
        ghRes.on("data", (c) => (raw += c));
        ghRes.on("end", () => { try { resolve(JSON.parse(raw)); } catch { reject(new Error("Bad JSON")); } });
      });
      r.on("error", reject);
      r.end();
    });

    if (!Array.isArray(data)) return res.status(404).json({ message: "GitHub user not found." });

    res.json(data.map((r) => ({
      id: r.id, name: r.name, description: r.description,
      url: r.html_url, stars: r.stargazers_count, forks: r.forks_count,
      language: r.language, updatedAt: r.updated_at, topics: r.topics || [],
    })));
  } catch (err) {
    console.error("GitHub repos:", err.message);
    res.status(500).json({ message: "Failed to fetch repos." });
  }
});

// POST /api/projects/ai-suggest
router.post("/ai-suggest", auth, async (req, res) => {
  const uid = req.user.id;
  try {
    const [careerDoc, roadmapDoc] = await Promise.all([
      db.collection("careerProfiles").doc(uid).get(),
      db.collection("userRoadmaps").doc(uid).get(),
    ]);

    const c = careerDoc.exists ? careerDoc.data() : {};
    const roadmap = roadmapDoc.exists ? roadmapDoc.data() : null;
    const goal = c.career_goal || c.desired_roles?.[0] || "Software Engineer";
    const skills = c.skills || [];
    const activeStep = roadmap?.steps?.find((s) => s.status === "in_progress" || s.status === "pending");

    if (!genAI) {
      return res.json({ suggestions: [
        { title: "Library Management System", description: "CRUD app to manage books and members.", techStack: ["Java", "Spring Boot", "MySQL"], difficulty: "Beginner", estimatedTime: "2 Weeks", whyRecommended: "Perfect for backend fundamentals." },
        { title: "Expense Tracker API", description: "REST API for tracking personal expenses.", techStack: ["Node.js", "Express", "MongoDB"], difficulty: "Intermediate", estimatedTime: "3 Weeks", whyRecommended: "Great for REST API practice." },
        { title: "Weather Dashboard", description: "Real-time weather app using OpenWeather API.", techStack: ["React", "Tailwind", "OpenWeather API"], difficulty: "Beginner", estimatedTime: "1 Week", whyRecommended: "Learn external API integration." },
        { title: "Chat Application", description: "Real-time chat using WebSockets.", techStack: ["Node.js", "Socket.io", "React"], difficulty: "Advanced", estimatedTime: "4 Weeks", whyRecommended: "Great for full-stack experience." },
      ]});
    }

    const model = await getConfiguredModel();
    const prompt = `You are a tech career advisor. Suggest 4 project ideas for a student.
Student: Career Goal: ${goal}, Skills: ${skills.join(", ") || "Beginner"}, Currently Learning: ${activeStep?.title || "Basics"}.
Return ONLY valid JSON array (no markdown) with exactly 4 objects:
[{"title":"","description":"2 sentences","techStack":["T1","T2"],"difficulty":"Beginner|Intermediate|Advanced","estimatedTime":"X Weeks","whyRecommended":"1 sentence"}]`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim().replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();
    const suggestions = JSON.parse(text);
    res.json({ suggestions });
  } catch (err) {
    console.error("AI suggest:", err.message);
    res.status(500).json({ message: "Failed to generate suggestions." });
  }
});

// POST /api/projects/:id/analyze
router.post("/:id/analyze", auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const ref = db.collection("projects").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ message: "Not found." });
    
    const project = doc.data();
    if (project.uid !== uid) return res.status(403).json({ message: "Not authorized." });

    if (!genAI) {
      return res.json({ suggestions: ["Missing documentation", "Consider adding a better description.", "Add more screenshots to showcase your work."] });
    }

    const model = await getConfiguredModel();
    const prompt = `You are an expert technical recruiter and open-source contributor evaluating a student's portfolio project.
Here are the project details:
Title: ${project.title || 'N/A'}
Description: ${project.description || 'N/A'}
Problem Statement: ${project.problemStatement || 'N/A'}
Solution: ${project.solution || 'N/A'}
Features: ${JSON.stringify(project.features || [])}
Tech Stack: ${JSON.stringify(project.techStack || [])}
GitHub URL: ${project.githubUrl || 'N/A'}
Live URL: ${project.liveUrl || 'N/A'}
Screenshots Count: ${(project.screenshots || []).length}
Demo Video: ${project.videoUrl ? 'Provided' : 'Not provided'}

Identify 3-5 key actionable areas for improvement. Focus on things like:
- Missing documentation or README links
- Vague descriptions or missing problem context
- Missing visuals (screenshots/videos)
- Lacking architecture explanation or features list
- Deployment suggestions

Return ONLY a valid JSON array of strings (no markdown blocks, no keys), for example:
["Add a README.md to your GitHub repository.", "Describe the problem statement more clearly.", "Include screenshots of the dashboard."]`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim().replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();
    
    let suggestions = [];
    try {
      suggestions = JSON.parse(text);
    } catch(e) {
      // fallback if JSON parse fails
      suggestions = ["Missing documentation", "Better description", "Better screenshots"];
    }

    res.json({ suggestions });
  } catch (err) {
    console.error("AI analyze project:", err.message);
    res.status(500).json({ message: "Failed to analyze project." });
  }
});

// ── ADMIN ROUTES ──────────────────────────────────────────────────

router.get("/admin", auth, adminOnly, async (req, res) => {
  try {
    const snap = await db.collection("projects").get();
    const projects = snap.docs.map((doc) => {
      const p = doc.data();
      return { id: doc.id, title: p.title || "Untitled", author: p.authorName || "Unknown", tech: p.techStack || "—", likes: p.likes || 0, status: p.status || "pending", is_featured: p.featured || false, created_at: p.createdAt?.toDate?.()?.toISOString() || null };
    });
    projects.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

router.put("/:id/status", auth, adminOnly, async (req, res) => {
  try {
    const ref = db.collection("projects").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ message: "Not found." });
    const update = {};
    if (req.body.status !== undefined) update.status = req.body.status;
    if (req.body.is_featured !== undefined) update.featured = req.body.is_featured;
    await ref.update(update);
    res.json({ message: "Updated." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
