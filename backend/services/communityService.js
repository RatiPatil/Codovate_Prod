/**
 * communityService.js — Firebase/Firestore implementation
 *
 * Replaces the PostgreSQL-based community service.
 * Fetches community updates (teams, events, etc.) from Firestore.
 */

const { db } = require('../config/firebase');

async function getCommunityUpdates(uid) {
  const updates = [];

  try {
    // 1. Teams the user is a member of
    try {
      const teamsSnap = await db.collection('teams')
        .where('memberIds', 'array-contains', uid)
        .limit(3)
        .get();

      teamsSnap.forEach(doc => {
        const data = doc.data();
        updates.push({
          id: `team_${doc.id}`,
          type: 'team',
          title: data.name || 'Team Update',
          description: 'New activity in your team workspace.',
          linkUrl: '/teams',
          icon: '👥',
          timestamp: data.updatedAt?.toDate() || new Date()
        });
      });
    } catch (err) {
      console.warn('[communityService] teams fetch warn:', err.message);
    }

    // 2. Next upcoming event
    try {
      const now = new Date();
      const eventsSnap = await db.collection('events')
        .where('startDate', '>=', now)
        .orderBy('startDate', 'asc')
        .limit(1)
        .get();

      eventsSnap.forEach(doc => {
        const data = doc.data();
        const eventDate = data.startDate?.toDate?.() || data.date || null;
        updates.push({
          id: `event_${doc.id}`,
          type: 'event',
          title: data.title || 'Upcoming Event',
          description: eventDate
            ? `Scheduled for ${new Date(eventDate).toLocaleDateString()}`
            : 'Check out the details.',
          linkUrl: '/events',
          icon: '📅',
          timestamp: eventDate ? new Date(eventDate) : new Date()
        });
      });
    } catch (err) {
      // events collection may not have an index yet — that's okay
      console.warn('[communityService] events fetch warn:', err.message);
    }

    // 3. Mentor session placeholder (real data would come from mentorSessions collection)
    updates.push({
      id: 'mentor_upcoming',
      type: 'mentor',
      title: 'Mentor Session: System Design',
      description: 'Scheduled with your mentor tomorrow.',
      linkUrl: '/mentors',
      icon: '🎓',
      timestamp: new Date(Date.now() + 86400000)
    });

    // 4. Community challenge placeholder
    updates.push({
      id: 'challenge_weekly',
      type: 'challenge',
      title: 'Weekly Challenge: Fix 5 Bugs',
      description: 'You are 2/5 bugs away from the Code Warrior badge!',
      linkUrl: '/rewards',
      icon: '🔥',
      timestamp: new Date()
    });

    // 5. Recent message placeholder
    try {
      const msgSnap = await db.collection('student_chat_messages')
        .where('receiver_id', '==', uid)
        .orderBy('created_at', 'desc')
        .limit(1)
        .get();

      if (!msgSnap.empty) {
        const msg = msgSnap.docs[0].data();
        updates.push({
          id: `msg_${msgSnap.docs[0].id}`,
          type: 'message',
          title: msg.sender_name || 'A connection',
          description: `"${(msg.content || msg.message || '').slice(0, 80)}"`,
          linkUrl: '/chat',
          icon: '💬',
          timestamp: msg.created_at?.toDate?.() || new Date(Date.now() - 3600000)
        });
      } else {
        updates.push({
          id: 'msg_recent',
          type: 'message',
          title: 'Your connections',
          description: 'Start a conversation with your network.',
          linkUrl: '/chat',
          icon: '💬',
          timestamp: new Date(Date.now() - 3600000)
        });
      }
    } catch (err) {
      console.warn('[communityService] messages fetch warn:', err.message);
      updates.push({
        id: 'msg_recent',
        type: 'message',
        title: 'Your connections',
        description: 'Start a conversation with your network.',
        linkUrl: '/chat',
        icon: '💬',
        timestamp: new Date(Date.now() - 3600000)
      });
    }

    // Sort by timestamp DESC
    updates.sort((a, b) => b.timestamp - a.timestamp);
    return updates;

  } catch (err) {
    console.error('[communityService] getCommunityUpdates error:', err);
    return [];
  }
}

module.exports = { getCommunityUpdates };
