const express = require("express");
const router = express.Router();
const { db, admin } = require("../config/firebase");
const auth = require("../middleware/auth");
const { awardPoints, updatePlacementScore } = require("../utils/scoring");

// Setup Gemini
const { getConfiguredModel, genAI } = require("../utils/aiConfig");

// Helper to generate a fallback mock roadmap if no API key
const generateMockRoadmap = (goal) => {
  return {
    goal: goal || "Software Developer",
    overall_progress: 0,
    steps: [
      {
        id: "step_1",
        title: "Programming Basics",
        status: "pending",
        estimated_time: "2 Weeks",
        difficulty: "Beginner",
        resources: [
          { title: "Introduction to Computer Science", url: "https://example.com", type: "course" }
        ],
        tasks: [
          { id: "t1_1", title: "Learn variables and loops", completed: false },
          { id: "t1_2", title: "Write a simple calculator", completed: false }
        ],
        projects: []
      },
      {
        id: "step_2",
        title: "Object Oriented Programming",
        status: "pending",
        estimated_time: "3 Weeks",
        difficulty: "Intermediate",
        resources: [
          { title: "OOP Principles", url: "https://example.com", type: "article" }
        ],
        tasks: [
          { id: "t2_1", title: "Understand Classes and Objects", completed: false },
          { id: "t2_2", title: "Implement Inheritance", completed: false }
        ],
        projects: [
          { title: "Library Management System", description: "Build a console app to manage books using OOP." }
        ]
      }
    ]
  };
};

