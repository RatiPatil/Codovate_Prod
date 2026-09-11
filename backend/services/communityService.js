const { query } = require("../config/postgres");

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

async function getCommunityUpdates(uid) {
  try {
    const updates = [];

    // 1. Teams
    const teamsResult = await query(`SELECT t.* FROM app.teams t JOIN app.team_members tm ON tm.team_id = t.id WHERE tm.user_id = $1 LIMIT 3`, [uid]);
    const teamsSnap = { docs: teamsResult.rows.map(row => ({ data: () => row })) };
    if (!teamsSnap.empty) {
      teamsSnap.forEach(doc => {
        updates.push({
          id: `team_${doc.id}`,
          type: 'team',
          title: mapDoc(doc).name || 'Team Update',
          description: 'New activity in your team workspace.',
          linkUrl: '/teams',
          icon: '👥',
          timestamp: new Date()
        });
      });
    }

    // 2. Next Event
    // We assume events are stored in students -> savedEvents or we just fetch general active events
    // For now, let's fetch a general active event or if we have an RSVP collection.
    // In our architecture, events are saved in `students -> saved_events`, but let's mock the "next event" for dashboard.
    const eventsResult = await query(`SELECT * FROM app.events ORDER BY COALESCE(start_at, created_at) ASC LIMIT 1`);
    const eventsSnap = { docs: eventsResult.rows.map(row => ({ data: () => row })) };
    if (!eventsSnap.empty) {
      const ev = mapDoc(eventsSnap.docs[0]);
      updates.push({
        id: `event_${eventsSnap.docs[0].id}`,
        type: 'event',
        title: ev.title || 'Upcoming Event',
        description: ev.date ? `Scheduled for ${new Date(ev.date).toLocaleDateString()}` : 'Check out the details.',
        linkUrl: '/events',
        icon: '📅',
        timestamp: new Date(ev.date || Date.now())
      });
    }

    // 3. Mentors
    // Mock upcoming session if we don't have a robust bookings table
    updates.push({
      id: `mentor_upcoming`,
      type: 'mentor',
      title: 'Mentor Session: System Design',
      description: 'Scheduled with Jane Doe tomorrow.',
      linkUrl: '/mentors',
      icon: '🎓',
      timestamp: new Date(Date.now() + 86400000)
    });

    // 4. Community Challenge
    updates.push({
      id: `challenge_weekly`,
      type: 'challenge',
      title: 'Weekly Challenge: Fix 5 Bugs',
      description: 'You are 2/5 bugs away from the Code Warrior badge!',
      linkUrl: '/rewards',
      icon: '🔥',
      timestamp: new Date()
    });

    // 5. Recent Message
    updates.push({
      id: `msg_recent`,
      type: 'message',
      title: 'Alex (Frontend Dev)',
      description: '"Hey, did you finish the API integration?"',
      linkUrl: '/chat',
      icon: '💬',
      timestamp: new Date(Date.now() - 3600000)
    });

    // Sort by timestamp DESC
    updates.sort((a, b) => b.timestamp - a.timestamp);

    return updates;
  } catch (err) {
    console.error("Error in getCommunityUpdates:", err);
    return [];
  }
}

module.exports = { getCommunityUpdates };
