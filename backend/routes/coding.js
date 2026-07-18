const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { db, admin } = require("../config/firebase");
const auth = require("../middleware/auth");
const { CODING_PROBLEMS } = require("../data/codingProblems");
const { syncDashboard } = require("../services/dashboardService");
require('dotenv').config();

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// GET /api/coding/dashboard
// Returns user stats and daily/weekly challenges
router.get('/dashboard', auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    // Calculate streak
    let streak = userData.codingStreak || 0;
    const lastActive = userData.lastActiveDate ? userData.lastActiveDate.toDate() : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (lastActive) {
      const lastActiveDay = new Date(lastActive);
      lastActiveDay.setHours(0, 0, 0, 0);
      const diffTime = Math.abs(today - lastActiveDay);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        streak = 0; // Lost streak
      }
    }

    const stats = {
      xp: userData.total_points || 0,
      coins: userData.coins || 0,
      streak: streak
    };

    const dailyChallenge = CODING_PROBLEMS.find(p => p.type === 'daily') || CODING_PROBLEMS[0];
    const weeklyChallenge = CODING_PROBLEMS.find(p => p.type === 'weekly') || CODING_PROBLEMS[1];
    
    // Fetch user's solved problems
    const solvedSnap = await db.collection("codingProgress").where("uid", "==", uid).where("passed", "==", true).get();
    const solvedIds = solvedSnap.docs.map(d => d.data().problemId);

    res.json({
      stats,
      dailyChallenge,
      weeklyChallenge,
      solvedIds
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
});

