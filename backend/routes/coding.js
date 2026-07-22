const express = require('express');
const router = express.Router();
const { db, admin } = require("../config/firebase");
const auth = require("../middleware/auth");
const { CODING_PROBLEMS } = require("../data/codingProblems");
const { syncDashboard } = require("../services/dashboardService");
require('dotenv').config();

const { getConfiguredModel, genAI } = require("../utils/aiConfig");

async function ensureUserQuestions(uid) {
  const userQsSnap = await db.collection("codingQuestions").where("uid", "==", uid).get();
  if (!userQsSnap.empty) {
    return userQsSnap.docs.map(d => d.data());
  }

  const profileDoc = await db.collection("profiles").doc(uid).get();
  const p = profileDoc.exists ? profileDoc.data() : {};
  const goal = p.careerGoal || "Software Engineer";
  const skills = p.skills || [];
  
  if (!genAI) return CODING_PROBLEMS;
  
  try {
    const model = await getConfiguredModel();
    const prompt = `
      You are an expert technical interviewer. The student wants to be a ${goal} and knows ${skills.join(", ")}.
      Generate exactly 3 coding challenges: 1 Daily (Easy), 1 Weekly (Medium), and 1 Practice (Hard).
      Output STRICTLY valid JSON array containing EXACTLY 3 objects:
      [
        {
          "id": "unique-slug-string",
          "title": "Problem Title",
          "type": "daily",
          "difficulty": "Easy",
          "topic": "DSA",
          "tags": ["Array"],
          "companies": ["Google"],
          "description": "Full markdown description",
          "examples": [{"input": "...", "output": "..."}],
          "hints": ["Hint 1"],
          "starterCode": { "javascript": "...", "python": "...", "java": "...", "cpp": "..." },
          "xp": 20,
          "coins": 5
        }
      ]
      Ensure valid JSON without trailing commas.
    `;
    const result = await model.generateContent(prompt);
    let jsonStr = result.response.text().trim();
    if (jsonStr.startsWith('\`\`\`json')) jsonStr = jsonStr.replace(/^\`\`\`json/, '');
    if (jsonStr.startsWith('\`\`\`')) jsonStr = jsonStr.replace(/^\`\`\`/, '');
    jsonStr = jsonStr.replace(/\`\`\`$/, '').trim();
    
    const questions = JSON.parse(jsonStr);
    const batch = db.batch();
    questions.forEach(q => {
      q.uid = uid;
      q.createdAt = admin.firestore.FieldValue.serverTimestamp();
      const docRef = db.collection("codingQuestions").doc(`${uid}_${q.id}`);
      batch.set(docRef, q);
    });
    await batch.commit();
    return questions;
  } catch (err) {
    console.error("Failed to generate questions:", err);
    return CODING_PROBLEMS;
  }
}

// GET /api/coding/dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    let streak = userData.codingStreak || 0;
    const lastActive = userData.lastActiveDate ? userData.lastActiveDate.toDate() : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (lastActive) {
      const lastActiveDay = new Date(lastActive);
      lastActiveDay.setHours(0, 0, 0, 0);
      const diffTime = Math.abs(today - lastActiveDay);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 1) streak = 0;
    }

    const stats = {
      xp: userData.total_points || 0,
      coins: userData.coins || 0,
      streak: streak
    };

    const userProblems = await ensureUserQuestions(uid);
    const dailyChallenge = userProblems.find(p => p.type === 'daily') || CODING_PROBLEMS[0];
    const weeklyChallenge = userProblems.find(p => p.type === 'weekly') || CODING_PROBLEMS[1];
    
    const solvedSnap = await db.collection("codingProgress").where("uid", "==", uid).where("passed", "==", true).get();
    const solvedIds = solvedSnap.docs.map(d => d.data().problemId);

    res.json({ stats, dailyChallenge, weeklyChallenge, solvedIds });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
});

// GET /api/coding/progress
router.get('/progress', auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const statsDoc = await db.collection("codingStats").doc(uid).get();
    let stats = { totalXp: 0, coinsEarned: 0, streak: 0, completedCount: 0 };
    if (statsDoc.exists) stats = statsDoc.data();

    const submissionsSnapshot = await db.collection("codingSubmissions").where("uid", "==", uid).where("status", "==", "completed").get();
    const completed = [];
    submissionsSnapshot.forEach(doc => {
      completed.push(doc.data().problemId);
    });
    res.json({ completed, stats });
  } catch (err) {
    console.error("Progress fetch error:", err);
    res.status(500).json({ message: "Failed to fetch progress" });
  }
});

// GET /api/coding/problems
router.get('/problems', auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const solvedSnap = await db.collection("codingSubmissions").where("uid", "==", uid).where("status", "==", "completed").get();
    const solvedIds = new Set(solvedSnap.docs.map(d => d.data().problemId));

    const userProblems = await ensureUserQuestions(uid);
    const problems = userProblems.map(p => ({
      ...p,
      solved: solvedIds.has(p.id)
    }));
    res.json(problems);
  } catch (err) {
    console.error("Problems fetch error:", err);
    res.status(500).json({ message: "Failed to fetch problems" });
  }
});

// GET /api/coding/problems/:id/solution
router.get('/problems/:id/solution', auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const userProblems = await ensureUserQuestions(uid);
    let problem = userProblems.find(p => p.id === req.params.id);
    if (!problem) problem = CODING_PROBLEMS.find(p => p.id === req.params.id);
    
    if (!problem) return res.status(404).json({ message: "Problem not found" });
    res.json({ solution: problem.solution || "Solution not available for AI generated questions yet." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/coding/submit
router.post('/submit', auth, async (req, res) => {
  const { problemId, code, language } = req.body;
  const uid = req.user.id;
  
  try {
    const userProblems = await ensureUserQuestions(uid);
    let problem = userProblems.find(p => p.id === problemId);
    if (!problem) problem = CODING_PROBLEMS.find(p => p.id === problemId);
    
    if (!problem || !code) {
      return res.status(400).json({ message: "Invalid request parameters" });
    }
    if (!genAI) return res.status(500).json({ message: "AI Evaluation is not configured." });

    const model = await getConfiguredModel();
    let evaluationPrompt = "";
    if (problem.topic === "Aptitude") {
      evaluationPrompt = `You are an expert evaluator. Problem: "${problem.title}".\nDesc: ${problem.description}\nUser's Answer:\n${code}\nDid the user logically solve it? Respond ONLY JSON: { "passed": true/false, "feedback": "...", "syntaxError": null, "timeComplexity": "N/A", "spaceComplexity": "N/A" }`;
    } else if (problem.topic === "SQL") {
      evaluationPrompt = `You are an SQL evaluator. Problem: "${problem.title}".\nDesc: ${problem.description}\nUser's SQL:\n${code}\nRespond ONLY JSON: { "passed": true/false, "feedback": "...", "syntaxError": "...", "timeComplexity": "N/A", "spaceComplexity": "N/A" }`;
    } else {
      evaluationPrompt = `You are an expert technical interviewer. Problem: "${problem.title}".\nDesc: ${problem.description}\nUser's Code (${language}):\n${code}\nEvaluate on Syntax, Correctness, Complexity. Respond ONLY JSON: { "passed": true/false, "syntaxError": "...", "feedback": "...", "timeComplexity": "...", "spaceComplexity": "..." }`;
    }
    
    const result = await model.generateContent(evaluationPrompt);
    let jsonStr = result.response.text().trim();
    if (jsonStr.startsWith('\`\`\`json')) jsonStr = jsonStr.replace(/^\`\`\`json/, '');
    if (jsonStr.startsWith('\`\`\`')) jsonStr = jsonStr.replace(/^\`\`\`/, '');
    jsonStr = jsonStr.replace(/\`\`\`$/, '').trim();
    const evalResult = JSON.parse(jsonStr);
    
    const submissionRef = db.collection("codingSubmissions").doc();
    await submissionRef.set({
      uid, problemId, language, code, status: evalResult.passed ? 'completed' : 'failed', createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    if (evalResult.passed) {
      const userRef = db.collection("users").doc(uid);
      const statsRef = db.collection("codingStats").doc(uid);
      const previouslySolved = await db.collection("codingSubmissions").where("uid", "==", uid).where("problemId", "==", problemId).where("status", "==", "completed").get();
      const isFirstTimeSolved = previouslySolved.size <= 1;

      let xpEarned = isFirstTimeSolved ? (problem.xp || 10) : 0;
      let coinsEarned = isFirstTimeSolved ? (problem.coins || 5) : 0;
      
      const txResult = await db.runTransaction(async (t) => {
        const userDoc = await t.get(userRef);
        const statsDoc = await t.get(statsRef);
        const userData = userDoc.exists ? userDoc.data() : {};
        
        let streak = userData.codingStreak || 0;
        let alreadyPracticedToday = false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (userData.lastActiveDate) {
          const lastActiveDay = userData.lastActiveDate.toDate();
          lastActiveDay.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil(Math.abs(today - lastActiveDay) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) streak += 1;
          else if (diffDays > 1) streak = 1;
          else alreadyPracticedToday = true;
        } else {
          streak = 1;
        }

        if (isFirstTimeSolved) {
          t.update(userRef, {
            total_points: (userData.total_points || 0) + xpEarned,
            coins: (userData.coins || 0) + coinsEarned,
            codingStreak: streak,
            lastActiveDate: admin.firestore.FieldValue.serverTimestamp()
          });

          if (statsDoc.exists) {
            t.update(statsRef, {
              totalXp: admin.firestore.FieldValue.increment(xpEarned),
              coinsEarned: admin.firestore.FieldValue.increment(coinsEarned),
              completedCount: admin.firestore.FieldValue.increment(1),
              streak: streak
            });
          } else {
            t.set(statsRef, { uid, totalXp: xpEarned, coinsEarned, completedCount: 1, streak });
          }
          
          const pointLedgerRef = db.collection("point_ledger").doc();
          t.set(pointLedgerRef, {
            student_id: uid, action: `solved_${problemId}`, points: xpEarned, created_at: admin.firestore.FieldValue.serverTimestamp()
          });
        } else if (!alreadyPracticedToday) {
          t.update(userRef, { codingStreak: streak, lastActiveDate: admin.firestore.FieldValue.serverTimestamp() });
          if (statsDoc.exists) t.update(statsRef, { streak });
          else t.set(statsRef, { streak });
        }
        return streak;
      });

      evalResult.xpEarned = xpEarned;
      evalResult.coinsEarned = coinsEarned;
      evalResult.newStreak = txResult;
      
      syncDashboard(uid);
    }
    
    res.json(evalResult);
  } catch (error) {
    console.error("AI Evaluation error:", error);
    res.status(500).json({ message: "Failed to evaluate code." });
  }
});

module.exports = router;
