const { query } = require('../config/postgres');

const getMyDashboard = async (req, res, next) => {
  try {
    const userId = req.user && (req.user.id || req.user.uid || req.user.userId);
    if (!userId) return res.status(401).json({ message: 'Authenticated user required.' });

    const [
      user,
      profile,
      goals,
      preferences,
      skills,
      achievements,
      roadmap,
      learning,
      applications,
      notifications,
      resumes,
      portfolio,
      certificates,
      readiness
    ] = await Promise.all([
      query(`SELECT id,email,display_name,role,account_status,created_at,updated_at FROM app.users WHERE id=$1`, [userId]),
      query(`SELECT * FROM app.student_profiles WHERE user_id=$1`, [userId]),
      query(`SELECT * FROM app.user_goals WHERE user_id=$1`, [userId]),
      query(`SELECT * FROM app.user_preferences WHERE user_id=$1`, [userId]),
      query(`SELECT s.id,s.name,s.slug,ss.verified FROM app.student_skills ss JOIN app.skills s ON s.id=ss.skill_id JOIN app.student_profiles sp ON sp.id=ss.student_id WHERE sp.user_id=$1 ORDER BY s.name`, [userId]),
      query(`SELECT * FROM app.achievements WHERE user_id=$1 ORDER BY achievement_date DESC NULLS LAST,created_at DESC LIMIT 10`, [userId]),
      query(`SELECT ur.*,r.title,r.steps FROM app.user_roadmaps ur JOIN app.roadmaps r ON r.id=ur.roadmap_id WHERE ur.user_id=$1 ORDER BY ur.created_at DESC LIMIT 5`, [userId]).catch(() => ({rows:[]})),
      query(`SELECT * FROM app.learning_progress WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 10`, [userId]).catch(() => ({rows:[]})),
      query(`SELECT * FROM app.applications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10`, [userId]).catch(() => ({rows:[]})),
      query(`SELECT * FROM app.notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10`, [userId]).catch(() => ({rows:[]})),
      query(`SELECT * FROM app.resumes WHERE user_id=$1 ORDER BY is_default DESC,updated_at DESC LIMIT 5`, [userId]),
      query(`SELECT p.*,COUNT(pp.id)::int AS project_count FROM app.portfolios p LEFT JOIN app.portfolio_projects pp ON pp.portfolio_id=p.id WHERE p.user_id=$1 GROUP BY p.id ORDER BY p.updated_at DESC LIMIT 1`, [userId]),
      query(`SELECT * FROM app.certificates WHERE user_id=$1 ORDER BY issue_date DESC NULLS LAST,created_at DESC LIMIT 10`, [userId]),
      query(`SELECT * FROM app.placement_readiness WHERE user_id=$1`, [userId])
    ]);

    const profileData = profile.rows[0] || null;
    const goalData = goals.rows[0] || null;
    const counts = {
      skills: skills.rowCount,
      achievements: achievements.rowCount,
      applications: applications.rowCount,
      notifications: notifications.rowCount,
      resumes: resumes.rowCount,
      certificates: certificates.rowCount,
      learning_items: learning.rowCount
    };

    const dashboard = {
      user: user.rows[0] || null,
      profile: profileData,
      goals: goalData,
      preferences: preferences.rows[0] || null,
      skills: skills.rows,
      achievements: achievements.rows,
      roadmap: roadmap.rows,
      learning: learning.rows,
      applications: applications.rows,
      notifications: notifications.rows,
      resumes: resumes.rows,
      portfolio: portfolio.rows[0] || null,
      certificates: certificates.rows,
      placementReadiness: readiness.rows[0] || null,
      stats: counts,
      profileCompletion: profileData ? Number(profileData.profile_completion || 0) : 0
    };

    res.json({ success: true, data: dashboard });
  } catch (err) {
    console.error('PostgreSQL dashboard error:', err);
    next(err);
  }
};

module.exports = { getMyDashboard };
