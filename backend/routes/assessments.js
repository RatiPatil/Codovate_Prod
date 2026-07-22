const express = require('express');
const router = express.Router();
const { db, admin } = require("../config/firebase");
const auth = require("../middleware/auth");
const { syncDashboard } = require("../services/dashboardService");
require('dotenv').config();

const { getConfiguredModel, genAI } = require("../utils/aiConfig");

// GET /api/assessments
// Returns past assessment results for the user
router.get('/', auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const snapshot = await db.collection("skillAssessments").where("uid", "==", uid).orderBy("createdAt", "desc").get();
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(results);
  } catch (err) {
    console.error("Fetch assessments error:", err);
    res.status(500).json({ message: "Failed to fetch assessments" });
  }
});

// POST /api/assessments/start
// Generates 5 MCQs for a given topic
router.post('/start', auth, async (req, res) => {
  const { topic } = req.body;
  const uid = req.user.id;

  if (!topic) return res.status(400).json({ message: "Topic is required" });
  if (!genAI) return res.status(500).json({ message: "AI is not configured" });

  try {
    const model = await getConfiguredModel();
    const prompt = `
Generate 5 intermediate-level Multiple Choice Questions (MCQs) for a skill assessment on "${topic}".
Each question should have 4 options (A, B, C, D) and exactly one correct answer.

Respond ONLY with a valid JSON array of objects in this exact format (no markdown code blocks, just raw JSON):
[
  {
    "id": 1,
    "question": "What is ...?",
    "options": {
      "A": "Option A text",
      "B": "Option B text",
      "C": "Option C text",
      "D": "Option D text"
    },
    "correctAnswer": "A",
    "explanation": "Why A is correct."
  }
]
`;
    const result = await model.generateContent(prompt);
    let jsonStr = result.response.text().trim();
    if (jsonStr.startsWith('\`\`\`json')) jsonStr = jsonStr.slice(7);
    if (jsonStr.startsWith('\`\`\`')) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith('\`\`\`')) jsonStr = jsonStr.slice(0, -3);
    jsonStr = jsonStr.trim();
    
    const questions = JSON.parse(jsonStr);

    // Store the assessment with correct answers in Firestore for later grading
    const pendingRef = db.collection("assessmentAttempts").doc();
    await pendingRef.set({
      uid,
      topic,
      questions,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Strip out correct answers and explanations before sending to client
    const safeQuestions = questions.map(q => {
      const { correctAnswer, explanation, ...safeQ } = q;
      return safeQ;
    });

    res.json({
      assessmentId: pendingRef.id,
      topic,
      questions: safeQuestions
    });
  } catch (err) {
    console.error("Start assessment error:", err);
    res.status(500).json({ message: "Failed to generate assessment" });
  }
});

// POST /api/assessments/submit
// Grades the assessment and generates an improvement plan
router.post('/submit', auth, async (req, res) => {
  const { assessmentId, answers } = req.body;
  const uid = req.user.id;

  if (!assessmentId || !answers) return res.status(400).json({ message: "Missing required fields" });

  try {
    const pendingRef = db.collection("assessmentAttempts").doc(assessmentId);
    const pendingDoc = await pendingRef.get();
    
    if (!pendingDoc.exists) return res.status(404).json({ message: "Assessment session not found" });
    const pendingData = pendingDoc.data();
    
    if (pendingData.uid !== uid) return res.status(403).json({ message: "Unauthorized" });

    // Grade the answers
    let correctCount = 0;
    const gradedQuestions = pendingData.questions.map(q => {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) correctCount++;
      return {
        ...q,
        userAnswer,
        isCorrect
      };
    });

    const scorePercentage = Math.round((correctCount / pendingData.questions.length) * 100);

    // Call Gemini to generate improvement plan
    let breakdown = {};
    if (genAI) {
      const model = await getConfiguredModel();
      const analysisPrompt = `
You are an expert technical tutor. A student just took a 5-question assessment on "${pendingData.topic}" and scored ${scorePercentage}% (${correctCount}/5).

Here is the detailed result of their assessment:
${JSON.stringify(gradedQuestions.map(q => ({
  question: q.question,
  user_answer: q.userAnswer,
  correct_answer: q.correctAnswer,
  is_correct: q.isCorrect
})), null, 2)}

Analyze their performance and provide a personalized improvement plan.
Respond ONLY with a JSON object in this exact format:
{
  "skillBreakdown": "A short summary (1-2 sentences) of their current skill level based on these results.",
  "weakAreas": ["Area 1", "Area 2"],
  "recommendedLearning": ["Resource/Topic 1", "Resource/Topic 2"],
  "improvementPlan": "A concise paragraph detailing steps they should take to improve."
}
`;
      const aiResult = await model.generateContent(analysisPrompt);
      let aiJsonStr = aiResult.response.text().trim();
      if (aiJsonStr.startsWith('\`\`\`json')) aiJsonStr = aiJsonStr.slice(7);
      if (aiJsonStr.startsWith('\`\`\`')) aiJsonStr = aiJsonStr.slice(3);
      if (aiJsonStr.endsWith('\`\`\`')) aiJsonStr = aiJsonStr.slice(0, -3);
      
      try {
        breakdown = JSON.parse(aiJsonStr.trim());
      } catch (e) {
        console.error("Failed to parse Gemini breakdown JSON");
      }
    }

    const finalResult = {
      uid,
      topic: pendingData.topic,
      score: scorePercentage,
      correctCount,
      totalCount: pendingData.questions.length,
      gradedQuestions,
      skillBreakdown: breakdown.skillBreakdown || "Keep practicing!",
      weakAreas: breakdown.weakAreas || [],
      recommendedLearning: breakdown.recommendedLearning || [],
      improvementPlan: breakdown.improvementPlan || "Review the questions you missed and study those specific topics.",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to assessments collection
    const resultRef = db.collection("skillAssessments").doc();
    await resultRef.set(finalResult);

    // Delete the pending assessment
    await pendingRef.delete();
    
    // Also award points for taking an assessment (if they did well, e.g. > 60%)
    if (scorePercentage >= 60) {
      const userRef = db.collection("users").doc(uid);
      const profileRef = db.collection("profiles").doc(uid);
      const pointLedgerRef = db.collection("point_ledger").doc();
      const xpEarned = 25;
      
      await db.runTransaction(async (t) => {
        const userDoc = await t.get(userRef);
        const profileDoc = await t.get(profileRef);
        
        const userData = userDoc.exists ? userDoc.data() : {};
        
        // Update user XP
        t.update(userRef, {
          total_points: (userData.total_points || 0) + xpEarned
        });
        
        // Log points
        t.set(pointLedgerRef, {
          student_id: uid,
          action: 'assessment_' + pendingData.topic,
          points: xpEarned,
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Sync verified skill to Profile/Resume
        if (profileDoc.exists) {
          const profileData = profileDoc.data();
          let skills = profileData.skills || [];
          if (!skills.includes(pendingData.topic)) {
            skills.push(pendingData.topic);
            t.update(profileRef, { skills });
          }
        }
      });
      
      finalResult.xpEarned = xpEarned;
    }

    // Trigger dashboard and readiness sync
    syncDashboard(uid);

    res.json({ id: resultRef.id, ...finalResult });
  } catch (err) {
    console.error("Submit assessment error:", err);
    res.status(500).json({ message: "Failed to grade assessment" });
  }
});

module.exports = router;
