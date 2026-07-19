const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

router.post("/save", auth, async (req, res) => {
  try {
    const {
      full_name, phone, city,
      country, state,
      college, course, degree, branch, year, profile_photo,
      career_goal, dream_company, placement_goal,
      skills, // expects array of objects { name, level }
      interests,
      learning_style, daily_time,
      experience_level, projects_built,
      portfolio_url, github_url, linkedin_url, resume_url,
      leetcode_url, codechef_url, hackerrank_url,
      onboarding_completed
    } = req.body;

    console.log("📥 Saving onboarding V2 for user:", req.user.id);

    // ── Server-side Validation ──────────────────────────────────────────
    const errors = {};
    const trimmedName = (full_name || '').trim().toUpperCase();
    if (!trimmedName || trimmedName.length < 3) errors.full_name = 'Full name must be at least 3 characters';

    if (phone) {
      const digitsOnly = phone.replace(/[^0-9]/g, '');
      if (digitsOnly.length < 10 || digitsOnly.length > 15) errors.phone = 'Phone must be 10-15 digits';
      const phoneCheck = await db.collection("users").where("phone", "==", phone).get();
      const isDuplicate = phoneCheck.docs.some(doc => doc.id !== req.user.id);
      if (isDuplicate) errors.phone = 'This phone number is already registered';
    }

    const finalDegree = degree || course;

    if (!country) errors.country = 'Country is required';
    if (!state) errors.state = 'State is required';
    if (!city) errors.city = 'City is required';
    if (!college || college.trim().length < 3) errors.college = 'College name is required';
    if (!finalDegree || finalDegree.trim().length < 2) errors.degree = 'Degree is required';
    if (!branch || branch.trim().length < 2) errors.branch = 'Branch is required';
    if (!year) errors.year = 'Year of study is required';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const cleanYear = year ? parseInt(year) : null;
    const cleanSkills = Array.isArray(skills) && skills.length > 0 ? skills : null;
    const cleanInterests = Array.isArray(interests) && interests.length > 0 ? interests : null;

    // ── Profile Completion Calculation ──────────────────────────────────
    let completion = 0;
    // Basic Details & Education (25%)
    if (trimmedName) completion += 5;
    if (college && finalDegree && branch && cleanYear) completion += 15;
    if (city && state && country) completion += 5;

    // Career Vision & Skills (25%)
    if (career_goal) completion += 10;
    if (dream_company) completion += 5;
    if (cleanSkills && cleanSkills.length >= 2) completion += 10;

    // Experience & Interests (20%)
    if (experience_level) completion += 10;
    if (projects_built) completion += 5;
    if (cleanInterests && cleanInterests.length > 0) completion += 5;

    // Resume & Links (30%)
    if (resume_url) completion += 15;
    if (github_url) completion += 5;
    if (linkedin_url) completion += 5;
    if (portfolio_url || leetcode_url || codechef_url || hackerrank_url) completion += 5;

    const profile_completion = Math.min(100, completion);

    // ── Data Construction ───────────────────────────────────────────────
    // 1. Consolidated Profile Data
    const profileData = {
      personalInfo: {
        name: trimmedName || null,
        email: req.user.email || null, // Best effort fallback
        phone: phone || null,
        city: city || null,
        country: country || null,
        state: state || null,
      },
      education: {
        college: college?.trim() || null,
        degree: finalDegree?.trim() || null,
        branch: branch?.trim() || null,
        year: cleanYear,
      },
      socialLinks: {
        github: github_url || null,
        linkedin: linkedin_url || null,
        portfolio: portfolio_url || null,
        resume: resume_url || null,
      },
      careerGoal: career_goal || null,
      experienceLevel: experience_level || null,
      profileImage: profile_photo || null,
      headline: null,
      bio: null,
      skills: cleanSkills,
      interests: cleanInterests,
      profileCompletion: profile_completion,
      visibility: 'public',
      updatedAt: new Date()
    };

    // Clean undefined values inside nested objects
    Object.keys(profileData).forEach(key => {
      if (typeof profileData[key] === 'object' && profileData[key] !== null && !Array.isArray(profileData[key])) {
        Object.keys(profileData[key]).forEach(subKey => {
          if (profileData[key][subKey] === undefined) profileData[key][subKey] = null;
        });
      }
    });

    // ── Firestore Batch Write ───────────────────────────────────────────
    const batch = db.batch();
    const profileRef = db.collection("profiles").doc(req.user.id);

    const userUpdates = {};
    if (phone) userUpdates.phone = phone;
    if (trimmedName) userUpdates.name = trimmedName;
    if (onboarding_completed !== undefined) userUpdates.onboardingCompleted = onboarding_completed;
    userUpdates.profileCompleted = profile_completion;

    if (Object.keys(userUpdates).length > 0) {
      batch.update(db.collection("users").doc(req.user.id), userUpdates);
    }

    // Phase 3 Schema Update
    batch.set(profileRef, profileData, { merge: true });

    await batch.commit();

    console.log("✅ Onboarding V2 saved successfully with batch write.");
    res.json({ message: "Saved.", profile_completion });

  } catch (err) {
    console.error("❌ Onboarding save error:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ── Check phone duplicate ───────────────────────────────────────────────
router.post("/check-phone", auth, async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.json({ available: true });

  try {
    const digitsOnly = phone.replace(/[^0-9]/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return res.json({ available: false, reason: "Phone must be 10-15 digits" });
    }

    const snapshot = await db.collection("users")
      .where("phone", "==", phone).get();

    const isDuplicate = snapshot.docs.some(doc => doc.id !== req.user.id);
    res.json({ available: !isDuplicate, reason: isDuplicate ? "This phone number is already registered" : null });
  } catch (err) {
    console.error("Phone check error:", err.message);
    res.status(500).json({ available: true });
  }
});

router.get("/status", auth, async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.id).get();
    
    let isCompleted = false;
    let completionScore = 0;

    if (userDoc.exists) {
      const u = userDoc.data();
      isCompleted = u.onboardingCompleted === true || u.onboardingCompleted === "true" || u.onboarding_completed === true || u.onboarding_completed === "true";
      completionScore = u.profileCompleted || 0;
    }
    
    // Fallback logic could go here if we were migrating data.
    
    const u = userDoc.exists ? userDoc.data() : {};

    res.json({
      onboarding_completed: isCompleted,
      profile_completion: completionScore,
      name: u.name,
      email: u.email
    });
  } catch (err) {
    console.error("❌ Status error:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;