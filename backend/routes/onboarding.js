const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

router.post("/save", auth, async (req, res) => {
  try {
    const {
      full_name, phone, city,
      country, state, district, taluka,
      college, branch, year,
      career_goal, career_interests, experience_level,
      skills,
      desired_roles,
      portfolio_url, github_url, linkedin_url, bio,
      profile_completion, onboarding_completed,
    } = req.body;

    console.log("📥 Saving onboarding for user:", req.user.id);

    // ── Server-side Validation ──────────────────────────────────────────
    const errors = {};
    const trimmedName = (full_name || '').trim();
    if (!trimmedName || trimmedName.length < 2) errors.full_name = 'Full name must be at least 2 characters';

    if (phone) {
      const digitsOnly = phone.replace(/[^0-9]/g, '');
      if (digitsOnly.length < 10 || digitsOnly.length > 15) errors.phone = 'Phone must be 10-15 digits';
      // Check duplicate phone
      const phoneCheck = await db.collection("students")
        .where("phone", "==", phone).get();
      const isDuplicate = phoneCheck.docs.some(doc => doc.id !== req.user.id);
      if (isDuplicate) errors.phone = 'This phone number is already registered';
    }

    if (!country) errors.country = 'Country is required';
    if (!state) errors.state = 'State is required';
    if (!district) errors.district = 'District is required';
    if (!college || college.trim().length < 3) errors.college = 'College name is required (min 3 chars)';
    if (!branch || branch.trim().length < 2) errors.branch = 'Branch is required';
    if (!year) errors.year = 'Year of study is required';
    if (!career_goal) errors.career_goal = 'Career goal is required';
    if (!Array.isArray(career_interests) || career_interests.length === 0) errors.career_interests = 'Select at least one interest';
    if (!Array.isArray(desired_roles) || desired_roles.length === 0) errors.desired_roles = 'Select at least one desired role';
    if (!experience_level) errors.experience_level = 'Experience level is required';
    if (!Array.isArray(skills) || skills.length < 2) errors.skills = 'Select at least 2 skills';
    if (!bio || bio.trim().length < 20) errors.bio = 'Bio must be at least 20 characters';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const cleanYear = year ? parseInt(year) : null;
    const cleanCompletion = profile_completion !== undefined && profile_completion !== ""
      ? parseInt(profile_completion) : null;
    const cleanInterests = Array.isArray(career_interests) && career_interests.length > 0
      ? career_interests : null;
    const cleanSkills = Array.isArray(skills) && skills.length > 0
      ? skills : null;
    const cleanDesiredRoles = Array.isArray(desired_roles) && desired_roles.length > 0
      ? desired_roles : null;

    // Derive city from taluka/district if not passed directly
    const derivedCity = city || taluka || district || null;

    const updateData = {
      name: trimmedName || null,
      full_name: trimmedName || null,
      phone: phone || null,
      city: derivedCity,
      country: country || null,
      state: state || null,
      district: district || null,
      taluka: taluka || null,
      college: college?.trim() || null,
      branch: branch?.trim() || null,
      year: cleanYear,
      career_goal: career_goal || null,
      career_interests: cleanInterests,
      desired_roles: cleanDesiredRoles,
      experience_level: experience_level || null,
      skills: cleanSkills,
      portfolio_url: portfolio_url || null,
      github_url: github_url || null,
      linkedin_url: linkedin_url || null,
      bio: bio?.trim() || null,
      profile_completion: cleanCompletion,
      onboarding_completed: onboarding_completed !== undefined ? onboarding_completed : null,
    };

    // Remove undefined and null
    Object.keys(updateData).forEach(k => {
      if (updateData[k] === undefined || updateData[k] === null) {
        delete updateData[k];
      }
    });

    const studentRef = db.collection("students").doc(req.user.id);
    
    // Set top level phone and name if needed, but primarily put in profile_data
    const topLevelUpdates = {};
    if (phone) topLevelUpdates.phone = phone;
    if (trimmedName) topLevelUpdates.name = trimmedName;

    await studentRef.set({
      ...topLevelUpdates,
      profile_data: updateData 
    }, { merge: true });

    console.log("✅ Onboarding saved successfully");
    res.json({ message: "Saved.", profile_completion: cleanCompletion });

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

    const snapshot = await db.collection("students")
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
    const studentDoc = await db.collection("students").doc(req.user.id).get();

    if (!studentDoc.exists) {
      // Graceful fallback for legacy users who completed onboarding under the old architecture
      const legacyProfile = await db.collection("student_profiles").doc(req.user.id).get();
      if (legacyProfile.exists && (legacyProfile.data().onboarding_completed === true || legacyProfile.data().onboarding_completed === "true")) {
        return res.json({ 
          onboarding_completed: true, 
          profile_completion: legacyProfile.data().profile_completion || 100 
        });
      }
      return res.json({ onboarding_completed: false, profile_completion: 0 });
    }

    const s = studentDoc.data();
    const sp = s.profile_data || {};

    // In case the merged sp.onboarding_completed wasn't synced well
    let isCompleted = sp.onboarding_completed === true || sp.onboarding_completed === "true";
    
    // Double fallback to legacy just in case
    if (!isCompleted) {
      const legacyProfile = await db.collection("student_profiles").doc(req.user.id).get();
      if (legacyProfile.exists && (legacyProfile.data().onboarding_completed === true || legacyProfile.data().onboarding_completed === "true")) {
        isCompleted = true;
      }
    }

    res.json({
      onboarding_completed: isCompleted,
      profile_completion: sp.profile_completion || 0,
      name: sp.name || s.name,
      email: s.email
    });
  } catch (err) {
    console.error("❌ Status error:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;