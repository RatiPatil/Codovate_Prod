const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");
const { mapDoc } = require("../utils/firestoreMapper");

/**
 * GET /api/onboarding/status
 * Returns current user's onboarding completion status and profile completion percentage.
 */
router.get("/status", auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const [userDoc, profileDoc] = await Promise.all([
      db.collection("users").doc(uid).get(),
      db.collection("profiles").doc(uid).get()
    ]);

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found." });
    }

    const userData = mapDoc(userDoc);
    const profileData = profileDoc.exists ? mapDoc(profileDoc) : {};

    const onboardingCompleted = Boolean(
      userData.onboardingCompleted ?? 
      userData.onboarding_completed ?? 
      (userData.role !== 'student')
    );

    const profileCompletion = 
      userData.profileCompleted ?? 
      profileData.profileCompletion ?? 
      0;

    res.json({
      onboarding_completed: onboardingCompleted,
      profile_completion: profileCompletion,
      name: profileData.personalInfo?.name || userData.name || '',
      email: userData.email || '',
      role: userData.role || 'student'
    });
  } catch (err) {
    console.error("Onboarding status error:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

/**
 * POST /api/onboarding/save
 * Saves student onboarding form data to Firestore profiles/{uid} and users/{uid}.
 */
router.post("/save", auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const {
      full_name, name,
      phone, city, state, country,
      college, degree, branch, year,
      career_goal, dream_company, placement_goal,
      skills, interests,
      learning_style, daily_time,
      experience_level, projects_built,
      github_url, linkedin_url, portfolio_url, resume_url,
      leetcode_url, codechef_url, hackerrank_url,
      profile_photo,
      onboarding_completed
    } = req.body;

    const studentName = (full_name || name || '').trim();

    // Calculate profile completion score based on key fields
    let completedFields = 0;
    const totalFields = 10;
    if (studentName) completedFields++;
    if (college) completedFields++;
    if (degree || branch) completedFields++;
    if (year) completedFields++;
    if (career_goal) completedFields++;
    if (Array.isArray(skills) && skills.length > 0) completedFields++;
    if (experience_level) completedFields++;
    if (city || state) completedFields++;
    if (github_url || linkedin_url || portfolio_url) completedFields++;
    if (resume_url || profile_photo) completedFields++;

    const profileCompletion = Math.round((completedFields / totalFields) * 100);

    const profileRef = db.collection("profiles").doc(uid);
    const profileDoc = await profileRef.get();
    const currentProfile = profileDoc.exists ? mapDoc(profileDoc) : {};

    const profileData = {
      personalInfo: {
        ...(currentProfile.personalInfo || {}),
        name: studentName || currentProfile.personalInfo?.name || '',
        phone: phone || currentProfile.personalInfo?.phone || null,
        city: city || currentProfile.personalInfo?.city || null,
        state: state || currentProfile.personalInfo?.state || null,
        country: country || currentProfile.personalInfo?.country || 'India',
        profile_photo: profile_photo || currentProfile.personalInfo?.profile_photo || null
      },
      education: {
        ...(currentProfile.education || {}),
        college: college || currentProfile.education?.college || null,
        degree: degree || currentProfile.education?.degree || null,
        branch: branch || currentProfile.education?.branch || null,
        year: year ? parseInt(year, 10) : (currentProfile.education?.year || null)
      },
      careerGoal: career_goal || currentProfile.careerGoal || null,
      dreamCompany: dream_company || currentProfile.dreamCompany || null,
      placementGoal: placement_goal || currentProfile.placementGoal || null,
      skills: Array.isArray(skills) ? skills : (currentProfile.skills || []),
      interests: Array.isArray(interests) ? interests : (currentProfile.interests || []),
      learningPreferences: {
        learningStyle: learning_style || null,
        dailyTime: daily_time || null
      },
      experienceLevel: experience_level || currentProfile.experienceLevel || null,
      projectsBuilt: projects_built || null,
      socialLinks: {
        ...(currentProfile.socialLinks || {}),
        github: github_url || currentProfile.socialLinks?.github || null,
        linkedin: linkedin_url || currentProfile.socialLinks?.linkedin || null,
        portfolio: portfolio_url || currentProfile.socialLinks?.portfolio || null,
        resume: resume_url || currentProfile.socialLinks?.resume || null,
        leetcode: leetcode_url || currentProfile.socialLinks?.leetcode || null,
        codechef: codechef_url || currentProfile.socialLinks?.codechef || null,
        hackerrank: hackerrank_url || currentProfile.socialLinks?.hackerrank || null
      },
      profileCompletion: profileCompletion,
      onboardingCompleted: true,
      updatedAt: new Date()
    };

    if (!profileDoc.exists) {
      profileData.createdAt = new Date();
      profileData.visibility = 'public';
    }

    const batch = db.batch();
    batch.set(profileRef, profileData, { merge: true });

    // Also update users/{uid}
    const userUpdates = {
      onboardingCompleted: true,
      profileCompleted: profileCompletion,
      updatedAt: new Date()
    };
    if (studentName) userUpdates.name = studentName.toUpperCase();
    if (phone) userUpdates.phone = phone;
    if (profile_photo) {
      userUpdates.avatar = profile_photo;
      userUpdates.photoURL = profile_photo;
    }
    batch.set(db.collection("users").doc(uid), userUpdates, { merge: true });

    // Log onboarding activity
    batch.set(db.collection("activityLogs").doc(), {
      actor_id: uid,
      event_type: 'onboarding_complete',
      entity_type: 'user',
      entity_id: uid,
      created_at: new Date()
    });

    await batch.commit();

    console.log(`✅ Onboarding completed for user ${uid} (${studentName}) with score ${profileCompletion}%`);

    res.json({
      success: true,
      message: "Onboarding completed successfully.",
      profile_completion: profileCompletion,
      onboarding_completed: true
    });
  } catch (err) {
    console.error("Onboarding save error:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;