const express = require('express');
const router = express.Router();
const { db, admin } = require("../config/firebase");
const auth = require("../middleware/auth");
const { syncDashboard } = require("../services/dashboardService");
require('dotenv').config();

const { getConfiguredModel, genAI } = require("../utils/aiConfig");

// GET /api/interviews/history
// Returns user's past interviews
router.get('/history', auth, async (req, res) => {
  try {
    const snapshot = await db.collection("mockInterviews").where("uid", "==", req.user.id).orderBy("createdAt", "desc").get();
    const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch history" });
  }
});

// POST /api/interviews/start
router.post('/start', auth, async (req, res) => {
  const { type, role } = req.body;
  if (!genAI) return res.status(500).json({ message: "AI not configured" });

  try {
    const sessionRef = db.collection("interviewSessions").doc();
    const model = await getConfiguredModel();

    const prompt = `
You are an expert ${type} interviewer for a ${role} position. 
We are starting a mock interview. Introduce yourself briefly and ask the first question.
Keep it conversational, natural, and concise (1-2 sentences). Do not include any formatting or placeholders.
`;
    
    const result = await model.generateContent(prompt);
    const firstQuestion = result.response.text().trim();

    const newSession = {
      uid: req.user.id,
      type,
      role,
      transcript: [
        { role: 'interviewer', text: firstQuestion }
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await sessionRef.set(newSession);

    res.json({ sessionId: sessionRef.id, question: firstQuestion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to start interview" });
  }
});

// POST /api/interviews/reply
router.post('/reply', auth, async (req, res) => {
  const { sessionId, answer } = req.body;
  if (!genAI) return res.status(500).json({ message: "AI not configured" });

  try {
    const sessionRef = db.collection("interviewSessions").doc(sessionId);
    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) return res.status(404).json({ message: "Session not found" });
    
    const sessionData = sessionDoc.data();
    if (sessionData.uid !== req.user.id) return res.status(403).json({ message: "Unauthorized" });

    const transcript = sessionData.transcript;
    transcript.push({ role: 'candidate', text: answer });

    // Format history for Gemini
    const chatHistory = transcript.map(t => 
      `${t.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${t.text}`
    ).join('\n');

    const prompt = `
You are an expert ${sessionData.type} interviewer for a ${sessionData.role} position.
Here is the transcript of the interview so far:
${chatHistory}

The candidate just answered. 
Evaluate their answer internally. Then, respond directly to them as the interviewer.
You can acknowledge their answer, ask a follow-up question, or move on to the next topic.
Keep your response conversational, natural, and concise (2-4 sentences max). Do not break character. Do not provide a formal score here.
`;

    const model = await getConfiguredModel();
    const result = await model.generateContent(prompt);
    const nextResponse = result.response.text().trim();

    transcript.push({ role: 'interviewer', text: nextResponse });
    await sessionRef.update({ transcript });

    res.json({ response: nextResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to process reply" });
  }
});

// POST /api/interviews/end
router.post('/end', auth, async (req, res) => {
  const { sessionId, wpm } = req.body; // wpm = words per minute calculated on frontend
  
  if (!genAI) return res.status(500).json({ message: "AI not configured" });

  try {
    const sessionRef = db.collection("interviewSessions").doc(sessionId);
    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) return res.status(404).json({ message: "Session not found" });
    const sessionData = sessionDoc.data();

    const chatHistory = sessionData.transcript.map(t => 
      `${t.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${t.text}`
    ).join('\n');

    const prompt = `
You are an expert interview coach. Review the following transcript of a ${sessionData.type} mock interview for a ${sessionData.role} position.

Transcript:
${chatHistory}

Provide a comprehensive JSON evaluation containing:
{
  "confidenceScore": 85, // 0-100 based on phrasing, filler words
  "communicationScore": 90, // 0-100 based on clarity and structure
  "technicalAccuracy": 80, // 0-100 based on correctness of technical answers (if applicable, else default to 85)
  "feedback": "A solid paragraph summarizing their performance, highlighting strengths and areas for improvement."
}
Respond ONLY with valid JSON.
`;

    const model = await getConfiguredModel();
    const result = await model.generateContent(prompt);
    let jsonStr = result.response.text().trim();
    if (jsonStr.startsWith('\`\`\`json')) jsonStr = jsonStr.slice(7);
    if (jsonStr.startsWith('\`\`\`')) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith('\`\`\`')) jsonStr = jsonStr.slice(0, -3);
    jsonStr = jsonStr.trim();

    const evaluation = JSON.parse(jsonStr);

    const finalResult = {
      uid: req.user.id,
      type: sessionData.type,
      role: sessionData.role,
      transcript: sessionData.transcript,
      wpm: wpm || 0,
      ...evaluation,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save final report to 'interviews' collection
    const reportRef = db.collection("mockInterviews").doc();
    await reportRef.set(finalResult);

    // Delete active session
    await sessionRef.delete();

    // Trigger dashboard and readiness sync
    syncDashboard(req.user.id);

    res.json(finalResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate report" });
  }
});

module.exports = router;
