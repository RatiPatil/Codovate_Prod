const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { db, admin } = require("../config/firebase");
const { syncDashboard } = require("../services/dashboardService");
const multer = require("multer");
const pdfParse = require("pdf-parse");
require("dotenv").config();

// Configure multer for memory storage (we just need the buffer to parse text)
const upload = multer({ storage: multer.memoryStorage() });

// ─── Gemini AI Client ─────────────────────────────────────────────────────────
const { GoogleGenerativeAI } = require("@google/generative-ai");
let genAI = null;
let model = null;

try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("✅ Gemini AI initialized for Resume Builder");
  } else {
    console.log("⚠️  No GEMINI_API_KEY — AI resume will use smart templates");
  }
} catch (e) {
  console.warn("⚠️  Gemini AI unavailable:", e.message);
}

// ─── Smart Fallback Generator ─────────────────────────────────────────────────
const generateFallbackSummary = (data) => {
  const { name, role, skills, experience, education } = data;
  const topSkills = (skills || []).slice(0, 3).join(', ');
  const expYears = experience?.length > 0 ? `${experience.length}+ year${experience.length > 1 ? 's' : ''}` : 'a strong foundation';
  return `Results-driven ${role || 'technology professional'} with ${expYears} of hands-on experience in ${topSkills || 'software development'}. ${education?.[0]?.degree ? `Holding a ${education[0].degree} from ${education[0].institution}, I bring` : 'Bringing'} a passion for innovation, problem-solving, and delivering impactful solutions. Adept at collaborating in cross-functional teams and continuously upskilling to stay current with industry trends.`;
};

const enhanceBulletFallback = (text, context) => {
  const bullets = text.split('\n').filter(l => l.trim());
  return bullets.map(b => {
    const clean = b.replace(/^[-•*]\s*/, '').trim();
    if (!clean) return b;
    // Add strong action verbs if missing
    const actionVerbs = ['Developed', 'Implemented', 'Designed', 'Built', 'Optimized', 'Led', 'Collaborated', 'Delivered', 'Enhanced', 'Architected'];
    const hasVerb = actionVerbs.some(v => clean.startsWith(v));
    if (!hasVerb && clean.length > 0) {
      return `• ${actionVerbs[Math.floor(Math.random() * actionVerbs.length)]} ${clean.charAt(0).toLowerCase() + clean.slice(1)}`;
    }
    return `• ${clean}`;
  }).join('\n');
};

