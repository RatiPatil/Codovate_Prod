console.log("🔥 CODOVATE SERVER STARTING...");

const express = require("express");
const requestContext = require("./middleware/requestContext");
const errorHandler = require("./middleware/errorHandler");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { initializeAdminRealtime } = require("./services/adminRealtime");
require("./events/eventHandlers");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const { startWeeklyReportJob } = require("./jobs/weeklyReportJob");

// ─── SECURITY: Fail fast if JWT_SECRET is missing ───
if (!process.env.JWT_SECRET) {
  console.error("❌ FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.");
  process.exit(1);
}

const app = express();
app.use(requestContext);
app.set("trust proxy", 1);
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "https://codovate.in",
  "https://www.codovate.in",
  process.env.FRONTEND_URL
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

initializeAdminRealtime(io);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  req.io = io;
  next();
});

// ─── RBAC Middleware ─────────────────────────────────────────
const { authenticate, requireRole } = require("./middleware");

// Legacy alias for backward compatibility (used in some route files)
const protect = authenticate;

// ─── SECURITY: Rate limit auth endpoints ───
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,                   // max 30 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again after 15 minutes." },
});

// ═══════════════════════════════════════════════════════════════
//  AUTH ROUTES (No RBAC — public endpoints)
// ═══════════════════════════════════════════════════════════════
app.use("/api/system", require("./routes/system"));
app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/mentor-auth", require("./routes/mentorAuth"));
app.use("/api/public", require("./routes/publicStats"));

// ═══════════════════════════════════════════════════════════════
//  ENTERPRISE IAM & RBAC MANAGEMENT
// ═══════════════════════════════════════════════════════════════
app.use("/api/rbac", authenticate, require("./routes/rbac"));
app.use("/api/iam", require("./routes/iam")); // Some IAM routes (like bootstrap) are public

// ═══════════════════════════════════════════════════════════════
//  POLICIES
// ═══════════════════════════════════════════════════════════════
app.use("/api/policies", require("./routes/policies"));

// ═══════════════════════════════════════════════════════════════
//  SUPER ADMIN / ENTERPRISE ROUTES — FIRESTORE-BACKED
// ═══════════════════════════════════════════════════════════════
app.use("/api/core",            authenticate, require("./routes/admin"));  // Firestore admin CRUD
app.use("/api/admin/organizations", authenticate, requireRole(['super_admin', 'admin']), require("./routes/enterpriseOrganizations"));
app.use("/api/admin/colleges",      authenticate, requireRole(['super_admin', 'admin', 'college_admin']), require("./routes/enterpriseColleges"));
app.use("/api/admin/academic",      authenticate, requireRole(['super_admin', 'admin', 'college_admin']), require("./routes/enterpriseAcademic"));
app.use("/api/admin/students",      authenticate, requireRole(['super_admin', 'admin', 'college_admin']), require("./routes/enterpriseStudents"));
app.use("/api/admin/faculty",       authenticate, requireRole(['super_admin', 'admin', 'college_admin']), require("./routes/enterpriseFaculty"));
app.use("/api/admin/mentors",       authenticate, requireRole(['super_admin', 'admin', 'college_admin']), require("./routes/enterpriseMentors"));
app.use("/api/admin/placements",    authenticate, requireRole(['super_admin', 'admin', 'college_admin', 'tpo']), require("./routes/enterprisePlacements"));
app.use("/api/admin/companies",     authenticate, requireRole(['super_admin', 'admin', 'company_admin', 'tpo']), require("./routes/enterpriseCompanies"));
app.use("/api/admin/recruiters",    authenticate, requireRole(['super_admin', 'admin', 'company_admin', 'tpo']), require("./routes/enterpriseRecruiters"));
app.use("/api/admin/jobs",          authenticate, requireRole(['super_admin', 'admin', 'company_admin', 'tpo']), require("./routes/enterpriseJobs"));
app.use("/api/admin/applications",  authenticate, requireRole(['super_admin', 'admin', 'company_admin', 'tpo', 'recruiter', 'college_admin']), require("./routes/enterpriseApplications"));
app.use("/api/admin/interviews",    authenticate, requireRole(['super_admin', 'admin', 'company_admin', 'tpo', 'recruiter', 'college_admin']), require("./routes/enterpriseInterviews"));
app.use("/api/admin/offers",        authenticate, requireRole(['super_admin', 'admin', 'company_admin', 'tpo', 'recruiter', 'college_admin']), require("./routes/enterpriseOffers"));
app.use("/api/admin/placement-records", authenticate, requireRole(['super_admin', 'admin', 'company_admin', 'tpo', 'recruiter', 'college_admin']), require("./routes/enterprisePlacementRecords"));
app.use("/api/analytics",           authenticate, requireRole(['super_admin', 'admin', 'company_admin', 'tpo', 'recruiter', 'college_admin']), require("./routes/enterpriseAnalytics"));
app.use("/api/admin/opportunities", authenticate, requireRole(['super_admin', 'admin', 'company_admin']), require("./routes/adminOpportunities"));
app.use("/api/admin/projects",      authenticate, requireRole(['super_admin', 'admin', 'college_admin']), require("./routes/adminProjects"));
app.use("/api/admin/certificates",  authenticate, requireRole(['super_admin', 'admin', 'college_admin']), require("./routes/adminCertificates"));
app.use("/api/admin/notifications", authenticate, requireRole(['super_admin', 'admin']), require("./routes/adminNotifications"));
app.use("/api/admin/health",        authenticate, requireRole(['super_admin', 'admin', 'support_admin']), require("./routes/adminHealth"));
app.use("/api/admin/settings",      authenticate, requireRole(['super_admin', 'admin', 'support_admin']), require("./routes/adminSettings"));
app.use("/api/dashboard/super-admin", authenticate, requireRole(['super_admin']), require("./routes/superAdminDashboard"));
// Catch-all admin route (Firestore)
app.use("/api/admin",               authenticate, require("./routes/admin"));

