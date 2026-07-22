const { db } = require('./config/firebase');

async function seed() {
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
  
  await batch.commit();
  console.log("Seeded badges.");
  process.exit(0);
}

seed();
