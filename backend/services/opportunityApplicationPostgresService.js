const { query } = require('../config/postgres');

async function columns(table) {
  const r = await query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema='app' AND table_name=$1
    ORDER BY ordinal_position
  `, [table]);
  return new Set(r.rows.map(x => x.column_name));
}

function pick(body, allowed, available) {
  const out = {};
  for (const key of allowed) {
    if (available.has(key) && body?.[key] !== undefined) out[key] = body[key];
  }
  return out;
}

async function createOpportunity(userId, body) {
  const c = await columns('opportunities');

  const allowed = [
    'title','description','slug','type','organization_id','created_by',
    'status','location','locations','eligibility','required_skills','tags',
    'application_deadline','application_url','external_url','start_date',
    'end_date','stipend','salary_min','salary_max','is_remote','is_featured',
    'visibility','metadata'
  ];

  const data = pick(body, allowed, c);

  if (c.has('created_by')) data.created_by = userId;
  if (!data.title) {
    const e = new Error('Opportunity title is required.');
    e.status = 400;
    e.code = 'VALIDATION_ERROR';
    throw e;
  }

  if (c.has('status') && !data.status) data.status = 'draft';

  const keys = Object.keys(data);
  const vals = keys.map(k => data[k]);

  const result = await query(`
    INSERT INTO app.opportunities (${keys.map(k => `"${k}"`).join(', ')})
    VALUES (${vals.map((_,i)=>`$${i+1}`).join(', ')})
    RETURNING *
  `, vals);

  return result.rows[0];
}

async function listOpportunities(queryParams = {}) {
  const limit = Math.min(Math.max(Number(queryParams.limit) || 20, 1), 100);
  const offset = Math.max(Number(queryParams.offset) || 0, 0);
  const search = queryParams.search?.trim() || null;
  const type = queryParams.type || null;
  const status = queryParams.status || null;

  const result = await query(`
    SELECT o.*
    FROM app.opportunities o
    WHERE ($1::text IS NULL OR o.title ILIKE '%' || $1 || '%' OR COALESCE(o.description,'') ILIKE '%' || $1 || '%')
      AND ($2::text IS NULL OR o.type=$2)
      AND ($3::text IS NULL OR o.status=$3)
    ORDER BY o.created_at DESC NULLS LAST, o.id
    LIMIT $4 OFFSET $5
  `, [search, type, status, limit, offset]);

  return result.rows;
}

async function getOpportunity(id) {
  const result = await query(`
    SELECT o.*
    FROM app.opportunities o
    WHERE o.id=$1
    LIMIT 1
  `, [id]);

  return result.rows[0] || null;
}

async function createApplication(userId, opportunityId, body = {}) {
  const opp = await getOpportunity(opportunityId);

  if (!opp) {
    const e = new Error('Opportunity not found.');
    e.status = 404;
    e.code = 'OPPORTUNITY_NOT_FOUND';
    throw e;
  }

  const c = await columns('applications');

  const studentProfile = await query(`
    SELECT id
    FROM app.student_profiles
    WHERE user_id=$1
    LIMIT 1
  `, [userId]);

  if (!studentProfile.rowCount) {
    const e = new Error('Student profile is required before applying.');
    e.status = 400;
    e.code = 'STUDENT_PROFILE_REQUIRED';
    throw e;
  }

  const studentId = studentProfile.rows[0].id;

  const existing = await query(`
    SELECT id
    FROM app.applications
    WHERE opportunity_id=$1 AND student_id=$2
    LIMIT 1
  `, [opportunityId, studentId]);

  if (existing.rowCount) {
    const e = new Error('Application already exists for this opportunity.');
    e.status = 409;
    e.code = 'APPLICATION_ALREADY_EXISTS';
    throw e;
  }

  const allowed = [
    'opportunity_id','student_id','status','answers','cover_letter',
    'resume_id','notes','source','application_url','external_application_url'
  ];

  const data = pick(body, allowed, c);

  data.opportunity_id = opportunityId;
  data.student_id = studentId;

  if (c.has('status') && !data.status) data.status = 'submitted';

  const keys = Object.keys(data);
  const vals = keys.map(k => data[k]);

  const result = await query(`
    INSERT INTO app.applications (${keys.map(k => `"${k}"`).join(', ')})
    VALUES (${vals.map((_,i)=>`$${i+1}`).join(', ')})
    RETURNING *
  `, vals);

  const application = result.rows[0];

  if (await columns('application_status_history').then(x => x.has('new_status'))) {
    const historyCols = await columns('application_status_history');
    const history = {};
    if (historyCols.has('application_id')) history.application_id = application.id;
    if (historyCols.has('new_status')) history.new_status = application.status || 'submitted';
    if (historyCols.has('old_status')) history.old_status = null;
    if (historyCols.has('changed_by')) history.changed_by = userId;

    const hk = Object.keys(history);
    const hv = hk.map(k => history[k]);

    if (hk.length) {
      await query(`
        INSERT INTO app.application_status_history (${hk.map(k=>`"${k}"`).join(', ')})
        VALUES (${hv.map((_,i)=>`$${i+1}`).join(', ')})
      `, hv);
    }
  }

  return application;
}

async function myApplications(userId) {
  const r = await query(`
    SELECT a.*, o.title AS opportunity_title, o.organization_id
    FROM app.applications a
    JOIN app.student_profiles sp ON sp.id=a.student_id
    JOIN app.opportunities o ON o.id=a.opportunity_id
    WHERE sp.user_id=$1
    ORDER BY COALESCE(a.updated_at,a.applied_at,a.created_at) DESC NULLS LAST, a.id
  `, [userId]);

  return r.rows;
}

async function updateApplicationStatus(applicationId, status, changedBy) {
  const current = await query(`
    SELECT id,status
    FROM app.applications
    WHERE id=$1
    LIMIT 1
  `, [applicationId]);

  if (!current.rowCount) {
    const e = new Error('Application not found.');
    e.status = 404;
    e.code = 'APPLICATION_NOT_FOUND';
    throw e;
  }

  await query(`
    UPDATE app.applications
    SET status=$1
    WHERE id=$2
  `, [status, applicationId]);

  const hc = await columns('application_status_history');
  const data = {};

  if (hc.has('application_id')) data.application_id = applicationId;
  if (hc.has('old_status')) data.old_status = current.rows[0].status;
  if (hc.has('new_status')) data.new_status = status;
  if (hc.has('changed_by')) data.changed_by = changedBy;

  const hk = Object.keys(data);
  const hv = hk.map(k => data[k]);

  if (hk.length) {
    await query(`
      INSERT INTO app.application_status_history (${hk.map(k=>`"${k}"`).join(', ')})
      VALUES (${hv.map((_,i)=>`$${i+1}`).join(', ')})
    `, hv);
  }

  return getApplication(applicationId);
}

async function getApplication(id) {
  const r = await query(`
    SELECT a.*, o.title AS opportunity_title, o.organization_id
    FROM app.applications a
    JOIN app.opportunities o ON o.id=a.opportunity_id
    WHERE a.id=$1
    LIMIT 1
  `, [id]);

  return r.rows[0] || null;
}

module.exports = {
  createOpportunity,
  listOpportunities,
  getOpportunity,
  createApplication,
  myApplications,
  updateApplicationStatus,
  getApplication
};