// ═══════════════════════════════════════════════════════════════
//  COLLEGE ADMIN SCOPED ROUTES
// ═══════════════════════════════════════════════════════════════
app.use("/api/college-admin/dashboard",     authenticate, requireRole(['college_admin', 'super_admin', 'admin']), require("./routes/collegeAdminDashboard"));
app.use("/api/college-admin/students",      authenticate, requireRole(['college_admin', 'super_admin', 'admin']), require("./routes/collegeAdminStudents"));
app.use("/api/college-admin/faculty",       authenticate, requireRole(['college_admin', 'super_admin', 'admin']), require("./routes/collegeAdminFaculty"));
app.use("/api/college-admin/projects",      authenticate, requireRole(['college_admin', 'super_admin', 'admin']), require("./routes/collegeAdminProjects"));
app.use("/api/college-admin/certificates",  authenticate, requireRole(['college_admin', 'super_admin', 'admin']), require("./routes/collegeAdminCertificates"));
app.use("/api/college-admin/events",        authenticate, requireRole(['college_admin', 'super_admin', 'admin']), require("./routes/collegeAdminEvents"));
app.use("/api/college-admin/notifications", authenticate, requireRole(['college_admin', 'super_admin', 'admin']), require("./routes/collegeAdminNotifications"));
app.use("/api/college-admin/reports",       authenticate, requireRole(['college_admin', 'super_admin', 'admin']), require("./routes/collegeAdminReports"));

// ═══════════════════════════════════════════════════════════════
//  COMPANY ADMIN / RECRUITER SCOPED ROUTES
// ═══════════════════════════════════════════════════════════════
app.use("/api/company-admin/opportunities",  authenticate, requireRole(['company_admin', 'recruiter', 'super_admin', 'admin']), require("./routes/companyAdminOpportunities"));
app.use("/api/company-admin/analytics",      authenticate, requireRole(['company_admin', 'recruiter', 'super_admin', 'admin']), require("./routes/companyAdminAnalytics"));
app.use("/api/company-admin/applications",   authenticate, requireRole(['company_admin', 'recruiter', 'super_admin', 'admin']), require("./routes/companyAdminApplications"));
app.use("/api/company-admin/interviews",     authenticate, requireRole(['company_admin', 'recruiter', 'super_admin', 'admin']), require("./routes/companyAdminInterviews"));
app.use("/api/company-admin/notifications",  authenticate, requireRole(['company_admin', 'recruiter', 'super_admin', 'admin']), require("./routes/companyAdminNotifications"));
app.use("/api/company-admin/talent",         authenticate, requireRole(['company_admin', 'recruiter', 'super_admin', 'admin']), require("./routes/companyAdminTalent"));
app.use("/api/admin/company/dashboard",      authenticate, requireRole(['company_admin', 'recruiter', 'super_admin', 'admin']), require("./routes/companyAdminDashboard"));

