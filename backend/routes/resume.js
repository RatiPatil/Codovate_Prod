const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { db } = require("../config/firebase");
require("dotenv").config();

// ─── Gemini AI Client ─────────────────────────────────────────────────────────
let genAI = null;
let model = null;

try {
  if (process.env.GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
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

// ─── POST /resume/ai-generate ─────────────────────────────────────────────────
router.post("/ai-generate", auth, async (req, res) => {
  const {
    personalInfo, education, experience, projects,
    skills, certifications, achievements, targetRole
  } = req.body;

  try {
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

// ─── POST /resume/save ────────────────────────────────────────────────────────
router.post("/save", auth, async (req, res) => {
  try {
    const resumeRef = db.collection("resumes").doc(req.user.id);
    await resumeRef.set({
      user_id: req.user.id,
      ...req.body,
      updated_at: new Date()
    }, { merge: true });
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

module.exports = router;
