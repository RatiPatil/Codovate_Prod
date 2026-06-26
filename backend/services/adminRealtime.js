const { db } = require('../config/firebase');

let isInitialized = false;

// Cache of current stats to avoid re-calculating everything on every change if possible,
// but for simplicity we will recalculate on snapshot triggers.
// For production scale, these should be calculated using Cloud Functions and stored in a metadata document.

const initializeAdminRealtime = (io) => {
  if (isInitialized) return;
  isInitialized = true;
  console.log('⚡ Initializing Admin Real-time Streams...');

  // 1. Super Admin Global Listeners
  // Listen to Users collection
  db.collection('users').onSnapshot(async (snapshot) => {
    // Every time users change, recalculate total users, active users, etc.
    const totalUsers = snapshot.size;
    let students = 0;
    let mentors = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.role === 'student') students++;
      if (data.role === 'mentor') mentors++;
    });

    // Broadcast to super admin room
    io.to('admin_super').emit('super_admin_metrics_update', {
      totalUsers,
      totalStudents: students,
      totalMentors: mentors,
      timestamp: Date.now()
    });
  });

  // Listen to Applications collection
  db.collection('applications').onSnapshot(snapshot => {
    io.to('admin_super').emit('super_admin_applications_update', {
      totalApplications: snapshot.size,
      timestamp: Date.now()
    });
  });

  // Listen to Opportunities collection
  db.collection('opportunities').onSnapshot(snapshot => {
    io.to('admin_super').emit('super_admin_opportunities_update', {
      totalOpportunities: snapshot.size,
      timestamp: Date.now()
    });
  });

  // 2. Company Admin Listeners
  // When opportunities change, we can notify specific company rooms
  db.collection('opportunities').onSnapshot(snapshot => {
    // Group opportunities by company_id
    const companyOpps = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.company_id) {
        if (!companyOpps[data.company_id]) companyOpps[data.company_id] = { jobs: 0, internships: 0 };
        if (data.type === 'job') companyOpps[data.company_id].jobs++;
        if (data.type === 'internship') companyOpps[data.company_id].internships++;
      }
    });

    // Emit to each company's specific room
    for (const [companyId, metrics] of Object.entries(companyOpps)) {
      io.to(`admin_company_${companyId}`).emit('company_metrics_update', {
        ...metrics,
        timestamp: Date.now()
      });
    }
  });

  // Similarly, when applications change, group by company_id and notify
  db.collection('applications').onSnapshot(snapshot => {
    const companyApps = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.company_id) {
        if (!companyApps[data.company_id]) companyApps[data.company_id] = { total: 0, shortlisted: 0, selected: 0 };
        companyApps[data.company_id].total++;
        if (data.status === 'shortlisted') companyApps[data.company_id].shortlisted++;
        if (data.status === 'selected') companyApps[data.company_id].selected++;
      }
    });

    for (const [companyId, metrics] of Object.entries(companyApps)) {
      io.to(`admin_company_${companyId}`).emit('company_applications_update', {
        ...metrics,
        timestamp: Date.now()
      });
    }
  });

  // 3. College Admin Listeners
  // 4. Mentor Listeners
  // (We will expand these as the specific dashboard widgets are built)
};

module.exports = { initializeAdminRealtime };