// ─── POST /api/resume/generate ─────────────────────────────────────────────────
router.post("/generate", auth, async (req, res) => {
  try {
    const profileDoc = await db.collection("profiles").doc(req.user.id).get();
    const p = profileDoc.exists ? profileDoc.data() : {};

    const personalInfo = req.body.personalInfo || p.personalInfo || {};
    const education = req.body.education || p.education || [];
    const experience = req.body.experience || p.experience || [];
    const projects = req.body.projects || p.projects || [];
    const skills = req.body.skills || p.skills || [];
    const certifications = req.body.certifications || p.certifications || [];
    const achievements = req.body.achievements || p.achievements || '';
    const targetRole = req.body.targetRole || p.careerGoal || 'Software Engineer';
    let professionalSummary = "";
    let enhancedExperience = experience || [];
    let enhancedProjects = projects || [];

    if (model) {
      // ── Use Gemini AI ──────────────────────────────────────────────────────
      const prompt = `
You are an expert ATS-optimized resume writer. Given the following information about a job seeker, generate a JSON response with:

1. "summary": A 3-4 sentence professional summary (no fluff, action-oriented, ATS-friendly)
2. "enhancedExperience": Array of experience objects with "bullets" (3-5 strong action verb bullet points each)  
3. "enhancedProjects": Array of project objects with "bullets" (2-3 bullet points highlighting impact/tech)
4. "suggestedSkills": Array of 5 skills they should add based on their profile
5. "atsScore": Number 0-100 indicating how ATS-friendly their resume would be
6. "atsTips": Array of 3 specific tips to improve ATS score

Candidate Data:
Name: ${personalInfo?.name}
Target Role: ${targetRole || 'Software Engineer'}
Education: ${JSON.stringify(education)}
Experience: ${JSON.stringify(experience)}
Projects: ${JSON.stringify(projects)}
Skills: ${JSON.stringify(skills)}
Certifications: ${JSON.stringify(certifications)}
Achievements: ${achievements || ''}

Respond with ONLY valid JSON, no markdown, no explanation.
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      // Strip markdown code fences if present
      const jsonStr = text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
      const aiResponse = JSON.parse(jsonStr);

      professionalSummary = aiResponse.summary || generateFallbackSummary({ ...personalInfo, skills, experience, education });
      enhancedExperience = aiResponse.enhancedExperience || experience;
      enhancedProjects = aiResponse.enhancedProjects || projects;

      return res.json({
        summary: professionalSummary,
        enhancedExperience,
        enhancedProjects,
        suggestedSkills: aiResponse.suggestedSkills || [],
        atsScore: aiResponse.atsScore || 75,
        atsTips: aiResponse.atsTips || [],
        powered_by: "gemini-1.5-flash"
      });

    } else {
      // ── Fallback Template-based Generation ────────────────────────────────
      professionalSummary = generateFallbackSummary({
        name: personalInfo?.name,
        role: targetRole,
        skills,
        experience,
        education
      });

      // Enhance experience bullets
      const enhancedExp = (experience || []).map(exp => ({
        ...exp,
        bullets: exp.description
          ? enhanceBulletFallback(exp.description).split('\n').filter(l => l.trim())
          : exp.bullets || []
      }));

      // Enhance project bullets
      const enhancedProj = (projects || []).map(proj => ({
        ...proj,
        bullets: proj.description
          ? enhanceBulletFallback(proj.description).split('\n').filter(l => l.trim())
          : proj.bullets || []
      }));

      // Suggest skills based on target role
      const roleSuggestions = {
        'frontend': ['TypeScript', 'Next.js', 'Webpack', 'Jest', 'Figma'],
        'backend': ['Docker', 'Redis', 'PostgreSQL', 'AWS', 'Microservices'],
        'fullstack': ['GraphQL', 'Docker', 'TypeScript', 'PostgreSQL', 'AWS'],
        'ml': ['TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy'],
        'default': ['Git', 'Agile', 'REST APIs', 'Problem Solving', 'Team Collaboration']
      };
      const roleKey = Object.keys(roleSuggestions).find(k =>
        (targetRole || '').toLowerCase().includes(k)
      ) || 'default';

      const existingSkills = (skills || []).map(s => s.toLowerCase());
      const suggestedSkills = roleSuggestions[roleKey].filter(s =>
        !existingSkills.includes(s.toLowerCase())
      );

      return res.json({
        summary: professionalSummary,
        enhancedExperience: enhancedExp,
        enhancedProjects: enhancedProj,
        suggestedSkills,
        atsScore: Math.min(95, 50 + (skills?.length || 0) * 3 + (experience?.length || 0) * 10 + (certifications?.length || 0) * 5),
        atsTips: [
          "Use numbers/metrics in your experience bullets (e.g., 'improved performance by 40%')",
          "Match keywords from the job description in your skills section",
          `Add ${suggestedSkills[0] || 'more relevant skills'} to improve ATS matching`
        ],
        powered_by: "template"
      });
    }
  } catch (err) {
    console.error("AI Resume error:", err.message);
    res.status(500).json({ message: "AI generation failed: " + err.message });
  }
});

// ─── PUT /api/resume ────────────────────────────────────────────────────────
router.put("/", auth, async (req, res) => {
  try {
    const {
      activeTemplate,
      currentVersion,
      atsScore,
      grammarScore,
      keywordScore,
      resumeUrl
    } = req.body;

    const resumeRef = db.collection("resumes").doc(req.user.id);
    const doc = await resumeRef.get();

    const data = {
      uid: req.user.id,
      activeTemplate: activeTemplate || 'default',
      currentVersion: currentVersion || 1,
      atsScore: atsScore || 0,
      grammarScore: grammarScore || 0,
      keywordScore: keywordScore || 0,
      resumeUrl: resumeUrl || null,
      lastGenerated: new Date(),
      updatedAt: new Date()
    };

    if (!doc.exists) {
      data.createdAt = new Date();
    }

    await resumeRef.set(data, { merge: true });
    
    // Asynchronously trigger dashboard sync
    syncDashboard(req.user.id);
    
    res.json({ message: "Resume saved successfully." });
  } catch (err) {
    console.error("Resume save error:", err.message);
    res.status(500).json({ message: "Save failed." });
  }
});

// ─── GET /resume ──────────────────────────────────────────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const doc = await db.collection("resumes").doc(req.user.id).get();
    if (!doc.exists) return res.json(null);
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ message: "Load failed." });
  }
});

// ─── POST /resume/versions ──────────────────────────────────────────────────
router.post("/versions", auth, async (req, res) => {
  try {
    const { versionName, templateId, pdfUrl } = req.body;
    if (!versionName) return res.status(400).json({ message: "versionName required." });
    
    const versionRef = db.collection("resumeVersions").doc();
    await versionRef.set({
      versionId: versionRef.id,
      uid: req.user.id,
      versionName,
      templateId: templateId || 'default',
      pdfUrl: pdfUrl || null,
      createdAt: new Date()
    });
    res.json({ message: "Version saved successfully.", id: versionRef.id });
  } catch (err) {
    console.error("Save version error:", err.message);
    res.status(500).json({ message: "Failed to save version." });
  }
});

// ─── GET /api/resume ───────────────────────────────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const doc = await db.collection("resumes").doc(req.user.id).get();
    if (!doc.exists) return res.json(null);
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ message: "Failed to load resume." });
  }
});

// ─── GET /api/resume/versions ──────────────────────────────────────────────────
router.get("/versions", auth, async (req, res) => {
  try {
    const snapshot = await db.collection("resumeVersions")
      .where("uid", "==", req.user.id)
      .orderBy("createdAt", "desc")
      .get();
      
    const versions = snapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, versionName: data.versionName, pdfUrl: data.pdfUrl, templateId: data.templateId, createdAt: data.createdAt?.toDate() };
    });
    res.json(versions);
  } catch (err) {
    console.error("Load versions error:", err.message);
    res.status(500).json({ message: "Failed to load versions." });
  }
});

// ─── GET /resume/versions/:id ───────────────────────────────────────────────
router.get("/versions/:id", auth, async (req, res) => {
  try {
    const doc = await db.collection("resumeVersions").doc(req.params.id).get();
    if (!doc.exists || doc.data().uid !== req.user.id) {
      return res.status(404).json({ message: "Version not found." });
    }
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ message: "Failed to load version." });
  }
});

// ─── DELETE /resume/versions/:id ────────────────────────────────────────────
router.delete("/versions/:id", auth, async (req, res) => {
  try {
    const docRef = db.collection("resumeVersions").doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().uid !== req.user.id) {
      return res.status(404).json({ message: "Version not found." });
    }
    await docRef.delete();
    res.json({ message: "Version deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete version." });
  }
});

// ─── GET /api/resume/reviews ────────────────────────────────────────────────
router.get("/reviews", auth, async (req, res) => {
  try {
    const snapshot = await db.collection("resumeReviews").where("uid", "==", req.user.id).orderBy("createdAt", "desc").get();
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(reviews);
  } catch (err) {
    console.error("Load reviews error:", err.message);
    res.status(500).json({ message: "Failed to load reviews." });
  }
});

// ─── POST /api/resume/review ──────────────────────────────────────────────────
router.post("/review", auth, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No resume file uploaded." });
    if (!model) return res.status(500).json({ message: "AI is not configured." });

    const targetRole = req.body.targetRole || "Software Engineer";

    // Extract text from PDF buffer
    let pdfText = "";
    try {
      const pdfData = await pdfParse(req.file.buffer);
      pdfText = pdfData.text;
    } catch (parseErr) {
      console.error("PDF Parse Error:", parseErr);
      return res.status(400).json({ message: "Failed to parse the PDF. Ensure it is a valid text-based PDF." });
    }

    if (!pdfText.trim()) {
      return res.status(400).json({ message: "No readable text found in the PDF." });
    }

    const prompt = `
You are an expert tech recruiter and ATS (Applicant Tracking System) simulator. 
Review the following resume for the target role of "${targetRole}".

Resume Text:
${pdfText.substring(0, 5000)} // Limit to ~5000 chars

Provide a detailed evaluation in exactly this JSON format:
{
  "atsScore": 85, // Number between 0-100
  "missingKeywords": ["keyword1", "keyword2"], // 3-5 missing important keywords for this role
  "grammar": "Feedback on grammar, spelling, and active verbs",
  "formatting": "Feedback on structure, readability, and ATS-friendliness",
  "skillsGap": "Identify skills missing from the resume that are crucial for ${targetRole}",
  "suggestions": [
    "Specific actionable tip 1",
    "Specific actionable tip 2",
    "Specific actionable tip 3"
  ]
}
Respond ONLY with valid JSON.
`;

    const result = await model.generateContent(prompt);
    let jsonStr = result.response.text().trim();
    if (jsonStr.startsWith('\`\`\`json')) jsonStr = jsonStr.slice(7);
    if (jsonStr.startsWith('\`\`\`')) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith('\`\`\`')) jsonStr = jsonStr.slice(0, -3);
    jsonStr = jsonStr.trim();

    const analysis = JSON.parse(jsonStr);

    // Save to Firestore
    const reviewRef = db.collection("resumeReviews").doc();
    const finalResult = {
      uid: req.user.id,
      targetRole,
      ...analysis,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await reviewRef.set(finalResult);

    // Update main resume score & sync dashboard
    await db.collection("resumes").doc(req.user.id).set({
      atsScore: analysis.atsScore,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    syncDashboard(req.user.id);

    res.json({ id: reviewRef.id, ...finalResult });
  } catch (err) {
    console.error("Resume Review error:", err);
    res.status(500).json({ message: "Failed to review resume" });
  }
});

module.exports = router;
