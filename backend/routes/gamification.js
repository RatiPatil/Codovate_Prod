const express = require('express');
const router = express.Router();
const { db, FieldValue } = require('../config/firebase');
const auth = require('../middleware/auth');
const admin = require('firebase-admin');

// ─── GET /api/gamification ──────────────────────────────────────────────────
// Returns overall gamification stats: streak, user badges, XP, challenges
router.get('/', auth, async (req, res) => {
  try {
    const uid = req.user.id;
    
    const [userDoc, userBadgesSnap, badgesSnap, analyticsDoc] = await Promise.all([
      db.collection('students').doc(uid).get(), // Wait, is it students or users? It's students for profile/general data. Let's get both just in case.
      db.collection('userBadges').where('userId', '==', uid).get(),
      db.collection('badges').get(),
      db.collection('analytics').doc(uid).get()
    ]);
    
    // Fallback: the system might use 'users' instead of 'students' for base auth
    const uDoc = await db.collection('users').doc(uid).get();
    
    const analytics = analyticsDoc.exists ? analyticsDoc.data() : {};
    
    // Streak logic
    const lastActive = analytics.last_active ? (analytics.last_active.seconds * 1000 || analytics.last_active) : 0;
    const streak = analytics.streak_count || 0;
    
    // Map master badges
    const allBadges = [];
    badgesSnap.forEach(b => allBadges.push({ id: b.id, ...b.data() }));
    
    // Map earned badges
    const earnedBadgeIds = [];
    userBadgesSnap.forEach(ub => earnedBadgeIds.push(ub.data().badgeId));
    
    const mappedBadges = allBadges.map(b => ({
      ...b,
      earned: earnedBadgeIds.includes(b.id)
    }));

    res.json({
      streak,
      lastActive,
      badges: mappedBadges,
      xp: analytics.profile_score || 0,
      coins: analytics.coins || 0,
      weeklyChallenges: [
        { id: 1, title: 'Complete 2 Projects', target: 2, current: 1, reward: 50 },
        { id: 2, title: 'Attend 1 Event', target: 1, current: 0, reward: 20 },
        { id: 3, title: 'Log in 5 days in a row', target: 5, current: Math.min(streak, 5), reward: 100 }
      ]
    });
  } catch (err) {
    console.error("Gamification overview error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── POST /api/gamification/streak ──────────────────────────────────────────
router.post('/streak', auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const analyticsRef = db.collection('analytics').doc(uid);
    const doc = await analyticsRef.get();
    
    const now = Date.now();
    let newStreak = 1;
    let xpGain = 10;
    
    if (doc.exists) {
      const data = doc.data();
      const lastActive = data.last_active ? (data.last_active.seconds ? data.last_active.seconds * 1000 : data.last_active) : 0;
      const currentStreak = data.streak_count || 0;
      
      const hoursSinceLastActive = (now - lastActive) / (1000 * 60 * 60);
      
      if (hoursSinceLastActive < 24) {
        // Already checked in today
        return res.json({ message: "Already checked in today!", streak: currentStreak, xpGain: 0 });
      } else if (hoursSinceLastActive >= 24 && hoursSinceLastActive < 48) {
        // Maintained streak
        newStreak = currentStreak + 1;
        xpGain = 10 + (newStreak * 5); // Bonus XP for streaks
      } else {
        // Streak broken
        newStreak = 1;
      }
    }
    
    await analyticsRef.set({
      last_active: now,
      streak_count: newStreak,
      profile_score: FieldValue.increment(xpGain),
      coins: FieldValue.increment(xpGain / 2)
    }, { merge: true });
    
    res.json({ message: "Checked in successfully!", streak: newStreak, xpGain });
  } catch (err) {
    console.error("Streak check-in error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ─── POST /api/gamification/seed ────────────────────────────────────────────
// Pre-populate default badges
router.post('/seed', auth, async (req, res) => {
  try {
    const defaultBadges = [
      { id: 'b_community_pro', name: 'Community Pro', type: 'community', criteria: 'Post 10 times in community', icon: '🏫', points: 50 },
      { id: 'b_event_enthusiast', name: 'Event Enthusiast', type: 'event', criteria: 'Attend 5 events', icon: '📅', points: 100 },
      { id: 'b_mentor_scholar', name: 'Mentor Scholar', type: 'mentor', criteria: 'Complete 3 mentor sessions', icon: '👨‍🏫', points: 150 },
      { id: 'b_team_player', name: 'Team Player', type: 'team', criteria: 'Join 2 teams', icon: '🤝', points: 50 },
      { id: 'b_code_warrior', name: 'Code Warrior', type: 'code', criteria: 'Solve 10 problems', icon: '💻', points: 100 },
      { id: 'b_early_adopter', name: 'Early Adopter', type: 'special', criteria: 'Join Codovate Beta', icon: '🚀', points: 500 }
    ];
    
    const batch = db.batch();
    for (const b of defaultBadges) {
      const ref = db.collection('badges').doc(b.id);
      batch.set(ref, b);
    }
    
    // Also give current user the Early Adopter badge
    const userBadgeRef = db.collection('userBadges').doc(`${req.user.id}_b_early_adopter`);
    batch.set(userBadgeRef, {
      userId: req.user.id,
      badgeId: 'b_early_adopter',
      earnedAt: new Date()
    });
    
    await batch.commit();
    res.json({ message: "Seeded badges successfully." });
  } catch (err) {
    console.error("Seed error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
