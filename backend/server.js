console.log("🔥 CODOVATE SERVER STARTING...");

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { initializeAdminRealtime } = require("./services/adminRealtime");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
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
app.use(express.json());

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api/auth",          require("./routes/auth"));
app.use("/api/students",      require("./routes/students"));
app.use("/api/opportunities", require("./routes/opportunities"));
app.use("/api/applications",  require("./routes/applications"));
app.use("/api/onboarding",    require("./routes/onboarding"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/admin",         require("./routes/admin"));
app.use("/api/teams",         require("./routes/teams"));
app.use("/api/mentors",       require("./routes/mentors"));
app.use("/api/leaderboard",   require("./routes/leaderboard"));
app.use("/api/resume",        require("./routes/resume"));
app.use("/api/colleges",      require("./routes/colleges"));
app.use("/api/companies",     require("./routes/companies"));
app.use("/api/projects",      require("./routes/projects"));

app.get("/", (req, res) => {
  res.json({ message: "Codovate API running 🚀", realtime: true });
});

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} joined`);
  });

  socket.on("join_global", () => {
    socket.join("global");
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

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`⚡ Socket.io real-time enabled`);
});