// Get User's Roadmap
router.get("/career-roadmap", auth, async (req, res) => {
  try {
    const doc = await db.collection("userRoadmaps").doc(req.user.id).get();
    if (!doc.exists) {
      return res.json(null);
    }
    res.json(doc.data());
  } catch (err) {
    console.error("Error fetching roadmap:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// Legacy Get User's Roadmap (Aliased)
router.get("/", auth, async (req, res) => {
  try {
    const doc = await db.collection("userRoadmaps").doc(req.user.id).get();
    if (!doc.exists) {
      return res.json(null);
    }
    res.json(doc.data());
  } catch (err) {
    console.error("Error fetching roadmap:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// Generate Roadmap
router.post("/generate", auth, async (req, res) => {
  try {
    const uid = req.user.id;
    
    // Fetch user context
    const profileDoc = await db.collection("profiles").doc(uid).get();
    
    const p = profileDoc.data() || {};
    const goal = p.careerGoal || "Software Engineer";
    
    let roadmapData = null;
    
    if (genAI) {
      const model = await getConfiguredModel();
      
      const prompt = `
      You are an expert career advisor. Generate a highly personalized learning roadmap for a student aiming to become a ${goal}.
      
      Student Context:
      - Current Skills: ${(p.skills || []).join(", ") || "Beginner"}
      - Experience Level: ${p.experienceLevel || "Beginner"}
      - Daily Learning Time: 2 hours
      - Target Placement: 6 months
      - Interests: ${(p.interests || []).join(", ") || "General Tech"}
      
      Output the roadmap STRICTLY in the following JSON format. Do not use Markdown formatting or code blocks. Just output raw JSON.
      {
        "goal": "${goal}",
        "overall_progress": 0,
        "steps": [
          {
            "id": "unique_string_id",
            "title": "Step Title (e.g., Java Basics)",
            "status": "pending",
            "estimated_time": "Time (e.g., 2 Weeks)",
            "difficulty": "Beginner/Intermediate/Advanced",
            "resources": [
              { "title": "Resource Name", "url": "URL (use generic # if unknown)", "type": "course|video|article" }
            ],
            "tasks": [
              { "id": "task_unique_id", "title": "Task description", "completed": false }
            ],
            "projects": [
              { "title": "Project Name", "description": "Short description" }
            ]
          }
        ]
      }
      Generate 5 to 7 steps representing a logical progression.
      `;
      
      try {
        const result = await model.generateContent(prompt);
        let text = result.response.text();
        
        // Strip markdown backticks if present
        if (text.startsWith('```json')) text = text.replace(/^```json/, '');
        if (text.startsWith('```')) text = text.replace(/^```/, '');
        text = text.replace(/```$/, '').trim();
        
        roadmapData = JSON.parse(text);
      } catch (aiError) {
        console.error("AI Generation failed:", aiError);
        // Fallback
        roadmapData = generateMockRoadmap(goal);
      }
    } else {
      // Fallback
      roadmapData = generateMockRoadmap(goal);
    }
    
    // Add metadata
    roadmapData.generated_at = admin.firestore.FieldValue.serverTimestamp();
    roadmapData.uid = uid;
    
    await db.collection("userRoadmaps").doc(uid).set(roadmapData);
    
    res.json(roadmapData);
  } catch (err) {
    console.error("Error generating roadmap:", err);
    res.status(500).json({ message: "Server error generating roadmap." });
  }
});

// Update Roadmap step/task
router.put("/roadmap-progress", auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const { stepId, taskId, completed } = req.body;
    
    const docRef = db.collection("userRoadmaps").doc(uid);
    
    const result = await db.runTransaction(async (t) => {
      const doc = await t.get(docRef);
      if (!doc.exists) {
        throw new Error("Roadmap not found.");
      }
      
      const data = doc.data();
      let totalTasks = 0;
      let completedTasks = 0;
      let newlyCompletedStep = false;
      
      const newSteps = data.steps.map(step => {
        let stepCompletedTasks = 0;
        
        const newTasks = step.tasks.map(task => {
          const isTarget = step.id === stepId && task.id === taskId;
          const taskCompleted = isTarget ? completed : task.completed;
          
          if (taskCompleted) stepCompletedTasks++;
          
          return { ...task, completed: taskCompleted };
        });
        
        totalTasks += newTasks.length;
        completedTasks += stepCompletedTasks;
        
        let stepStatus = "pending";
        if (stepCompletedTasks > 0) stepStatus = "in_progress";
        if (stepCompletedTasks === newTasks.length && newTasks.length > 0) stepStatus = "completed";
        
        if (step.status !== "completed" && stepStatus === "completed") {
          newlyCompletedStep = true;
        }
        
        return { ...step, tasks: newTasks, status: stepStatus };
      });
      
      const overallProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
      
      t.update(docRef, {
        steps: newSteps,
        overall_progress: overallProgress,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      const progressRef = db.collection("roadmapProgress").doc(uid);
      t.set(progressRef, {
        overall_progress: overallProgress,
        completedSteps: newSteps.filter(s => s.status === 'completed').map(s => s.id),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      return { newSteps, overallProgress, newlyCompletedStep };
    });

    if (result.newlyCompletedStep) {
      await awardPoints(uid, 'roadmap_step', 50);
    }
    await updatePlacementScore(uid);
    
    res.json({ success: true, steps: result.newSteps, overall_progress: result.overallProgress });
  } catch (err) {
    console.error("Error updating roadmap:", err);
    res.status(err.message === "Roadmap not found." ? 404 : 500).json({ message: err.message || "Server error." });
  }
});

// Legacy Update Roadmap step/task (Aliased)
router.put("/step", auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const { stepId, taskId, completed } = req.body;
    
    const docRef = db.collection("userRoadmaps").doc(uid);
    
    const result = await db.runTransaction(async (t) => {
      const doc = await t.get(docRef);
      if (!doc.exists) {
        throw new Error("Roadmap not found.");
      }
      
      const data = doc.data();
      let totalTasks = 0;
      let completedTasks = 0;
      let newlyCompletedStep = false;
      
      const newSteps = data.steps.map(step => {
        let stepCompletedTasks = 0;
        
        const newTasks = step.tasks.map(task => {
          const isTarget = step.id === stepId && task.id === taskId;
          const taskCompleted = isTarget ? completed : task.completed;
          
          if (taskCompleted) stepCompletedTasks++;
          
          return { ...task, completed: taskCompleted };
        });
        
        totalTasks += newTasks.length;
        completedTasks += stepCompletedTasks;
        
        let stepStatus = "pending";
        if (stepCompletedTasks > 0) stepStatus = "in_progress";
        if (stepCompletedTasks === newTasks.length && newTasks.length > 0) stepStatus = "completed";
        
        if (step.status !== "completed" && stepStatus === "completed") {
          newlyCompletedStep = true;
        }
        
        return { ...step, tasks: newTasks, status: stepStatus };
      });
      
      const overallProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
      
      t.update(docRef, {
        steps: newSteps,
        overall_progress: overallProgress,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      const progressRef = db.collection("roadmapProgress").doc(uid);
      t.set(progressRef, {
        overall_progress: overallProgress,
        completedSteps: newSteps.filter(s => s.status === 'completed').map(s => s.id),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      return { newSteps, overallProgress, newlyCompletedStep };
    });

    if (result.newlyCompletedStep) {
      await awardPoints(uid, 'roadmap_step', 50);
    }
    await updatePlacementScore(uid);
    
    res.json({ success: true, steps: result.newSteps, overall_progress: result.overallProgress });
  } catch (err) {
    console.error("Error updating roadmap:", err);
    res.status(err.message === "Roadmap not found." ? 404 : 500).json({ message: err.message || "Server error." });
  }
});

// Generate Step Content
router.post("/step/:stepId/generate-content", auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const { stepId } = req.params;
    
    const docRef = db.collection("userRoadmaps").doc(uid);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ message: "Roadmap not found." });
    }
    
    const data = doc.data();
    const stepIndex = data.steps.findIndex(s => s.id === stepId);
    
    if (stepIndex === -1) {
      return res.status(404).json({ message: "Step not found." });
    }
    
    const step = data.steps[stepIndex];
    if (step.content) {
      return res.json({ success: true, content: step.content });
    }
    
    let content = null;
    
    if (genAI) {
      const model = await getConfiguredModel();
      const prompt = `
      You are an expert technical instructor. A student is learning "${step.title}" as part of their goal to become a ${data.goal}.
      
      Generate a comprehensive learning module for this specific step. Output STRICTLY valid JSON only. Do not use Markdown backticks.
      
      Schema:
      {
        "videos": [{ "title": "...", "url": "..." }],
        "articles": [{ "title": "...", "url": "..." }],
        "notes": "Detailed Markdown formatted notes explaining the core concepts of this topic.",
        "pdfs": [{ "title": "...", "url": "..." }],
        "assignments": [{ "id": "a1", "title": "...", "description": "...", "completed": false }],
        "quiz": [{ "id": "q1", "question": "...", "options": ["A", "B", "C", "D"], "answer": 0 }]
      }
      
      Provide exactly 3 quiz questions. Keep URLs generic (#) if unknown.
      `;
      
      try {
        const result = await model.generateContent(prompt);
        let text = result.response.text();
        if (text.startsWith('\`\`\`json')) text = text.replace(/^\`\`\`json/, '');
        if (text.startsWith('\`\`\`')) text = text.replace(/^\`\`\`/, '');
        text = text.replace(/\`\`\`$/, '').trim();
        content = JSON.parse(text);
      } catch (aiError) {
        console.error("AI Generation failed for content:", aiError);
      }
    }
    
    if (!content) {
      // Mock content
      content = {
        videos: [{ title: "Understanding " + step.title, url: "#" }],
        articles: [{ title: "Deep Dive into " + step.title, url: "#" }],
        notes: "### Introduction to " + step.title + "\\nThis is a mocked comprehensive note generated for testing.",
        pdfs: [{ title: step.title + " Cheatsheet", url: "#" }],
        assignments: [{ id: "a1", title: "Practice " + step.title, description: "Complete exercises.", completed: false }],
        quiz: [
          { id: "q1", question: "What is " + step.title + "?", options: ["Option A", "Option B", "Option C", "Option D"], answer: 0 }
        ]
      };
    }
    
    const newSteps = [...data.steps];
    newSteps[stepIndex].content = content;
    
    await docRef.update({
      steps: newSteps,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection("learningProgress").doc(uid).set({
      [`module_${stepId}`]: content,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    res.json({ success: true, content });
  } catch (err) {
    console.error("Error generating step content:", err);
    res.status(500).json({ message: "Server error generating content." });
  }
});

// Update Module Content Progress (Quiz/Assignments)
router.put("/step/:stepId/content-progress", auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const { stepId } = req.params;
    const { type, itemId, completed, score } = req.body; 
    // type: 'assignment' or 'quiz'
    
    const docRef = db.collection("userRoadmaps").doc(uid);
    const doc = await docRef.get();
    
    if (!doc.exists) return res.status(404).json({ message: "Roadmap not found." });
    const data = doc.data();
    
    const newSteps = data.steps.map(step => {
      if (step.id !== stepId) return step;
      
      const content = { ...step.content };
      
      if (type === 'assignment' && content.assignments) {
        content.assignments = content.assignments.map(a => 
          a.id === itemId ? { ...a, completed } : a
        );
      }
      
      if (type === 'quiz') {
        content.quizPassed = score >= 60; // arbitrarily, if score passed
        content.quizScore = score;
      }
      
      return { ...step, content };
    });
    
    await docRef.update({ steps: newSteps });
    
    await db.collection("learningProgress").doc(uid).set({
      [`module_${stepId}`]: newSteps.find(s => s.id === stepId).content,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.json({ success: true, steps: newSteps });
  } catch (err) {
    console.error("Error updating content progress:", err);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
