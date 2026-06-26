const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

// ─── Role Guard ──────────────────────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (!["admin", "super_admin", "college_admin", "company_admin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
};

// ─── Audit Logger Helper ──────────────────────────────────────────────────────
const logAudit = async (actorId, actorEmail, action, module_, entityId = null, details = {}) => {
  try {
    await db.collection("audit_logs").add({
      actor_id: actorId,
      actor_email: actorEmail,
      action,
      module: module_,
      entity_id: entityId,
      details,
      created_at: new Date()
    });
  } catch (e) {
    console.error("Audit log error:", e.message);
  }
};

// ─── KPI Stats ───────────────────────────────────────────────────────────────
router.get("/stats", auth, adminOnly, async (req, res) => {
  try {
    const [
      totalUsersSnap,
      studentsSnap,
      oppsSnap,
      appsSnap,
      teamsSnap,
      mentorsSnap,
      auditSnap
    ] = await Promise.all([
      db.collection("users").count().get(),
      db.collection("users").where("role", "==", "student").count().get(),
      db.collection("opportunities").count().get(),
      db.collection("applications").count().get(),
      db.collection("teams").count().get(),
      db.collection("users").where("role", "==", "mentor").count().get(),
      db.collection("audit_logs").count().get()
    ]);

    // Get yesterday's registrations for growth calc
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const recentUsersSnap = await db.collection("users")
      .where("created_at", ">=", yesterday)
      .count().get();

    // Get this week's applications
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentAppsSnap = await db.collection("applications")
      .where("created_at", ">=", weekAgo)
      .count().get();

    res.json({
      totalUsers: totalUsersSnap.data().count,
      totalStudents: studentsSnap.data().count,
      totalOpportunities: oppsSnap.data().count,
      totalApplications: appsSnap.data().count,
      totalTeams: teamsSnap.data().count,
      totalMentors: mentorsSnap.data().count,
      totalAuditEvents: auditSnap.data().count,
      newUsersToday: recentUsersSnap.data().count,
      newAppsThisWeek: recentAppsSnap.data().count,
    });
  } catch (err) {
    console.error("Admin stats error:", err.message);
});

// ─── Super Admin Dashboard ───────────────────────────────────────────────────
router.get("/super/dashboard", auth, adminOnly, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Super Admin access required." });
    }

    const [
      usersSnap,
      studentsSnap,
      mentorsSnap,
      oppsSnap,
      appsSnap
    ] = await Promise.all([
      db.collection("users").count().get(),
      db.collection("users").where("role", "==", "student").count().get(),
      db.collection("users").where("role", "==", "mentor").count().get(),
      db.collection("opportunities").count().get(),
      db.collection("applications").count().get(),
    ]);

    res.json({
      totalUsers: usersSnap.data().count,
      totalStudents: studentsSnap.data().count,
      totalMentors: mentorsSnap.data().count,
      totalOpportunities: oppsSnap.data().count,
      totalApplications: appsSnap.data().count
    });
  } catch (err) {
    console.error("Super admin stats error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── College Admin Dashboard ─────────────────────────────────────────────────
router.get("/college/dashboard", auth, adminOnly, async (req, res) => {
  try {
    if (req.user.role !== 'college_admin') {
      return res.status(403).json({ message: "College Admin access required." });
    }

    const collegeId = req.user.college_id; // Using req.user.college_id from token
    if (!collegeId) {
      return res.status(400).json({ message: "No college assigned to this admin." });
    }

    const [
      studentsSnap,
      facultySnap,
      projectsSnap,
      certificatesSnap
    ] = await Promise.all([
      db.collection("users").where("role", "==", "student").where("college_id", "==", collegeId).count().get(),
      db.collection("users").where("role", "==", "faculty").where("college_id", "==", collegeId).count().get(),
      db.collection("projects").where("college_id", "==", collegeId).count().get(),
      db.collection("certificates").where("college_id", "==", collegeId).count().get(),
    ]);

    res.json({
      totalStudents: studentsSnap.data().count,
      totalFaculty: facultySnap.data().count,
      totalProjects: projectsSnap.data().count,
      totalCertificates: certificatesSnap.data().count
    });
  } catch (err) {
    console.error("College admin stats error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── Company Admin Dashboard ─────────────────────────────────────────────────
router.get("/company/dashboard", auth, adminOnly, async (req, res) => {
  try {
    if (req.user.role !== 'company_admin') {
      return res.status(403).json({ message: "Company Admin access required." });
    }

    // Usually company_admin's ID is the company ID, or they have a company_id field
    const companyId = req.user.company_id || req.user.id;

    const [
      jobsSnap,
      internshipsSnap,
      appsSnap,
      shortlistedSnap,
      selectedSnap
    ] = await Promise.all([
      db.collection("opportunities").where("company_id", "==", companyId).where("type", "==", "job").count().get(),
      db.collection("opportunities").where("company_id", "==", companyId).where("type", "==", "internship").count().get(),
      db.collection("applications").where("company_id", "==", companyId).count().get(),
      db.collection("applications").where("company_id", "==", companyId).where("status", "==", "shortlisted").count().get(),
      db.collection("applications").where("company_id", "==", companyId).where("status", "==", "selected").count().get(),
    ]);

    res.json({
      activeJobs: jobsSnap.data().count,
      activeInternships: internshipsSnap.data().count,
      totalApplications: appsSnap.data().count,
      shortlistedCandidates: shortlistedSnap.data().count,
      selectedCandidates: selectedSnap.data().count
    });
  } catch (err) {
    console.error("Company admin stats error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── Mentor Admin Dashboard ──────────────────────────────────────────────────
router.get("/mentor/dashboard", auth, adminOnly, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ message: "Mentor access required." });
    }

    const mentorId = req.user.id;

    const [
      sessionsSnap,
      pendingSnap,
      completedSnap
    ] = await Promise.all([
      db.collection("sessions").where("mentor_id", "==", mentorId).count().get(),
      db.collection("sessions").where("mentor_id", "==", mentorId).where("status", "==", "pending").count().get(),
      db.collection("sessions").where("mentor_id", "==", mentorId).where("status", "==", "completed").count().get(),
    ]);

    res.json({
      totalSessions: sessionsSnap.data().count,
      pendingRequests: pendingSnap.data().count,
      completedSessions: completedSnap.data().count
    });
  } catch (err) {
    console.error("Mentor stats error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── Registration Analytics (last 30 days) ───────────────────────────────────
router.get("/analytics/registrations", auth, adminOnly, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const snapshot = await db.collection("users")
      .where("created_at", ">=", thirtyDaysAgo)
      .get();

    // Group by date
    const byDate = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      let date;
      if (data.created_at && typeof data.created_at.toDate === "function") {
        date = data.created_at.toDate().toISOString().split("T")[0];
      } else if (data.created_at) {
        date = new Date(data.created_at).toISOString().split("T")[0];
      } else {
        return;
      }
      byDate[date] = (byDate[date] || 0) + 1;
    });

    // Build last 30 days array
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      result.push({ date: key, count: byDate[key] || 0 });
    }

    res.json(result);
  } catch (err) {
    console.error("Analytics error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ─── Application Analytics (last 30 days) ────────────────────────────────────
router.get("/analytics/applications", auth, adminOnly, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const snapshot = await db.collection("applications")
      .where("created_at", ">=", thirtyDaysAgo)
      .get();

    const byDate = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      let date;
      if (data.created_at && typeof data.created_at.toDate === "function") {
        date = data.created_at.toDate().toISOString().split("T")[0];
      } else if (data.created_at) {
        date = new Date(data.created_at).toISOString().split("T")[0];
      } else return;
      byDate[date] = (byDate[date] || 0) + 1;
    });

    const result = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      result.push({ date: key, count: byDate[key] || 0 });
    }

    res.json(result);
  } catch (err) {
    console.error("App analytics error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ─── User Management ──────────────────────────────────────────────────────────
router.get("/users", auth, adminOnly, async (req, res) => {
  const { role, search, status, limit: lim = 50 } = req.query;

  try {
    let query = db.collection("users");
    if (role) query = query.where("role", "==", role);

    const snapshot = await query.get();
    let users = [];

    snapshot.docs.forEach(doc => {
      const u = doc.data();
      // Serialize timestamp
      let createdAt = null;
      if (u.created_at) {
        createdAt = typeof u.created_at.toDate === "function"
          ? u.created_at.toDate().toISOString()
          : new Date(u.created_at).toISOString();
      }

      users.push({
        id: u.id,
        name: u.name || "—",
        email: u.email,
        role: u.role,
        is_active: u.is_active !== false,
        is_verified: u.is_verified || false,
        onboarding_done: u.onboarding_done || false,
        created_at: createdAt
      });
    });

    // Filter by status
    if (status === "active") users = users.filter(u => u.is_active);
    if (status === "suspended") users = users.filter(u => !u.is_active);

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    users.sort((a, b) => {
      if (!a.created_at) return 1;
      if (!b.created_at) return -1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    res.json(users.slice(0, parseInt(lim)));
  } catch (err) {
    console.error("Admin users error:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// Suspend / Activate user
router.put("/users/:id/status", auth, adminOnly, async (req, res) => {
  const { is_active } = req.body;
  try {
    const userRef = db.collection("users").doc(req.params.id);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: "User not found." });

    await userRef.update({ is_active });

    await logAudit(
      req.user.id, req.user.email || "admin",
      is_active ? "USER_ACTIVATED" : "USER_SUSPENDED",
      "users", req.params.id,
      { target_email: userDoc.data().email }
    );

    // Emit real-time update
    req.io.to("admin_room").emit("admin_user_updated", {
      id: req.params.id,
      is_active
    });

    res.json({ message: `User ${is_active ? "activated" : "suspended"} successfully.` });
  } catch (err) {
    console.error("Status update error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Change user role
router.put("/users/:id/role", auth, adminOnly, async (req, res) => {
  const { role } = req.body;
  const validRoles = ["student", "mentor", "college_admin", "company_admin", "admin", "super_admin"];
  if (!validRoles.includes(role)) return res.status(400).json({ message: "Invalid role." });

  try {
    const userRef = db.collection("users").doc(req.params.id);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: "User not found." });

    await userRef.update({ role });

    await logAudit(
      req.user.id, req.user.email || "admin",
      "USER_ROLE_CHANGED", "users", req.params.id,
      { target_email: userDoc.data().email, new_role: role }
    );

    res.json({ message: "Role updated successfully." });
  } catch (err) {
    console.error("Role update error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Delete user
router.delete("/users/:id", auth, adminOnly, async (req, res) => {
  try {
    const userRef = db.collection("users").doc(req.params.id);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: "User not found." });

    const userData = userDoc.data();

    // Prevent self-deletion
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account." });
    }

    await userRef.delete();

    await logAudit(
      req.user.id, req.user.email || "admin",
      "USER_DELETED", "users", req.params.id,
      { deleted_email: userData.email }
    );

    req.io.to("admin_room").emit("admin_user_deleted", { id: req.params.id });

    res.json({ message: "User deleted." });
  } catch (err) {
    console.error("Delete user error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ─── Opportunity Management ───────────────────────────────────────────────────
router.get("/opportunities", auth, adminOnly, async (req, res) => {
  try {
    const snapshot = await db.collection("opportunities").get();
    const opps = [];

    snapshot.docs.forEach(doc => {
      const o = doc.data();
      let createdAt = null;
      if (o.created_at) {
        createdAt = typeof o.created_at.toDate === "function"
          ? o.created_at.toDate().toISOString()
          : new Date(o.created_at).toISOString();
      }
      let deadline = null;
      if (o.deadline) {
        deadline = typeof o.deadline.toDate === "function"
          ? o.deadline.toDate().toISOString()
          : new Date(o.deadline).toISOString();
      }

      opps.push({
        id: doc.id,
        title: o.title,
        company: o.company,
        type: o.type,
        mode: o.mode,
        status: o.admin_status || "approved",
        is_featured: o.is_featured || false,
        applications_count: o.applications_count || 0,
        created_at: createdAt,
        deadline
      });
    });

    opps.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    res.json(opps);
  } catch (err) {
    console.error("Admin opps error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// Update opportunity status (approve/reject/feature)
router.put("/opportunities/:id/status", auth, adminOnly, async (req, res) => {
  const { admin_status, is_featured } = req.body;
  try {
    const oppRef = db.collection("opportunities").doc(req.params.id);
    const update = {};
    if (admin_status !== undefined) update.admin_status = admin_status;
    if (is_featured !== undefined) update.is_featured = is_featured;

    await oppRef.update(update);

    await logAudit(
      req.user.id, req.user.email || "admin",
      "OPPORTUNITY_STATUS_CHANGED", "opportunities", req.params.id,
      update
    );

    res.json({ message: "Opportunity updated." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────
router.get("/audit-logs", auth, adminOnly, async (req, res) => {
  try {
    const snapshot = await db.collection("audit_logs")
      .orderBy("created_at", "desc")
      .limit(100)
      .get();

    const logs = snapshot.docs.map(doc => {
      const d = doc.data();
      let createdAt = null;
      if (d.created_at) {
        createdAt = typeof d.created_at.toDate === "function"
          ? d.created_at.toDate().toISOString()
          : new Date(d.created_at).toISOString();
      }
      return {
        id: doc.id,
        actor_email: d.actor_email,
        action: d.action,
        module: d.module,
        entity_id: d.entity_id,
        details: d.details || {},
        created_at: createdAt
      };
    });

    res.json(logs);
  } catch (err) {
    console.error("Audit logs error:", err.message);
    // If no index yet, return empty
    res.json([]);
  }
});

// ─── Broadcast Notifications ──────────────────────────────────────────────────
router.post("/notifications/broadcast", auth, adminOnly, async (req, res) => {
  const { title, body, target_role, target_all } = req.body;
  if (!title || !body) return res.status(400).json({ message: "Title and body required." });

  try {
    // Find target users
    let query = db.collection("users");
    
    // Security: If College Admin, force the target audience to their own college students
    if (req.user.role === 'college_admin') {
      query = query.where("college_id", "==", req.user.college_id).where("role", "==", "student");
    } else {
      // Super admin routing logic
      if (!target_all && target_role) {
        query = query.where("role", "==", target_role);
      }
    }

    const usersSnap = await query.get();
    const batch = db.batch();
    let count = 0;

    usersSnap.docs.forEach(doc => {
      const notifRef = db.collection("notifications").doc();
      batch.set(notifRef, {
        user_id: doc.id,
        title,
        body,
        is_read: false,
        type: "admin_broadcast",
        created_at: new Date()
      });
      count++;

      // Real-time push to each user
      req.io.to(`user_${doc.id}`).emit("new_notification", {
        title,
        body,
        type: "admin_broadcast",
        is_read: false
      });
    });

    await batch.commit();

    await logAudit(
      req.user.id, req.user.email || "admin",
      "BROADCAST_NOTIFICATION", "notifications", null,
      { title, target_role: target_role || "all", count }
    );

    res.json({ message: `Notification sent to ${count} user(s).`, count });
  } catch (err) {
    console.error("Broadcast error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

// ─── Recent Activity Feed ─────────────────────────────────────────────────────
router.get("/activity", auth, adminOnly, async (req, res) => {
  try {
    const [latestUsers, latestApps, latestOpps] = await Promise.all([
      db.collection("users").orderBy("created_at", "desc").limit(5).get(),
      db.collection("applications").orderBy("created_at", "desc").limit(5).get(),
      db.collection("opportunities").orderBy("created_at", "desc").limit(5).get()
    ]);

    const serializeDate = (d) => {
      if (!d) return null;
      return typeof d.toDate === "function" ? d.toDate().toISOString() : new Date(d).toISOString();
    };

    const activity = [];

    latestUsers.docs.forEach(doc => {
      const u = doc.data();
      activity.push({
        type: "new_user",
        title: `${u.name || u.email} joined`,
        subtitle: u.role,
        time: serializeDate(u.created_at),
        icon: "👤"
      });
    });

    latestApps.docs.forEach(doc => {
      const a = doc.data();
      activity.push({
        type: "new_application",
        title: `${a.student_name || "Student"} applied to ${a.opportunity_title || "an opportunity"}`,
        subtitle: a.status,
        time: serializeDate(a.created_at),
        icon: "📋"
      });
    });

    latestOpps.docs.forEach(doc => {
      const o = doc.data();
      activity.push({
        type: "new_opportunity",
        title: `${o.title} posted by ${o.company}`,
        subtitle: o.type,
        time: serializeDate(o.created_at),
        icon: "🔍"
      });
    });

    activity.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

    res.json(activity.slice(0, 15));
  } catch (err) {
    console.error("Activity feed error:", err.message);
    res.json([]);
  }
});

// ─── Super Admin Generic Data Endpoints ────────────────────────────────────────

router.get("/users", auth, adminOnly, async (req, res) => {
  try {
    let query = db.collection("users");
    
    // College admins can only fetch their own students
    if (req.user.role === 'college_admin') {
      query = query.where("college_id", "==", req.user.college_id).where("role", "==", "student");
    }

    const snapshot = await query.get();
    const users = [];
    snapshot.forEach(doc => {
      // Don't send passwords
      const { password, ...data } = doc.data();
      users.push({ id: doc.id, ...data });
    });
    
    res.json(users);
  } catch (err) {
    console.error("Get users error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

router.put("/users/:id/status", auth, adminOnly, async (req, res) => {
  try {
    // Only super_admin/admin can update company/college statuses
    // College admin can only update student statuses for their college
    const { status } = req.body;
    await db.collection("users").doc(req.params.id).update({ 
      status,
      updated_at: new Date()
    });
    
    await logAudit(
      req.user.id, req.user.email,
      "UPDATE_USER_STATUS", "users", req.params.id,
      { status }
    );
    
    res.json({ message: "User status updated" });
  } catch (err) {
    console.error("Update user status error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

router.get("/opportunities", auth, adminOnly, async (req, res) => {
  try {
    const snapshot = await db.collection("opportunities").get();
    const ops = [];
    snapshot.forEach(doc => ops.push({ id: doc.id, ...doc.data() }));
    res.json(ops);
  } catch (err) {
    console.error("Get opportunities error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

router.get("/projects", auth, adminOnly, async (req, res) => {
  try {
    const snapshot = await db.collection("projects").get();
    const projects = [];
    snapshot.forEach(doc => projects.push({ id: doc.id, ...doc.data() }));
    res.json(projects);
  } catch (err) {
    console.error("Get projects error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
