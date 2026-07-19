const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

// Middleware to verify if user is a member of the team
const verifyTeamMember = async (req, res, next) => {
  const { teamId } = req.params;
  try {
    const memberSnapshot = await db.collection("team_members")
      .where("team_id", "==", teamId)
      .where("user_id", "==", req.user.id)
      .get();
      
    if (memberSnapshot.empty) {
      return res.status(403).json({ message: "Access denied. Not a team member." });
    }
    
    req.teamRole = memberSnapshot.docs[0].data().role;
    next();
  } catch (err) {
    console.error("Team verification error:", err);
    res.status(500).json({ message: "Server error verifying team access." });
  }
};

// Helper function to log activity
const logActivity = async (teamId, userId, action, details) => {
  try {
    const userDoc = await db.collection("profiles").doc(userId).get();
    const userName = userDoc.exists ? (userDoc.data().personalInfo?.name || "A member") : "A member";
    
    await db.collection("team_activity").add({
      team_id: teamId,
      user_id: userId,
      user_name: userName,
      action,
      details,
      created_at: new Date()
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
};

// ==========================================
// TASKS (KANBAN)
// ==========================================

router.get("/:teamId/tasks", auth, verifyTeamMember, async (req, res) => {
  try {
    const snapshot = await db.collection("team_tasks")
      .where("team_id", "==", req.params.teamId)
      .orderBy("created_at", "desc")
      .get();
      
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(tasks);
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ message: "Failed to fetch tasks." });
  }
});

router.post("/:teamId/tasks", auth, verifyTeamMember, async (req, res) => {
  const { title, description, status, assignee, priority, due_date } = req.body;
  if (!title) return res.status(400).json({ message: "Task title is required." });

  try {
    const newTaskRef = db.collection("team_tasks").doc();
    const taskData = {
      team_id: req.params.teamId,
      title,
      description: description || "",
      status: status || "To Do",
      assignee: assignee || null,
      priority: priority || "Medium",
      due_date: due_date || null,
      created_by: req.user.id,
      created_at: new Date()
    };
    
    await newTaskRef.set(taskData);
    await logActivity(req.params.teamId, req.user.id, "created a task", title);
    
    res.json({ id: newTaskRef.id, ...taskData });
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ message: "Failed to create task." });
  }
});

router.put("/:teamId/tasks/:taskId", auth, verifyTeamMember, async (req, res) => {
  try {
    const taskRef = db.collection("team_tasks").doc(req.params.taskId);
    const taskDoc = await taskRef.get();
    
    if (!taskDoc.exists) {
      return res.status(404).json({ message: "Task not found." });
    }
    
    const oldStatus = taskDoc.data().status;
    const updates = { ...req.body, updated_at: new Date() };
    
    // Don't allow changing team_id
    delete updates.team_id;
    delete updates.id;
    
    await taskRef.update(updates);
    
    if (updates.status && updates.status !== oldStatus) {
      await logActivity(
        req.params.teamId, 
        req.user.id, 
        "moved task", 
        `"${taskDoc.data().title}" to ${updates.status}`
      );
    }
    
    res.json({ id: req.params.taskId, ...taskDoc.data(), ...updates });
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ message: "Failed to update task." });
  }
});

router.delete("/:teamId/tasks/:taskId", auth, verifyTeamMember, async (req, res) => {
  try {
    const taskRef = db.collection("team_tasks").doc(req.params.taskId);
    const taskDoc = await taskRef.get();
    
    if (taskDoc.exists) {
      await logActivity(req.params.teamId, req.user.id, "deleted a task", taskDoc.data().title);
      await taskRef.delete();
    }
    
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ message: "Failed to delete task." });
  }
});

// ==========================================
// FILES (LINKS)
// ==========================================

router.get("/:teamId/files", auth, verifyTeamMember, async (req, res) => {
  try {
    const snapshot = await db.collection("team_files")
      .where("team_id", "==", req.params.teamId)
      .orderBy("created_at", "desc")
      .get();
      
    const files = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(files);
  } catch (err) {
    console.error("Get files error:", err);
    res.status(500).json({ message: "Failed to fetch files." });
  }
});

