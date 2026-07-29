const express = require("express");
const router = express.Router();
const { db, admin, FieldValue } = require("../config/firebase");
const auth = require("../middleware/auth");
const { getConfiguredModel, genAI } = require("../utils/aiConfig");

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

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
      const data = mapDoc(cached);
      const ageMs = Date.now() - (data.updatedAt?.toMillis?.() || 0);
      if (ageMs < 24 * 60 * 60 * 1000) return res.json(data);
    }

    const [careerDoc, analyticsDoc] = await Promise.all([
      db.collection("careerProfiles").doc(uid).get(),
      db.collection("analytics").doc(uid).get(),
    ]);

    const c = careerDoc.exists ? mapDoc(careerDoc) : {};
    const a = analyticsDoc.exists ? mapDoc(analyticsDoc) : {};

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
        updatedAt: FieldValue.serverTimestamp(),
      };
      await db.collection("aiSkillGap").doc(uid).set(fallback);
      return res.json(fallback);
    }

    const model = await getConfiguredModel();
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
      updatedAt: FieldValue.serverTimestamp(),
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

    const c = careerDoc.exists ? mapDoc(careerDoc) : {};
    const a = analyticsDoc.exists ? mapDoc(analyticsDoc) : {};
    const roadmap = roadmapDoc.exists ? mapDoc(roadmapDoc) : null;

    const goal = c.career_goal || c.desired_roles?.[0] || "Software Engineer";
    const skills = c.skills || [];
    const roadmapProgress = roadmap?.overall_progress || 0;
    const activeStep = roadmap?.steps?.find(
      (s) => s.status === "in_progress" || s.status === "pending"
    );

    const systemContext = `
You are an expert AI Career Coach on Codovate, a student career platform.
Be concise, encouraging, and practical. Use bullet points when listing steps.

**CRITICAL INSTRUCTION - GENERATIVE UI ACTIONS:**
You have the ability to spawn interactive UI widgets directly in the chat! 
Whenever the user asks for something that matches one of the capabilities below, you MUST include the exact exact markdown tag at the end of your response.

1. Build a Roadmap: If they want to learn a role (e.g., AI Engineer, Frontend), output: [ACTION:BUILD_ROADMAP:RoleName]
2. Find Internships/Jobs: If they are looking for jobs/internships for a role, output: [ACTION:FIND_INTERNSHIPS:RoleName]
3. Find Mentors: If they want a mentor for a specific skill, output: [ACTION:FIND_MENTORS:SkillName]
4. Review Resume: If they want their resume reviewed, output: [ACTION:REVIEW_RESUME]
5. Estimate Readiness: If they ask about their placement readiness, output: [ACTION:ESTIMATE_READINESS]

Example Response:
"That's a great goal! An AI Engineer needs strong Python and Math skills. Let's get started on your customized roadmap!
[ACTION:BUILD_ROADMAP:AI Engineer]"

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

    const model = await getConfiguredModel();

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
        history: FieldValue.arrayUnion(sessionEntry),
        updatedAt: FieldValue.serverTimestamp(),
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

    const a = analyticsDoc.exists ? mapDoc(analyticsDoc) : {};
    const roadmap = roadmapDoc.exists ? mapDoc(roadmapDoc) : null;
    const c = careerDoc.exists ? mapDoc(careerDoc) : {};
    const readiness = readinessDoc.exists ? mapDoc(readinessDoc) : {};

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
        const model = await getConfiguredModel();
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

// ─────────────────────────────────────────────────────────────────
// GET /api/ai/career-advisor
// Provide comprehensive AI Career Coach Dashboard data
// ─────────────────────────────────────────────────────────────────
router.get("/career-advisor", auth, async (req, res) => {
  const uid = req.user.id;
  try {
    // 1. Check cache first (re-generate only if older than 24h OR forced by invalidation)
    const cached = await db.collection("aiCoachCache").doc(uid).get();
    if (cached.exists) {
      const data = mapDoc(cached);
      const ageMs = Date.now() - (data.updatedAt?.toMillis?.() || 0);
      if (ageMs < 24 * 60 * 60 * 1000) return res.json(data);
    }

    // 2. Fetch full student context
    const [userDoc, profileDoc, careerDoc, appsSnap, roadmapDoc, mentorsSnap] = await Promise.all([
      db.collection("users").doc(uid).get(),
      db.collection("profiles").doc(uid).get(),
      db.collection("careerProfiles").doc(uid).get(),
      db.collection("applications").where("user_id", "==", uid).get(), // Check 'user_id' vs 'student_id' depending on schema, usually 'user_id' in phase 3
      db.collection("userRoadmaps").doc(uid).get(),
      db.collection("mentorSessions").where("student_id", "==", uid).get(),
    ]);

    const u = userDoc.exists ? mapDoc(userDoc) : {};
    const p = profileDoc.exists ? mapDoc(profileDoc) : {};
    const c = careerDoc.exists ? mapDoc(careerDoc) : {};
    const roadmap = roadmapDoc.exists ? mapDoc(roadmapDoc) : null;
    
    // Process applications
    let appsCount = 0;
    let interviewsCount = 0;
    let rejectedCount = 0;
    let offersCount = 0;
    appsSnap.forEach(doc => {
      appsCount++;
      const st = mapDoc(doc).status || '';
      if (st.includes('Interview')) interviewsCount++;
      if (st === 'Rejected') rejectedCount++;
      if (st.includes('Offer') || st === 'Accepted') offersCount++;
    });

    const goal = p.careerGoal || p.desired_roles?.[0] || c.career_goal || "Software Engineer";
    const currentSkills = p.skills || c.skills || [];
    const resume = !!p.socialLinks?.resume || !!p.resume_url;
    const profileCompletion = u.profileCompleted || p.profileCompletion || 0;
    const activeStep = roadmap?.steps?.find(s => s.status === "in_progress" || s.status === "pending")?.title || "None";
    const projectsCount = p.projects?.length || 0;
    
    // Fallback if no Gemini
    if (!genAI) {
      const fallback = {
        score: 65,
        score_breakdown: { skills: 10, resume: resume ? 15 : 0, projects: 10, applications: 20, learning: 10 },
        insights: [
          { type: 'improvement', text: `Your profile is ${profileCompletion}% complete. Add more details to improve matching.`, action: 'Edit Profile', link: '/profile' }
        ],
        recommended_skills: ["System Design", "AWS", "React"],
        learning_plan: [{ title: "Complete your profile", description: "Add your resume and skills.", link: "/profile", type: "profile" }],
        interview_prep: [{ title: "Mock Interview", description: "Practice your introduction.", link: "/mock-interviews", type: "practice" }]
      };
      return res.json(fallback);
    }

    const model = await getConfiguredModel();
    const prompt = `