// ═══════════════════════════════════════════════════════════════
//  AUTHENTICATED USER ROUTES — ALL FIRESTORE (Firebase-only architecture)
//
//  All user routes are backed natively by Cloud Firestore repositories.
// ═══════════════════════════════════════════════════════════════
app.use("/api/students",            authenticate, require("./routes/students"));            // Firestore: studentProfiles, users
app.use("/api/teams",               authenticate, require("./routes/teams"));               // Firestore: teams, teamMembers
app.use("/api/projects",            authenticate, require("./routes/projects"));            // Firestore: projects
app.use("/api/connections",         authenticate, require("./routes/connections"));         // Firestore: connections
app.use("/api/networking",          authenticate, require("./routes/networking"));          // Firestore: networking
app.use("/api/teams-chat",          authenticate, require("./routes/teamMessages"));        // Firestore: teamMessages
app.use("/api/admin/chat-audit",    authenticate, require("./routes/adminChatAudit"));     // Firestore: chatMessages
app.use("/api/workspace",           authenticate, require("./routes/teamWorkspace"));       // Firestore: teamWorkspace
app.use("/api/opportunities",       authenticate, require("./routes/opportunities"));       // Firestore: opportunities
app.use("/api/applications",        authenticate, require("./routes/applications"));        // Firestore: applications
app.use("/api/onboarding",          authenticate, require("./routes/onboarding"));          // Firestore: users (onboarding status)
app.use("/api/notifications",       authenticate, require("./routes/notifications"));       // Firestore: notifications
app.use("/api/mentors",             authenticate, require("./routes/mentors"));             // Firestore: mentors
app.use("/api/mentor-interactions", authenticate, require("./routes/mentorInteractions"));  // Firestore: mentorInteractions
app.use("/api/mentor-resources",    authenticate, require("./routes/mentorResources"));     // Firestore: mentorResources
app.use("/api/mentor-queries",      authenticate, require("./routes/mentorQueries"));       // Firestore: mentorQueries
app.use("/api/mentor-reviews",      authenticate, require("./routes/mentor-reviews"));      // Firestore: mentorReviews
app.use("/api/project-mentorships", authenticate, require("./routes/project-mentorships")); // Firestore: projectMentorships
app.use("/api/mentorship",          authenticate, require("./routes/mentors"));             // alias → mentors
app.use("/api/learning",            authenticate, require("./routes/learning"));            // Firestore: courses, enrollments
app.use("/api/career",              authenticate, require("./routes/roadmap"));             // Firestore: roadmaps
app.use("/api/roadmap",             authenticate, require("./routes/roadmap"));             // Firestore: roadmaps
app.use("/api/showcase",            authenticate, require("./routes/portfolio"));           // Firestore: portfolios
app.use("/api/portfolio",           authenticate, require("./routes/portfolio"));           // Firestore: portfolios
app.use("/api/events",              authenticate, require("./routes/events"));              // Firestore: events
app.use("/api/recruiter",           authenticate, require("./routes/community"));           // Firestore: community (recruiter view)
app.use("/api/college",             authenticate, require("./routes/colleges"));            // Firestore: colleges
app.use("/api/incubation",          authenticate, require("./routes/community"));           // Firestore: community (startups)
app.use("/api/engagement",          authenticate, require("./routes/notifications"));       // Firestore: notifications (engagement)
app.use("/api/gamification",        authenticate, require("./routes/gamification"));        // Firestore: gamification (single mount — duplicate removed)
app.use("/api/ai",                  authenticate, require("./routes/ai"));                  // Firestore: aiRecommendations
app.use("/api/practice",            authenticate, require("./routes/coding"));              // Firestore: codingProblems
app.use("/api/platform",            authenticate, require("./routes/community"));           // Firestore: community (search/analytics)
app.use("/api/leaderboard",         authenticate, require("./routes/leaderboard"));         // Firestore: leaderboard
app.use("/api/chat",                authenticate, require("./routes/chat"));                // Firestore: chatMessages
app.use("/api/resume",              authenticate, require("./routes/resume"));              // Firestore: resumes
app.use("/api/colleges",            authenticate, require("./routes/colleges"));            // Firestore: colleges
app.use("/api/companies",           authenticate, require("./routes/companies"));           // Firestore: companies
app.use("/api/activity",            authenticate, require("./routes/activity"));            // Firestore: activity
app.use("/api/dashboard",           authenticate, require("./routes/dashboard"));           // Firestore: dashboard
app.use("/api/student-core",        authenticate, require("./routes/students"));            // alias → students
app.use("/api/coding",              authenticate, require("./routes/coding"));              // Firestore: codingProblems
app.use("/api/assessments",         authenticate, require("./routes/assessments"));         // Firestore: skillAssessments, assessmentAttempts
app.use("/api/interviews",          authenticate, require("./routes/interviews"));          // Firestore: interviews
app.use("/api/calendar",            authenticate, require("./routes/calendar"));            // Firestore: calendarEvents
app.use("/api/certificates",        authenticate, require("./routes/certificates"));        // Firestore: certificates
app.use("/api/student/ai",          authenticate, requireRole(['student', 'admin', 'super_admin']), require("./routes/aiRecommendations")); // Firestore: aiRecommendations

