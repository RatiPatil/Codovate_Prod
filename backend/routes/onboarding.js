const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

router.post("/save", auth, async (req, res) => {
  try {
    const {
      full_name, phone, city,
      college, branch, year,
      career_goal, career_interests, experience_level,
      skills,
      portfolio_url, github_url, linkedin_url, bio,
      profile_completion, onboarding_completed,
    } = req.body;

    console.log("📥 Saving onboarding for user:", req.user.id);

    if (full_name) {
      await db.collection("users").doc(req.user.id).update({ name: full_name });
    }

    const cleanYear = year ? parseInt(year) : null;
    const cleanCompletion = profile_completion !== undefined && profile_completion !== ""
      ? parseInt(profile_completion) : null;
    const cleanInterests = Array.isArray(career_interests) && career_interests.length > 0
      ? career_interests : null;
    const cleanSkills = Array.isArray(skills) && skills.length > 0
      ? skills : null;

    const updateData = {
      full_name: full_name || null,
      phone: phone || null,
      city: city || null,
      college: college || null,
      branch: branch || null,
      year: cleanYear,
      career_goal: career_goal || null,
      career_interests: cleanInterests,
      experience_level: experience_level || null,
      skills: cleanSkills,
      portfolio_url: portfolio_url || null,
      github_url: github_url || null,
      linkedin_url: linkedin_url || null,
      bio: bio || null,
      profile_completion: cleanCompletion,
      onboarding_completed: onboarding_completed !== undefined ? onboarding_completed : null,
      user_id: req.user.id
    };

    // Remove undefined and null if you want clean docs, but keeping null to match previous coalesce logic
    Object.keys(updateData).forEach(k => {
      if (updateData[k] === undefined || updateData[k] === null) {
        delete updateData[k];
      }
    });

    await db.collection("student_profiles").doc(req.user.id).set(updateData, { merge: true });

    console.log("✅ Onboarding saved successfully");
    res.json({ message: "Saved.", profile_completion: cleanCompletion });

  } catch (err) {
    console.error("❌ Onboarding save error:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

router.get("/status", auth, async (req, res) => {
  try {
    const profileDoc = await db.collection("student_profiles").doc(req.user.id).get();
    const userDoc = await db.collection("users").doc(req.user.id).get();

    if (!profileDoc.exists) {
      return res.json({ onboarding_completed: false, profile_completion: 0 });
    }

    const sp = profileDoc.data();
    const u = userDoc.exists ? userDoc.data() : {};

    res.json({
      onboarding_completed: sp.onboarding_completed || false,
      profile_completion: sp.profile_completion || 0,
      name: u.name,
      email: u.email
    });
  } catch (err) {
    console.error("❌ Status error:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;