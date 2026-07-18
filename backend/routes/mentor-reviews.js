const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

// Add a portfolio/resume review
router.post("/:student_id", auth, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ message: "Only mentors can leave reviews." });
    }

    const { rating, feedback } = req.body;
    if (!rating || !feedback) {
      return res.status(400).json({ message: "Rating and feedback are required." });
    }

    const reviewRef = db.collection("mentor_reviews").doc();
    const reviewData = {
      id: reviewRef.id,
      mentor_id: req.user.id,
      mentor_name: req.user.name,
      student_id: req.params.student_id,
      rating: parseFloat(rating),
      feedback,
      created_at: new Date()
    };

    await reviewRef.set(reviewData);

    // Update mentor stats (add 1 to total reviews)
    const mentorDocs = await db.collection("mentors").where("user_id", "==", req.user.id).get();
    if (!mentorDocs.empty) {
      const mentorRef = db.collection("mentors").doc(mentorDocs.docs[0].id);
      const mData = mentorDocs.docs[0].data();
      await mentorRef.update({
        total_reviews: (mData.total_reviews || 0) + 1
      });
    }

    res.status(201).json(reviewData);
  } catch (err) {
    console.error("Add review error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// Get reviews for a student
router.get("/student/:student_id", async (req, res) => {
  try {
    const snapshot = await db.collection("mentor_reviews")
      .where("student_id", "==", req.params.student_id)
      .orderBy("created_at", "desc")
      .get();
      
    const reviews = snapshot.docs.map(doc => doc.data());
    res.json(reviews);
  } catch (err) {
    console.error("Get reviews error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