You are an expert AI Career Coach for a student aiming to be a ${goal}.
Analyze their real platform data and generate a personalized, actionable dashboard report.

STUDENT DATA:
- Career Goal: ${goal}
- Current Skills: ${currentSkills.length > 0 ? currentSkills.join(", ") : "None"}
- Profile Completion: ${profileCompletion}%
- Resume Uploaded: ${resume ? 'Yes' : 'No'}
- Projects Added: ${projectsCount}
- Learning Status (Active Topic): ${activeStep}
- Job Applications: ${appsCount} total, ${interviewsCount} interviews, ${offersCount} offers, ${rejectedCount} rejections.
- Mentor Sessions: ${mentorsSnap.size}

INSTRUCTIONS:
1. Calculate a Career Readiness Score (0-100) logically based on the data.
2. Provide a breakdown of the score (skills, resume, projects, applications, learning).
3. Generate 3-4 personalized 'insights'. Be highly specific to their data (e.g. "You applied to 5 jobs but have 0 interviews..."). 
   - 'type' must be one of: 'success', 'warning', 'improvement', 'info'.
   - 'action' is a short button text.
   - 'link' is a relative path (e.g., '/profile', '/opportunities', '/resume-builder', '/mock-interviews', '/roadmap').
4. Recommend 3 critical skills they are missing for ${goal}.
5. Create a Learning Plan (2-3 items) based on their data. 'type' can be 'course', 'project', 'practice'.
6. Create Interview Prep tips (2 items) based on their application status. 'type' can be 'technical', 'behavioral', 'mock'.

RETURN ONLY VALID JSON IN EXACTLY THIS FORMAT (No markdown blocks):
{
  "score": 82,
  "score_breakdown": {
    "skills": 15,
    "resume": 15,
    "projects": 10,
    "applications": 22,
    "learning": 20
  },
  "insights": [
    {
      "type": "improvement",
      "text": "Your profile matches 82% of Frontend Developer roles. Adding React.js could increase it.",
      "action": "Add Skills",
      "link": "/profile"
    }
  ],
  "recommended_skills": ["Docker", "Kubernetes"],
  "learning_plan": [
    { "title": "Build a REST API", "description": "Add a project to showcase backend skills.", "link": "/projecthub", "type": "project" }
  ],
  "interview_prep": [
    { "title": "System Design Practice", "description": "Review scalable architecture concepts.", "link": "/mock-interviews", "type": "technical" }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const parsed = parseJSON(result.response.text());
    
    // Add timestamp
    parsed.updatedAt = FieldValue.serverTimestamp();

    // Cache it
    await db.collection("aiCoachCache").doc(uid).set(parsed);

    res.json(parsed);
  } catch (err) {
    console.error("Career advisor error:", err.message);
    res.status(500).json({ 
      score: 50,
      score_breakdown: { skills: 10, resume: 10, projects: 10, applications: 10, learning: 10 },
      insights: [{ type: 'info', text: 'Error generating personalized insights. Please check back later.', action: 'Retry', link: '/career-coach' }],
      recommended_skills: [],
      learning_plan: [],
      interview_prep: []
    });
  }
});

module.exports = router;
