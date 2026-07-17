const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const auth = require('../middleware/auth');

// GET /api/community
// Fetches data specific to the user's college community
router.get('/', auth, async (req, res) => {
  try {
    const userDoc = await db.collection('students').doc(req.user.id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const college = userDoc.data().college;
    if (!college) {
      return res.json({ 
        hasCollege: false, 
        message: "You must set your college in your profile to access the community." 
      });
    }

    // Mock data for the MVP to show how it works
    const mockAnnouncements = [
      { id: 1, author: "Dean of Engineering", date: "2 hours ago", title: "Upcoming Tech Fest", content: `Registrations for the annual Tech Fest at ${college} are now open! Make sure to sign up.` },
      { id: 2, author: "Placement Cell", date: "1 day ago", title: "Mock Interview Schedule", content: "The placement cell has released the schedule for the upcoming mock interviews." }
    ];

    const mockDiscussions = [
      { id: 1, author: "John Doe", title: "Looking for team for hackathon", replies: 4 },
      { id: 2, author: "Jane Smith", title: "Anyone have notes for OS?", replies: 12 },
    ];

    res.json({
      hasCollege: true,
      collegeName: college,
      announcements: mockAnnouncements,
      discussions: mockDiscussions
    });

  } catch (error) {
    console.error("Community error:", error);
    res.status(500).json({ message: "Failed to load community data" });
  }
});

module.exports = router;
