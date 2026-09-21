const { query } = require('../config/postgres');

async function syncPlacementReadiness(uid, data = {}) {
  try {
    const score = data.score ?? null;
    const details = data.details ?? {};
    const improvements = data.improvements ?? [];

    await query(
      `INSERT INTO app.placement_readiness
        (user_id, score, details, improvements, calculated_at)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         score = EXCLUDED.score,
         details = EXCLUDED.details,
         improvements = EXCLUDED.improvements,
         calculated_at = NOW()`,
      [
        uid,
        score,
        JSON.stringify(details),
        JSON.stringify(improvements)
      ]
    );

    return true;
  } catch (err) {
    console.error('❌ syncPlacementReadiness PostgreSQL error:', err.message);
    return false;
  }
}

async function getDashboardData(uid) {
  const [
    userResult,
    profileResult,
    goalsResult,
    preferencesResult,
    skillsResult,
    achievementsResult,
    roadmapResult,
    learningResult,
    applicationsResult,
    notificationsResult,
    resumesResult,
    portfolioResult,
    certificatesResult,
    readinessResult
  ] = await Promise.all([
    query(`SELECT * FROM app.users WHERE id = $1 LIMIT 1`, [uid]),
    query(`SELECT * FROM app.student_profiles WHERE user_id = $1 LIMIT 1`, [uid]),
    query(`SELECT * FROM app.user_goals WHERE user_id = $1 LIMIT 1`, [uid]),
    query(`SELECT * FROM app.user_preferences WHERE user_id = $1 LIMIT 1`, [uid]),
    query(`SELECT s.* FROM app.skills s JOIN app.student_skills ss ON ss.skill_id = s.id WHERE ss.user_id = $1 ORDER BY s.name`, [uid]),
    query(`SELECT * FROM app.achievements WHERE user_id = $1 ORDER BY achievement_date DESC NULLS LAST, created_at DESC`, [uid]),
    query(`SELECT ur.*, r.* FROM app.user_roadmaps ur LEFT JOIN app.roadmaps r ON r.id = ur.roadmap_id WHERE ur.user_id = $1 ORDER BY ur.created_at DESC LIMIT 10`, [uid]),
    query(`SELECT lp.*, c.* FROM app.learning_progress lp LEFT JOIN app.courses c ON c.id = lp.course_id WHERE lp.user_id = $1 ORDER BY lp.updated_at DESC LIMIT 10`, [uid]),
    query(`SELECT a.* FROM app.applications a WHERE a.student_id = $1 ORDER BY a.created_at DESC LIMIT 10`, [uid]),
    query(`SELECT * FROM app.notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`, [uid]),
    query(`SELECT * FROM app.resumes WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 10`, [uid]),
    query(`SELECT p.*, pp.* FROM app.portfolios p LEFT JOIN app.portfolio_projects pp ON pp.portfolio_id = p.id WHERE p.user_id = $1 ORDER BY p.updated_at DESC`, [uid]),
    query(`SELECT * FROM app.certificates WHERE user_id = $1 ORDER BY issue_date DESC NULLS LAST, created_at DESC`, [uid]),
    query(`SELECT * FROM app.placement_readiness WHERE user_id = $1 LIMIT 1`, [uid])
  ]);

  return {
    user: userResult.rows[0] || null,
    profile: profileResult.rows[0] || null,
    goals: goalsResult.rows[0] || null,
    preferences: preferencesResult.rows[0] || null,
    skills: skillsResult.rows,
    achievements: achievementsResult.rows,
    roadmap: roadmapResult.rows,
    learning: learningResult.rows,
    applications: applicationsResult.rows,
    notifications: notificationsResult.rows,
    resumes: resumesResult.rows,
    portfolio: portfolioResult.rows,
    certificates: certificatesResult.rows,
    placementReadiness: readinessResult.rows[0] || null,
    generatedAt: new Date().toISOString()
  };
}

async function getDashboard(uid) {
  return getDashboardData(uid);
}

module.exports = {
  syncPlacementReadiness,
  getDashboardData,
  getDashboard
};