router.post("/:teamId/files", auth, verifyTeamMember, async (req, res) => {
  const { title, url, type } = req.body;
  if (!title || !url) return res.status(400).json({ message: "Title and URL are required." });

  try {
    const newFileRef = db.collection("team_files").doc();
    const fileData = {
      team_id: req.params.teamId,
      title,
      url,
      type: type || "link", // 'link', 'doc', 'design', 'repo'
      created_by: req.user.id,
      created_at: new Date()
    };
    
    await newFileRef.set(fileData);
    await logActivity(req.params.teamId, req.user.id, "shared a file", title);
    
    res.json({ id: newFileRef.id, ...fileData });
  } catch (err) {
    console.error("Create file error:", err);
    res.status(500).json({ message: "Failed to add file." });
  }
});

// ==========================================
// ANNOUNCEMENTS
// ==========================================

router.get("/:teamId/announcements", auth, verifyTeamMember, async (req, res) => {
  try {
    const snapshot = await db.collection("team_announcements")
      .where("team_id", "==", req.params.teamId)
      .orderBy("created_at", "desc")
      .get();
      
    const announcements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(announcements);
  } catch (err) {
    console.error("Get announcements error:", err);
    res.status(500).json({ message: "Failed to fetch announcements." });
  }
});

router.post("/:teamId/announcements", auth, verifyTeamMember, async (req, res) => {
  const { content, priority } = req.body;
  if (!content) return res.status(400).json({ message: "Content is required." });

  try {
    const newAnnounceRef = db.collection("team_announcements").doc();
    
    const userDoc = await db.collection("profiles").doc(req.user.id).get();
    const userName = userDoc.exists ? (userDoc.data().personalInfo?.name || "A member") : "A member";
    
    const announceData = {
      team_id: req.params.teamId,
      content,
      priority: priority || "normal",
      author_id: req.user.id,
      author_name: userName,
      created_at: new Date()
    };
    
    await newAnnounceRef.set(announceData);
    await logActivity(req.params.teamId, req.user.id, "posted an announcement", "");
    
    res.json({ id: newAnnounceRef.id, ...announceData });
  } catch (err) {
    console.error("Create announcement error:", err);
    res.status(500).json({ message: "Failed to create announcement." });
  }
});

// ==========================================
// ACTIVITY TIMELINE
// ==========================================

router.get("/:teamId/activity", auth, verifyTeamMember, async (req, res) => {
  try {
    const snapshot = await db.collection("team_activity")
      .where("team_id", "==", req.params.teamId)
      .orderBy("created_at", "desc")
      .limit(50)
      .get();
      
    const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(activities);
  } catch (err) {
    console.error("Get activity error:", err);
    res.status(500).json({ message: "Failed to fetch activity timeline." });
  }
});

// Get team workspace details (with basic progress stats)
router.get("/:teamId/dashboard", auth, verifyTeamMember, async (req, res) => {
  try {
    const teamDoc = await db.collection("teams").doc(req.params.teamId).get();
    if (!teamDoc.exists) return res.status(404).json({ message: "Team not found" });
    
    const [tasksSnapshot, membersSnapshot] = await Promise.all([
      db.collection("team_tasks").where("team_id", "==", req.params.teamId).get(),
      db.collection("team_members").where("team_id", "==", req.params.teamId).get()
    ]);
    
    const tasks = tasksSnapshot.docs.map(d => d.data());
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "Done").length;
    
    // Collect members info
    const membersList = await Promise.all(membersSnapshot.docs.map(async d => {
      const md = d.data();
      const pDoc = await db.collection("profiles").doc(md.user_id).get();
      return {
        id: md.user_id,
        role: md.role,
        name: pDoc.exists ? pDoc.data().personalInfo?.name : "Unknown",
        skills: pDoc.exists ? (pDoc.data().skills || []) : []
      };
    }));
    
    res.json({
      team: { id: teamDoc.id, ...teamDoc.data() },
      stats: {
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        progress_percentage: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
        member_count: membersSnapshot.size
      },
      members: membersList
    });
  } catch (err) {
    console.error("Get dashboard error:", err);
    res.status(500).json({ message: "Failed to fetch dashboard data." });
  }
});

module.exports = router;
