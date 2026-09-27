const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

router.get("/status", auth, async (req, res) => {
  res.json({
    onboarding_completed: true,
    profile_completion: 100,
    name: req.user?.name || '',
    email: req.user?.email || ''
  });
});

module.exports = router;