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
    const college_id = userDoc.data().college_id;
    
    if (!college || !college_id) {
      return res.json({ 
        hasCollege: false, 
        message: "You must set your college in your profile to access the community." 
      });
    }

    // Fetch live announcements from Firestore
    const announcementsSnap = await db.collection('announcements')
      .where('college_id', '==', college_id)
      .orderBy('created_at', 'desc')
      .limit(10)
      .get();
      
    const announcements = [];
    announcementsSnap.forEach(doc => {
      const data = doc.data();
      announcements.push({
        id: doc.id,
        author: data.author || 'Admin',
        title: data.title,
        content: data.content,
        date: data.created_at?.toDate ? data.created_at.toDate().toLocaleDateString() : 'Recently'
      });
    });

    // Fetch live discussions from Firestore
    const discussionsSnap = await db.collection('discussions')
      .where('college_id', '==', college_id)
      .orderBy('created_at', 'desc')
      .limit(20)
      .get();

    const discussions = [];
    discussionsSnap.forEach(doc => {
      const data = doc.data();
      discussions.push({
        id: doc.id,
        author: data.author_name || 'Anonymous',
        title: data.title,
        content: data.content,
        replies: data.reply_count || 0,
        date: data.created_at?.toDate ? data.created_at.toDate().toLocaleDateString() : 'Recently'
      });
    });

    res.json({
      hasCollege: true,
      collegeName: college,
      announcements,
      discussions
    });

  } catch (error) {
    console.error("Community error:", error);
    res.status(500).json({ message: "Failed to load community data" });
  }
});

// POST /api/community/discussions
// Create a new discussion topic
router.post('/discussions', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ message: "Title and content are required." });

    const userDoc = await db.collection('students').doc(req.user.id).get();
    const college_id = userDoc.data().college_id;
    if (!college_id) return res.status(403).json({ message: "Must be part of a college to post." });

    const newDiscussionRef = db.collection('discussions').doc();
    await newDiscussionRef.set({
      college_id,
      author_id: req.user.id,
      author_name: userDoc.data().name || userDoc.data().full_name || 'Student',
      title,
      content,
      reply_count: 0,
      created_at: new Date()
    });

    res.json({ message: "Discussion posted successfully!", id: newDiscussionRef.id });
  } catch (error) {
    console.error("Create discussion error:", error);
    res.status(500).json({ message: "Failed to post discussion" });
  }
});

module.exports = router;