// GET /api/coding/progress
// Retrieve user's completed challenges and stats
router.get('/progress', auth, async (req, res) => {
  try {
    const uid = req.user.id;
    
    // Get coding stats
    const statsDoc = await db.collection("codingStats").doc(uid).get();
    let stats = { totalXp: 0, coinsEarned: 0, streak: 0, completedCount: 0 };
    if (statsDoc.exists) {
      stats = statsDoc.data();
    }

    // Get individual submissions (completed ones)
    const submissionsSnapshot = await db.collection("codingSubmissions").where("uid", "==", uid).where("status", "==", "completed").get();
    
    const completed = [];
    submissionsSnapshot.forEach(doc => {
      const data = doc.data();
      completed.push(data.problemId);
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

    const problems = CODING_PROBLEMS.map(p => ({
      ...p,
      solved: solvedIds.has(p.id),
      // Hide solution unless it's explicitly requested later
      solution: undefined 
    }));
    res.json(problems);
  } catch (err) {
    res.status(500).json({ message: "Failed to load problems" });
  }
});

// GET /api/coding/problems/:id
router.get('/problems/:id', auth, (req, res) => {
  const problem = CODING_PROBLEMS.find(p => p.id === req.params.id);
  if (problem) {
    // Send without solution to prevent cheating via API inspection
    const { solution, ...safeProblem } = problem;
    res.json(safeProblem);
  } else {
    res.status(404).json({ message: 'Problem not found' });
  }
});

// GET /api/coding/problems/:id/solution
router.get('/problems/:id/solution', auth, (req, res) => {
  const problem = CODING_PROBLEMS.find(p => p.id === req.params.id);
  if (problem) {
    res.json({ solution: problem.solution });
  } else {
    res.status(404).json({ message: 'Problem not found' });
  }
});

// POST /api/coding/submit
router.post('/submit', auth, async (req, res) => {
  const { problemId, code, language } = req.body;
  const uid = req.user.id;
  const problem = CODING_PROBLEMS.find(p => p.id === problemId);
  
  if (!problem || !code) {
    return res.status(400).json({ message: "Invalid request parameters" });
  }

  if (!genAI) {
    return res.status(500).json({ message: "AI Evaluation is not configured." });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Custom prompt logic depending on topic
    let evaluationPrompt = "";
    if (problem.topic === "Aptitude") {
      evaluationPrompt = `
You are an expert evaluator. The user has submitted an answer for an Aptitude problem: "${problem.title}".
Problem: ${problem.description}
Solution should be around: ${problem.solution}

User's Answer:
${code}

Did the user logically solve the problem and reach the correct final answer?
Respond ONLY with a JSON object:
{ "passed": true/false, "feedback": "A concise paragraph explaining what is good or what failed.", "syntaxError": null, "timeComplexity": "N/A", "spaceComplexity": "N/A" }`;
    } else if (problem.topic === "SQL") {
      evaluationPrompt = `
You are an expert SQL evaluator. The user has submitted a SQL query for: "${problem.title}".
Problem: ${problem.description}

User's SQL:
\`\`\`sql
${code}
\`\`\`

Evaluate the SQL query for syntax and correctness against the problem statement.
Respond ONLY with a JSON object:
{ "passed": true/false, "feedback": "A concise paragraph explaining what is good or what failed.", "syntaxError": "Describe syntax errors if any", "timeComplexity": "N/A", "spaceComplexity": "N/A" }`;
    } else {
      evaluationPrompt = `
You are an expert technical interviewer and code evaluator.
The user has submitted code for the problem: "${problem.title}".

Problem Description:
${problem.description}

User's Code (${language}):
\`\`\`${language}
${code}
\`\`\`

Evaluate the code on: 1. Syntax, 2. Correctness (Edge cases), 3. Complexity.
Respond ONLY with a JSON object:
{ "passed": true/false, "syntaxError": "Describe any syntax errors, or null if none", "feedback": "A concise paragraph explaining what is good or what failed.", "timeComplexity": "e.g., O(n)", "spaceComplexity": "e.g., O(1)" }`;
    }
    
    const result = await model.generateContent(evaluationPrompt);
    let jsonStr = result.response.text().trim();
    if (jsonStr.startsWith('\`\`\`json')) jsonStr = jsonStr.slice(7);
    if (jsonStr.startsWith('\`\`\`')) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith('\`\`\`')) jsonStr = jsonStr.slice(0, -3);
    jsonStr = jsonStr.trim();
    
    const evalResult = JSON.parse(jsonStr);
    
    // 1. Update codingSubmissions
    const submissionRef = db.collection("codingSubmissions").doc();
    await submissionRef.set({
      uid,
      problemId,
      language,
      code,
      status: evalResult.passed ? 'completed' : 'failed',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    if (evalResult.passed) {
      const userRef = db.collection("users").doc(uid);
      const userDoc = await userRef.get();
      const userData = userDoc.data() || {};
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let streak = userData.codingStreak || 0;
      let alreadyPracticedToday = false;
      
      if (userData.lastActiveDate) {
        const lastActiveDay = userData.lastActiveDate.toDate();
        lastActiveDay.setHours(0, 0, 0, 0);
        
        const diffTime = Math.abs(today - lastActiveDay);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          streak += 1;
        } else if (diffDays > 1) {
          streak = 1; // reset streak
        } else {
          alreadyPracticedToday = true;
        }
      } else {
        streak = 1;
      }

      // 2. Check if first time solved using codingSubmissions
      const previouslySolved = await db.collection("codingSubmissions")
        .where("uid", "==", uid)
        .where("problemId", "==", problemId)
        .where("status", "==", "completed")
        .get();
        
      const isFirstTimeSolved = previouslySolved.size <= 1; // including the one we just saved

      let xpEarned = 0;
      let coinsEarned = 0;

      if (isFirstTimeSolved) {
        xpEarned = problem.xp || 10;
        coinsEarned = problem.coins || 5;
        
        // Batch update user stats
        await userRef.update({
          total_points: (userData.total_points || 0) + xpEarned,
          coins: (userData.coins || 0) + coinsEarned,
          codingStreak: streak,
          lastActiveDate: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update codingStats
        const statsRef = db.collection("codingStats").doc(uid);
        const statsDoc = await statsRef.get();
        if (statsDoc.exists) {
          await statsRef.update({
            totalXp: admin.firestore.FieldValue.increment(xpEarned),
            coinsEarned: admin.firestore.FieldValue.increment(coinsEarned),
            completedCount: admin.firestore.FieldValue.increment(1),
            streak: streak
          });
        } else {
          await statsRef.set({
            uid,
            totalXp: xpEarned,
            coinsEarned,
            completedCount: 1,
            streak: streak
          });
        }

        // Log point ledger
        await db.collection("point_ledger").add({
          student_id: uid,
          action: `solved_${problemId}`,
          points: xpEarned,
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
      } else if (!alreadyPracticedToday) {
        // Just update streak/activity date
        await userRef.update({
          codingStreak: streak,
          lastActiveDate: admin.firestore.FieldValue.serverTimestamp()
        });
        const statsRef = db.collection("codingStats").doc(uid);
        await statsRef.set({ streak: streak }, { merge: true });
      }

      evalResult.xpEarned = xpEarned;
      evalResult.coinsEarned = coinsEarned;
      evalResult.newStreak = streak;

      // Trigger dashboard and readiness sync (asynchronously)
      syncDashboard(uid);
    }
    
    res.json(evalResult);
    
  } catch (error) {
    console.error("AI Evaluation error:", error);
    res.status(500).json({ message: "Failed to evaluate code." });
  }
});

module.exports = router;
