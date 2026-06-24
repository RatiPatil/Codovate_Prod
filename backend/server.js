console.log("DB URL:", process.env.DATABASE_URL);

console.log("🔥 SERVER STARTING...");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/students", require("./routes/students"));
app.use("/api/opportunities", require("./routes/opportunities"));
app.use("/api/applications", require("./routes/applications"));
app.use("/api/onboarding", require("./routes/onboarding"));

app.get("/", (req, res) => {
  res.json({ message: "Codovate API running 🚀" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});