// ─── Root health check ─────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "Codovate API running 🚀", realtime: true });
});

// ─── Realtime health check (Cloud Firestore) ────────────────
app.get("/api/realtime/health", authenticate, async (req, res) => {
  try {
    const { db } = require('./config/firebase');
    await db.collection('_health').limit(1).get();
    res.json({ success: true, service: 'realtime', database: 'firestore' });
  } catch (err) {
    res.status(503).json({ success: false, service: 'realtime', error: err.message });
  }
});
app.get("/api/realtime/me", authenticate, (req, res) => {
  res.json({ success: true, data: req.user });
});

// ═══════════════════════════════════════════════════════════════
//  SOCKET.IO — REAL-TIME EVENTS
// ═══════════════════════════════════════════════════════════════
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("join", (userId) => {
    socket.userId = userId;
    socket.join(`user_${userId}`);
    onlineUsers.set(socket.id, userId);
    
    socket.broadcast.emit('user_online', userId);
    
    // Send current unique online users to this new client
    socket.emit('online_users', Array.from(new Set(onlineUsers.values())));
    
    console.log(`👤 User ${userId} joined and is online`);
  });

  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    console.log(`👤 Socket ${socket.id} joined room ${roomName}`);
  });

  socket.on("typing", ({ roomName, userName }) => {
    socket.to(roomName).emit("typing", { userName });
  });

  socket.on("stop_typing", ({ roomName }) => {
    socket.to(roomName).emit("stop_typing");
  });

  socket.on("read_message", ({ roomName, messageId, userId }) => {
    socket.to(roomName).emit("message_read", { messageId, userId });
  });

  socket.on("join_global", () => {
    socket.join("global");
  });

  socket.on("join_team", (teamId) => {
    if (teamId) {
      socket.join(`team_${teamId}`);
      console.log(`👥 Client joined team_${teamId} room`);
    }
  });

  socket.on("join_admin", ({ role, id }) => {
    if (role === "super_admin") {
      socket.join("admin_super");
      console.log(`🛡️ Super Admin joined admin_super room`);
    } else if (role === "college_admin") {
      socket.join(`admin_college_${id}`);
      console.log(`🏫 College Admin joined admin_college_${id} room`);
    } else if (role === "company_admin") {
      socket.join(`admin_company_${id}`);
      console.log(`🏢 Company Admin joined admin_company_${id} room`);
    } else if (role === "mentor") {
      socket.join(`admin_mentor_${id}`);
      console.log(`🧑‍🏫 Mentor Admin joined admin_mentor_${id} room`);
    }
  });

  socket.on("typing", ({ receiverId }) => {
    if (socket.userId) {
      socket.to(`user_${receiverId}`).emit("typing", { senderId: socket.userId });
    }
  });

  socket.on("stop_typing", ({ receiverId }) => {
    if (socket.userId) {
      socket.to(`user_${receiverId}`).emit("stop_typing", { senderId: socket.userId });
    }
  });

  socket.on("mark_messages_read", async ({ connectionId, senderId }) => {
    if (socket.userId && connectionId && senderId) {
      try {
        const { db } = require('./config/firebase');
        const unreadQuery = await db.collection('student_chat_messages')
          .where('connection_id', '==', connectionId)
          .where('sender_id', '==', senderId)
          .where('status', 'in', ['sent', 'delivered'])
          .get();

        if (!unreadQuery.empty) {
          const batch = db.batch();
          unreadQuery.forEach(doc => {
            batch.update(doc.ref, { status: 'read' });
          });
          await batch.commit();
          
          // Notify the sender that their messages were read
          socket.to(`user_${senderId}`).emit('messages_read', { connectionId });
        }
      } catch (err) {
        console.error("Error marking messages read:", err);
      }
    }
  });

  socket.on("disconnect", () => {
    if (socket.userId) {
      onlineUsers.delete(socket.id);
      
      // Check if user has any other active connections (e.g. another tab)
      const isStillOnline = Array.from(onlineUsers.values()).includes(socket.userId);
      
      if (!isStillOnline) {
        socket.broadcast.emit('user_offline', socket.userId);
      }
    }
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ═══════════════════════════════════════════════════════════════
//  ERROR HANDLER & SERVER START
// ═══════════════════════════════════════════════════════════════
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const { startAutomationJobs } = require('./jobs/automation');

server.listen(PORT, "127.0.0.1", () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`⚡ Socket.io real-time enabled`);
  startAutomationJobs();
  startWeeklyReportJob();
});