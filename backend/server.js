console.log("🔥 CODOVATE SERVER STARTING...");

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { initializeAdminRealtime } = require("./services/adminRealtime");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// ─── SECURITY: Fail fast if JWT_SECRET is missing ───
if (!process.env.JWT_SECRET) {
  console.error("❌ FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.");
  process.exit(1);
}

const app = express();
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

const protect = require("./middleware/auth");

// ─── SECURITY: Rate limit auth endpoints ───
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,                   // max 30 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again after 15 minutes." },
});

app.use("/api/auth", authLimiter, require("./routes/auth"));

app.use("/api/admin",         protect, require("./routes/admin"));
app.use("/api/admin/users",   protect, require("./routes/adminUsers"));
app.use("/api/admin/students", protect, require("./routes/adminStudents"));
app.use("/api/admin/colleges",protect, require("./routes/adminColleges"));
app.use("/api/admin/companies",protect, require("./routes/adminCompanies"));
app.use("/api/admin/mentors", protect, require("./routes/adminMentors"));
app.use("/api/admin/opportunities", protect, require("./routes/adminOpportunities"));
app.use("/api/admin/projects", protect, require("./routes/adminProjects"));
app.use("/api/admin/certificates", protect, require("./routes/adminCertificates"));
app.use("/api/admin/notifications", protect, require("./routes/adminNotifications"));
app.use("/api/admin/health", protect, require("./routes/adminHealth"));
app.use("/api/admin/settings", protect, require("./routes/adminSettings"));

// College Admin Scoped Routes
app.use("/api/college-admin/students", protect, require("./routes/collegeAdminStudents"));
app.use("/api/college-admin/faculty", protect, require("./routes/collegeAdminFaculty"));
app.use("/api/college-admin/projects", protect, require("./routes/collegeAdminProjects"));
app.use("/api/college-admin/certificates", protect, require("./routes/collegeAdminCertificates"));
app.use("/api/college-admin/events", protect, require("./routes/collegeAdminEvents"));
app.use("/api/college-admin/notifications", protect, require("./routes/collegeAdminNotifications"));
app.use("/api/college-admin/reports", protect, require("./routes/collegeAdminReports"));

// Company Admin Scoped Routes
app.use("/api/company-admin/opportunities", protect, require("./routes/companyAdminOpportunities"));
app.use("/api/company-admin/applications", protect, require("./routes/companyAdminApplications"));
app.use("/api/company-admin/interviews", protect, require("./routes/companyAdminInterviews"));
app.use("/api/company-admin/notifications", protect, require("./routes/companyAdminNotifications"));
app.use("/api/students",      require("./routes/students"));
app.use("/api/opportunities", require("./routes/opportunities"));
app.use("/api/applications",  require("./routes/applications"));
app.use("/api/onboarding",    require("./routes/onboarding"));
app.use("/api/notifications", require("./routes/notifications"));

app.use("/api/teams",         require("./routes/teams"));
app.use("/api/mentors",       require("./routes/mentors"));
app.use("/api/mentor-queries", require("./routes/mentorQueries"));
app.use("/api/networking",    require("./routes/networking"));
app.use("/api/leaderboard",   require("./routes/leaderboard"));
app.use("/api/resume",        require("./routes/resume"));
app.use("/api/colleges",      require("./routes/colleges"));
app.use("/api/companies",     require("./routes/companies"));
app.use("/api/projects",      require("./routes/projects"));

app.get("/", (req, res) => {
  res.json({ message: "Codovate API running 🚀", realtime: true });
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("join", (userId) => {
    socket.userId = userId;
    socket.join(`user_${userId}`);
    onlineUsers.set(socket.id, userId);
    
    // Broadcast to others that this user is online
    socket.broadcast.emit('user_online', userId);
    
    // Send current unique online users to this new client
    socket.emit('online_users', Array.from(new Set(onlineUsers.values())));
    
    console.log(`👤 User ${userId} joined and is online`);
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`⚡ Socket.io real-time enabled`);
});