const express = require("express");
const router = express.Router();
const { db, admin } = require("../config/firebase");
const auth = require("../middleware/auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const getModel = () => {
  if (!genAI) throw new Error("GEMINI_API_KEY is not configured.");
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
};

const parseJSON = (text) => {
  let t = text.trim();
  if (t.startsWith("```json")) t = t.slice(7);
  if (t.startsWith("```")) t = t.slice(3);
  if (t.endsWith("```")) t = t.slice(0, -3);
  return JSON.parse(t.trim());
};

// ─────────────────────────────────────────────────────────────────
// GET /api/ai/skill-gap
// Analyze the student's current skills vs. their career goal using Gemini
// ─────────────────────────────────────────────────────────────────
router.get("/skill-gap", auth, async (req, res) => {
  const uid = req.user.id;
  try {
    // Check cache first (re-generate only if older than 24h)
    const cached = await db.collection("aiSkillGap").doc(uid).get();
    if (cached.exists) {
      const data = cached.data();
      const ageMs = Date.now() - (data.updatedAt?.toMillis?.() || 0);
      if (ageMs < 24 * 60 * 60 * 1000) return res.json(data);
    }

    const [careerDoc, analyticsDoc] = await Promise.all([
      db.collection("careerProfiles").doc(uid).get(),
      db.collection("analytics").doc(uid).get(),
    ]);

    const c = careerDoc.exists ? careerDoc.data() : {};
    const a = analyticsDoc.exists ? analyticsDoc.data() : {};

    const goal = c.career_goal || c.desired_roles?.[0] || "Software Engineer";
    const currentSkills = c.skills || [];
    const profileCompletion = a.profile_completion || 0;

    // Fallback if no Gemini
    if (!genAI) {
      const fallback = {
        goal,
        strongSkills: currentSkills.slice(0, 3),
        gapSkills: ["System Design", "DSA", "Cloud (AWS/GCP)"],
        analysis: `You are on track to become a ${goal}. Focus on filling the skill gaps listed to reach your goal faster.`,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await db.collection("aiSkillGap").doc(uid).set(fallback);
      return res.json(fallback);
    }

    const model = getModel();
    const prompt = `
You are an expert tech career advisor. Analyze this student's profile and identify skill gaps.

Student Profile:
- Career Goal: ${goal}
- Current Skills: ${currentSkills.length > 0 ? currentSkills.join(", ") : "None listed yet"}
- Profile Completion: ${profileCompletion}%

Return ONLY valid JSON (no markdown, no backticks) in exactly this shape:
{
  "strongSkills": ["skill1", "skill2"],
  "gapSkills": ["skill3", "skill4"],
  "analysis": "A 2-3 sentence personalized analysis of their readiness and what to focus on."
}

- strongSkills: skills they already have that are relevant to their goal (max 5)
- gapSkills: important skills they are missing for their goal (max 6, ordered by priority)
- analysis: motivating but honest assessment
`;

    const result = await model.generateContent(prompt);
    const parsed = parseJSON(result.response.text());

    const skillGapData = {
      goal,
      strongSkills: parsed.strongSkills || [],
      gapSkills: parsed.gapSkills || [],
      analysis: parsed.analysis || "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("aiSkillGap").doc(uid).set(skillGapData);
    res.json(skillGapData);
  } catch (err) {
    console.error("Skill gap error:", err.message);
    // Return a graceful fallback
    res.json({
      goal: "Software Engineer",
      strongSkills: [],
      gapSkills: ["Add skills to your profile for analysis"],
      analysis: "Complete your profile and add your current skills to get a personalized skill gap analysis.",
    });
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/ai/coach
// Career Coach — contextual Gemini chat
// Body: { message: string, history: [{role, parts}] }
// ─────────────────────────────────────────────────────────────────
router.post("/coach", auth, async (req, res) => {
  const uid = req.user.id;
  const { message, history = [] } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ message: "Message is required." });
  }

  try {
    const [careerDoc, analyticsDoc, roadmapDoc] = await Promise.all([
      db.collection("careerProfiles").doc(uid).get(),
      db.collection("analytics").doc(uid).get(),
      db.collection("userRoadmaps").doc(uid).get(),
    ]);

    const c = careerDoc.exists ? careerDoc.data() : {};
    const a = analyticsDoc.exists ? analyticsDoc.data() : {};
    const roadmap = roadmapDoc.exists ? roadmapDoc.data() : null;

    const goal = c.career_goal || c.desired_roles?.[0] || "Software Engineer";
    const skills = c.skills || [];
    const roadmapProgress = roadmap?.overall_progress || 0;
    const activeStep = roadmap?.steps?.find(
      (s) => s.status === "in_progress" || s.status === "pending"
    );

    const systemContext = `
You are an expert AI Career Coach on Codovate, a student career platform.
Be concise, encouraging, and practical. Use bullet points when listing steps.
Respond in plain text — no markdown headers (##), no bold (**), no asterisks.

Student Context:
- Career Goal: ${goal}
- Current Skills: ${skills.join(", ") || "Not listed"}
- Roadmap Progress: ${roadmapProgress}%
- Currently Learning: ${activeStep?.title || "No active module"}
- Profile Completion: ${a.profile_completion || 0}%
`;

    if (!genAI) {
      return res.json({
        reply: `I'm your AI Career Coach! I see you're aiming for ${goal}. Complete your profile and generate your AI Career Roadmap to get personalized guidance. What specific challenge are you facing today?`,
      });
    }

    const model = getModel();

    // Build conversation history for Gemini multi-turn chat
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemContext }],
        },
        {
          role: "model",
          parts: [{ text: "Understood! I'm ready to help as your career coach. What would you like to discuss?" }],
        },
        ...history.map((h) => ({
          role: h.role,
          parts: [{ text: h.content }],
        })),
      ],
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    // Persist session (last 20 messages to keep it light)
    const sessionEntry = {
      message,
      reply,
      timestamp: new Date().toISOString(),
    };

    await db.collection("coachSessions").doc(uid).set(
      {
        history: admin.firestore.FieldValue.arrayUnion(sessionEntry),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    res.json({ reply });
  } catch (err) {
    console.error("Career coach error:", err.message);
    res.status(500).json({ message: "Coach is temporarily unavailable. Please try again." });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/ai/weekly-report
// Enhanced weekly report — stats + Gemini AI narrative
// ─────────────────────────────────────────────────────────────────
router.get("/weekly-report", auth, async (req, res) => {
  const uid = req.user.id;
  try {
    const [analyticsDoc, roadmapDoc, careerDoc, appsSnap, readinessDoc] =
      await Promise.all([
        db.collection("analytics").doc(uid).get(),
        db.collection("userRoadmaps").doc(uid).get(),
        db.collection("careerProfiles").doc(uid).get(),
        db.collection("applications").where("studentId", "==", uid).get(),
        db.collection("placementReadiness").doc(uid).get(),
      ]);

    const a = analyticsDoc.exists ? analyticsDoc.data() : {};
    const roadmap = roadmapDoc.exists ? roadmapDoc.data() : null;
    const c = careerDoc.exists ? careerDoc.data() : {};
    const readiness = readinessDoc.exists ? readinessDoc.data() : {};

    const goal = c.career_goal || c.desired_roles?.[0] || "Software Engineer";
    const roadmapProgress = roadmap?.overall_progress || 0;
    const activeStep = roadmap?.steps?.find(
      (s) => s.status === "in_progress" || s.status === "pending"
    );
    const completedSteps = roadmap?.steps?.filter(
      (s) => s.status === "completed"
    ).length || 0;

    const stats = {
      goal,
      roadmapProgress,
      activeStep: activeStep?.title || null,
      completedSteps,
      totalApplications: appsSnap.size,
      readinessScore: readiness.score || 0,
      profileCompletion: a.profile_completion || 0,
      weekEnding: new Date().toISOString(),
    };

    // Generate AI narrative
    let narrative = null;
    if (genAI) {
      try {
        const model = getModel();
        const prompt = `
Write a brief, encouraging weekly progress report for a student.
Keep it to 3-4 sentences. Be specific about numbers. Suggest one clear next step.
No markdown formatting — plain text only.

Their data this week:
- Career Goal: ${goal}
- Roadmap Progress: ${roadmapProgress}% (${completedSteps} steps completed)
- Currently Studying: ${activeStep?.title || "N/A"}
- Placement Readiness: ${readiness.score || 0}%
- Total Applications: ${appsSnap.size}
- Profile Completion: ${a.profile_completion || 0}%
`;
        const result = await model.generateContent(prompt);
        narrative = result.response.text().trim();
      } catch (e) {
        console.warn("Narrative generation failed:", e.message);
      }
    }

    const report = {
      ...stats,
      narrative: narrative || `You're ${roadmapProgress}% through your ${goal} roadmap. Keep it up!`,
      generatedAt: new Date().toISOString(),
    };

    // Persist
    await db
      .collection("weeklyReports")
      .doc(`${uid}_latest`)
      .set(report, { merge: true });

    res.json(report);
  } catch (err) {
    console.error("Weekly report error:", err.message);
    res.status(500).json({ message: "Server error generating weekly report." });
  }
});

module.exports = router;
