const express = require('express');
const router = express.Router();
const { db, FieldValue } = require('../config/firebase');
const auth = require('../middleware/auth');
const admin = require('firebase-admin');

// Helper to log user details
const getUserDetails = async (userId) => {
  const userDoc = await db.collection('profiles').doc(userId).get();
  if (userDoc.exists) {
    return {
      name: userDoc.data().personalInfo?.name || 'Anonymous',
      avatar: userDoc.data().personalInfo?.avatar || null,
      college: userDoc.data().education?.[0]?.college || 'Student'
    };
  }
  return { name: 'Anonymous', avatar: null, college: 'Student' };
};

// GET /api/community/posts
// Fetches community posts, optionally filtered by category
router.get('/posts', auth, async (req, res) => {
  const { category } = req.query;
  
  try {
    let query = db.collection('community_posts').orderBy('created_at', 'desc').limit(30);
    
    if (category && category !== 'All') {
      query = query.where('category', '==', category);
    }
    
    const postsSnap = await query.get();
    
    // Also fetch the user's bookmarks to mark which posts are bookmarked
    const bookmarksSnap = await db.collection('community_bookmarks')
      .where('user_id', '==', req.user.id)
      .get();
      
    const bookmarkedPostIds = new Set(bookmarksSnap.docs.map(d => d.data().post_id));
    
    // Also fetch user's upvotes
    const upvotesSnap = await db.collection('community_upvotes')
      .where('user_id', '==', req.user.id)
      .get();
      
    const upvotedPostIds = new Set(upvotesSnap.docs.map(d => d.data().post_id));

    const posts = await Promise.all(postsSnap.docs.map(async (doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        isBookmarked: bookmarkedPostIds.has(doc.id),
        isUpvoted: upvotedPostIds.has(doc.id)
      };
    }));

    res.json(posts);
  } catch (error) {
    console.error("Community fetch error:", error);
    res.status(500).json({ message: "Failed to load community posts" });
  }
});

// POST /api/community/posts
// Create a new post (Discussion, Question, Poll, Resource)
router.post('/posts', auth, async (req, res) => {
  const { type, category, title, content, pollOptions, resourceUrl } = req.body;
  if (!type || !category || !content) return res.status(400).json({ message: "Missing required fields" });

  try {
    const userDetails = await getUserDetails(req.user.id);
    
    const postData = {
      author_id: req.user.id,
      author_name: userDetails.name,
      author_avatar: userDetails.avatar,
      author_headline: userDetails.college,
      type, // 'discussion', 'question', 'poll', 'resource'
      category, // 'College', 'AI', 'Hackathons', etc.
      title: title || '',
      content,
      upvotes: 0,
      reply_count: 0,
      created_at: new Date()
    };
    
    if (type === 'poll' && pollOptions) {
      postData.poll_options = pollOptions.map(opt => ({ text: opt, votes: 0 }));
      postData.total_votes = 0;
    }
    
    if (type === 'resource' && resourceUrl) {
      postData.resource_url = resourceUrl;
    }

    const newPostRef = db.collection('community_posts').doc();
    await newPostRef.set(postData);

    res.json({ id: newPostRef.id, ...postData, isUpvoted: false, isBookmarked: false });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ message: "Failed to create post" });
  }
});

// POST /api/community/posts/:id/upvote
router.post('/posts/:id/upvote', auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const upvoteRef = db.collection('community_upvotes').doc(`${userId}_${postId}`);
    const postRef = db.collection('community_posts').doc(postId);
    
    const doc = await upvoteRef.get();
    
    if (doc.exists) {
      // Remove upvote
      await upvoteRef.delete();
      await postRef.update({ upvotes: FieldValue.increment(-1) });
      return res.json({ message: "Upvote removed", isUpvoted: false });
    } else {
      // Add upvote
      await upvoteRef.set({ user_id: userId, post_id: postId, created_at: new Date() });
      await postRef.update({ upvotes: FieldValue.increment(1) });
      return res.json({ message: "Upvoted successfully", isUpvoted: true });
    }
  } catch (error) {
    console.error("Upvote error:", error);
    res.status(500).json({ message: "Failed to toggle upvote" });
  }
});

// POST /api/community/posts/:id/bookmark
router.post('/posts/:id/bookmark', auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const bookmarkRef = db.collection('community_bookmarks').doc(`${userId}_${postId}`);
    
    const doc = await bookmarkRef.get();
    
    if (doc.exists) {
      // Remove bookmark
      await bookmarkRef.delete();
      return res.json({ message: "Bookmark removed", isBookmarked: false });
    } else {
      // Add bookmark
      await bookmarkRef.set({ user_id: userId, post_id: postId, created_at: new Date() });
      return res.json({ message: "Bookmarked successfully", isBookmarked: true });
    }
  } catch (error) {
    console.error("Bookmark error:", error);
    res.status(500).json({ message: "Failed to toggle bookmark" });
  }
});

// POST /api/community/posts/:id/vote (For Polls)
router.post('/posts/:id/vote', auth, async (req, res) => {
  const { optionIndex } = req.body;
  if (optionIndex === undefined) return res.status(400).json({ message: "Option index required" });
  
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    
    // Check if already voted
    const voteRecordRef = db.collection('community_poll_votes').doc(`${userId}_${postId}`);
    const voteDoc = await voteRecordRef.get();
    if (voteDoc.exists) {
      return res.status(400).json({ message: "You have already voted on this poll." });
    }
    
    // Transaction to safely update poll count
    await db.runTransaction(async (t) => {
      const postRef = db.collection('community_posts').doc(postId);
      const postDoc = await t.get(postRef);
      
      if (!postDoc.exists) throw new Error("Post not found");
      const post = postDoc.data();
      if (post.type !== 'poll') throw new Error("Post is not a poll");
      
      const newOptions = [...post.poll_options];
      newOptions[optionIndex].votes += 1;
      
      t.update(postRef, {
        poll_options: newOptions,
        total_votes: FieldValue.increment(1)
      });
      
      t.set(voteRecordRef, {
        user_id: userId,
        post_id: postId,
        option_index: optionIndex,
        created_at: new Date()
      });
    });
    
    res.json({ message: "Vote recorded successfully" });
  } catch (error) {
    console.error("Poll vote error:", error);
    res.status(500).json({ message: error.message || "Failed to vote" });
  }
});

module.exports = router;
