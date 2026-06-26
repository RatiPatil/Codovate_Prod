const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  if (!["admin", "super_admin", "college_admin", "company_admin"].includes(req.user.role)) return res.status(403).json({ message: "Admin only." });
  try {
    const usersSnapshot = await db.collection("users").where("role", "==", "student").get();
    
    const students = await Promise.all(usersSnapshot.docs.map(async (doc) => {
      const u = doc.data();
      const profileDoc = await db.collection("student_profiles").doc(u.id).get();
      const sp = profileDoc.exists ? profileDoc.data() : {};

      // Safely serialize Firestore Timestamp
      let joinedAt = null;
      if (u.created_at) {
        if (typeof u.created_at.toDate === 'function') {
          joinedAt = u.created_at.toDate().toISOString();
        } else {
          joinedAt = new Date(u.created_at).toISOString();
        }
      }
      
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        created_at: joinedAt,
        college: sp.college || null,
        branch: sp.branch || null,
        year: sp.year || null,
        skills: sp.skills || [],
        profile_completion: sp.profile_completion || 0,
        onboarding_done: u.onboarding_done || false
      };
    }));

    // Sort by created_at DESC (simulated in memory since Firestore can't do complex joins + sorts easily without composite indexes)
    students.sort((a, b) => {
      const timeA = a.created_at?.toMillis ? a.created_at.toMillis() : new Date(a.created_at).getTime();
      const timeB = b.created_at?.toMillis ? b.created_at.toMillis() : new Date(b.created_at).getTime();
      return timeB - timeA;
    });

    res.json(students);
  } catch (err) {
    console.error("Get all students error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

router.get("/profile", auth, async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.user.id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found." });
    }

    const u = userDoc.data();
    const profileDoc = await db.collection("student_profiles").doc(req.user.id).get();
    const sp = profileDoc.exists ? profileDoc.data() : {};

    res.json({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      created_at: u.created_at,
      ...sp // Spread all student_profiles fields
    });
  } catch (err) {
    console.error("Get profile error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

router.put("/profile", auth, async (req, res) => {
  const { name, college, branch, year, skills, bio, resume_url, github_url, linkedin_url } = req.body;

  try {
    if (name) {
      await db.collection("users").doc(req.user.id).update({ name });
    }

    // Calculate basic profile completion on backend
    let completedFields = 0;
    const totalFields = 8;
    if (name) completedFields++;
    if (college) completedFields++;
    if (branch) completedFields++;
    if (year) completedFields++;
    if (skills && skills.length > 0) completedFields++;
    if (bio) completedFields++;
    if (resume_url) completedFields++;
    if (github_url || linkedin_url) completedFields++;
    
    const profile_completion = Math.round((completedFields / totalFields) * 100);

    const updateData = {
      college,
      branch,
      year: year || null,
      skills: skills || [],
      bio,
      resume_url,
      github_url,
      linkedin_url,
      profile_completion
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await db.collection("student_profiles").doc(req.user.id).set(updateData, { merge: true });

    res.json({ message: "Profile updated successfully." });
  } catch (err) {
    console.error("Update profile error:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;