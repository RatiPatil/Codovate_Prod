const { query } = require('../config/postgres');

async function getTeam(id) {
  const r = await query(`
    SELECT *
    FROM app.teams
    WHERE id=$1
    LIMIT 1
  `, [id]);
  return r.rows[0] || null;
}

async function createTeam(userId, body = {}) {
  const name = String(body.name || '').trim();

  if (!name) {
    const e = new Error('Team name is required.');
    e.status = 400;
    e.code = 'VALIDATION_ERROR';
    throw e;
  }

  const r = await query(`
    INSERT INTO app.teams (
      name,
      description,
      owner_user_id,
      created_by,
      status
    )
    VALUES ($1,$2,$3,$3,'active')
    RETURNING *
  `, [
    name,
    body.description || null,
    userId
  ]);

  const team = r.rows[0];

  await query(`
    INSERT INTO app.team_members(team_id,user_id,role,status)
    VALUES($1,$2,'owner','active')
    ON CONFLICT(team_id,user_id) DO NOTHING
  `, [team.id,userId]);

  return team;
}

async function listMyTeams(userId) {
  const r = await query(`
    SELECT
      t.*,
      tm.role AS member_role,
      tm.status AS member_status
    FROM app.team_members tm
    JOIN app.teams t ON t.id=tm.team_id
    WHERE tm.user_id=$1
    ORDER BY t.updated_at DESC NULLS LAST,t.created_at DESC NULLS LAST,t.id
  `,[userId]);

  return r.rows;
}

async function getTeamMembers(teamId, userId) {
  const access = await query(`
    SELECT 1
    FROM app.team_members
    WHERE team_id=$1
      AND user_id=$2
      AND status='active'
    LIMIT 1
  `,[teamId,userId]);

  if (!access.rowCount) {
    const e = new Error('You are not a member of this team.');
    e.status = 403;
    e.code = 'TEAM_ACCESS_DENIED';
    throw e;
  }

  const r = await query(`
    SELECT
      tm.*,
      u.email,
      u.firebase_uid
    FROM app.team_members tm
    JOIN app.users u ON u.id=tm.user_id
    WHERE tm.team_id=$1
    ORDER BY tm.role,tm.created_at NULLS LAST,tm.user_id
  `,[teamId]);

  return r.rows;
}

async function inviteMember(teamId, inviterId, invitedUserId) {
  const owner = await query(`
    SELECT 1
    FROM app.team_members
    WHERE team_id=$1
      AND user_id=$2
      AND status='active'
      AND role IN ('owner','admin')
    LIMIT 1
  `,[teamId,inviterId]);

  if (!owner.rowCount) {
    const e = new Error('Only team owners/admins can invite members.');
    e.status = 403;
    e.code = 'TEAM_INVITE_FORBIDDEN';
    throw e;
  }

  const user = await query(`
    SELECT id,email
    FROM app.users
    WHERE id=$1
    LIMIT 1
  `,[invitedUserId]);

  if (!user.rowCount) {
    const e = new Error('Invited user not found.');
    e.status = 404;
    e.code = 'USER_NOT_FOUND';
    throw e;
  }

  const r = await query(`
    INSERT INTO app.team_invites(
      team_id,
      invited_by,
      invited_user_id,
      status
    )
    VALUES($1,$2,$3,'pending')
    RETURNING *
  `,[teamId,inviterId,invitedUserId]);

  return r.rows[0];
}

async function addMember(teamId, userId, role='member') {
  const r = await query(`
    INSERT INTO app.team_members(team_id,user_id,role,status)
    VALUES($1,$2,$3,'active')
    ON CONFLICT(team_id,user_id)
    DO UPDATE SET role=EXCLUDED.role,status='active'
    RETURNING *
  `,[teamId,userId,role]);

  return r.rows[0];
}

async function createProject(userId, body = {}) {
  const name = String(body.name || body.title || '').trim();

  if (!name) {
    const e = new Error('Project name is required.');
    e.status = 400;
    e.code = 'VALIDATION_ERROR';
    throw e;
  }

  if (body.team_id) {
    const access = await query(`
      SELECT 1
      FROM app.team_members
      WHERE team_id=$1 AND user_id=$2 AND status='active'
      LIMIT 1
    `,[body.team_id,userId]);

    if (!access.rowCount) {
      const e = new Error('You must be a team member to create a project for this team.');
      e.status = 403;
      e.code = 'TEAM_ACCESS_DENIED';
      throw e;
    }
  }

  const r = await query(`
    INSERT INTO app.projects(
      name,
      slug,
      description,
      owner_user_id,
      team_id,
      status,
      tags,
      tech_stack
    )
    VALUES(
      $1,
      NULLIF($2,''),
      $3,
      $4,
      $5,
      'draft',
      COALESCE($6::jsonb,'[]'::jsonb),
      COALESCE($7::jsonb,'[]'::jsonb)
    )
    RETURNING *
  `,[
    name,
    body.slug || '',
    body.description || null,
    userId,
    body.team_id || null,
    JSON.stringify(Array.isArray(body.tags) ? body.tags : []),
    JSON.stringify(Array.isArray(body.tech_stack) ? body.tech_stack : [])
  ]);

  const project = r.rows[0];

  await query(`
    INSERT INTO app.project_members(project_id,user_id,role)
    VALUES($1,$2,'owner')
    ON CONFLICT(project_id,user_id) DO NOTHING
  `,[project.id,userId]);

  return project;
}

async function listMyProjects(userId) {
  const r = await query(`
    SELECT
      p.*,
      pm.role AS member_role
    FROM app.project_members pm
    JOIN app.projects p ON p.id=pm.project_id
    WHERE pm.user_id=$1
    ORDER BY p.updated_at DESC NULLS LAST,p.created_at DESC NULLS LAST,p.id
  `,[userId]);

  return r.rows;
}

async function getProject(id,userId) {
  const r = await query(`
    SELECT p.*,pm.role AS member_role
    FROM app.projects p
    JOIN app.project_members pm ON pm.project_id=p.id
    WHERE p.id=$1 AND pm.user_id=$2
    LIMIT 1
  `,[id,userId]);

  return r.rows[0] || null;
}

module.exports = {
  createTeam,
  listMyTeams,
  getTeamMembers,
  inviteMember,
  addMember,
  createProject,
  listMyProjects,
  getProject
};
