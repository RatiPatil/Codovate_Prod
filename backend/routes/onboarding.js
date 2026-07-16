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
    // 1. Profile Data (Legacy / Merged)
    const profileData = {
      name: trimmedName || null,
      full_name: trimmedName || null,
      phone: phone || null,
      city: city || null,
      country: country || null,
      state: state || null,
      college: college?.trim() || null,
      course: finalDegree?.trim() || null, // Keeping for backward compatibility
      degree: finalDegree?.trim() || null,
      branch: branch?.trim() || null,
      year: cleanYear,
      career_goal: career_goal || null,
      career_interests: cleanInterests, // backward compat
      interests: cleanInterests,
      experience_level: experience_level || null,
      skills: cleanSkills,
      portfolio_url: portfolio_url || null,
      github_url: github_url || null,
      linkedin_url: linkedin_url || null,
      resume_url: resume_url || null,
      profile_completion,
      onboarding_completed: onboarding_completed !== undefined ? onboarding_completed : null,
      profile_photo: profile_photo || null
    };

    // 2. Career Profile
    const careerProfileData = {
      career_goal: career_goal || null,
      dream_company: dream_company || null,
      placement_goal: placement_goal || null,
      experience_level: experience_level || null,
      projects_built: projects_built || null,
      resume_url: resume_url || null,
      updated_at: new Date()
    };

    // 3. Learning Profile
    const learningProfileData = {
      skills: cleanSkills,
      interests: cleanInterests,
      learning_style: learning_style || null,
      daily_time: daily_time || null,
      coding_profiles: {
        leetcode: leetcode_url || null,
        codechef: codechef_url || null,
        hackerrank: hackerrank_url || null
      },
      updated_at: new Date()
    };

    // Clean objects
    [profileData, careerProfileData, learningProfileData].forEach(obj => {
      Object.keys(obj).forEach(k => {
        if (obj[k] === undefined || obj[k] === null) delete obj[k];
      });
    });

    // ── Firestore Batch Write ───────────────────────────────────────────
    const batch = db.batch();
    const profileRef = db.collection("profiles").doc(req.user.id);
    const careerProfileRef = db.collection("careerProfiles").doc(req.user.id);
    const preferenceRef = db.collection("preferences").doc(req.user.id);
    const analyticsRef = db.collection("analytics").doc(req.user.id);

    const userUpdates = {};
    if (phone) userUpdates.phone = phone;
    if (trimmedName) userUpdates.name = trimmedName;

    if (Object.keys(userUpdates).length > 0) {
      batch.update(db.collection("users").doc(req.user.id), userUpdates);
    }

    // Module 2 New Schema
    batch.set(profileRef, profileData, { merge: true });
    batch.set(careerProfileRef, careerProfileData, { merge: true });
    batch.set(preferenceRef, learningProfileData, { merge: true });
    batch.set(analyticsRef, { profile_completion, onboarding_completed }, { merge: true });

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
    const analyticsDoc = await db.collection("analytics").doc(req.user.id).get();
    const userDoc = await db.collection("users").doc(req.user.id).get();
    
    let isCompleted = false;
    let completionScore = 0;

    if (analyticsDoc.exists) {
      const a = analyticsDoc.data();
      isCompleted = a.onboarding_completed === true || a.onboarding_completed === "true";
      completionScore = a.profile_completion || 0;
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