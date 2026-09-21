const { query } = require('../config/postgres');

async function exists(table){
  const r=await query(`
    SELECT EXISTS(
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema='app' AND table_name=$1
    ) AS exists
  `,[table]);
  return r.rows[0].exists;
}

async function cols(table){
  const r=await query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema='app' AND table_name=$1
    ORDER BY ordinal_position
  `,[table]);
  return r.rows.map(x=>x.column_name);
}

function pick(candidates,c,required=false){
  const v=candidates.find(x=>c.includes(x));
  if(!v && required){
    const e=new Error(`Required column missing: ${candidates.join(', ')}`);
    e.status=500;
    e.code='SCHEMA_MAPPING_ERROR';
    throw e;
  }
  return v||null;
}

async function firstTable(names){
  for(const n of names){
    if(await exists(n)) return n;
  }
  return null;
}

async function getCompanyProfiles(userId){
  const table=await firstTable([
    'company_profiles',
    'companies'
  ]);

  if(!table) return [];

  const c=await cols(table);
  const owner=pick(
    ['owner_user_id','user_id','created_by','recruiter_user_id'],
    c,
    false
  );

  const params=[];
  const where=[];

  if(owner){
    params.push(userId);
    where.push(`cp."${owner}"=$${params.length}`);
  }

  const r=await query(`
    SELECT cp.*
    FROM app."${table}" cp
    ${where.length?`WHERE ${where.join(' AND ')}`:''}
    ORDER BY cp.created_at DESC NULLS LAST,cp.id DESC
    LIMIT 100
  `,params);

  return r.rows;
}

async function getCompanyProfile(id){
  const table=await firstTable([
    'company_profiles',
    'companies'
  ]);

  if(!table) return null;

  const r=await query(`
    SELECT *
    FROM app."${table}"
    WHERE id=$1
    LIMIT 1
  `,[id]);

  return r.rows[0]||null;
}

async function getRecruiterProfiles(userId){
  const table=await firstTable([
    'recruiter_profiles',
    'recruiters',
    'company_recruiters'
  ]);

  if(!table) return [];

  const c=await cols(table);
  const uid=pick(
    ['user_id','recruiter_user_id','owner_user_id'],
    c,
    false
  );

  const params=[];
  const where=[];

  if(uid){
    params.push(userId);
    where.push(`r."${uid}"=$${params.length}`);
  }

  const result=await query(`
    SELECT r.*
    FROM app."${table}" r
    ${where.length?`WHERE ${where.join(' AND ')}`:''}
    ORDER BY r.created_at DESC NULLS LAST,r.id DESC
    LIMIT 100
  `,params);

  return result.rows;
}

async function listTalent(filters={}){
  if(!(await exists('student_profiles'))) return [];

  const c=await cols('student_profiles');

  const city=pick(['city','current_city'],c,false);
  const branch=pick(['branch','stream','specialization'],c,false);
  const experience=pick(['experience_level','experience'],c,false);
  const role=pick(['desired_role','target_role'],c,false);
  const visibility=pick(['visibility','profile_visibility'],c,false);
  const userCol=pick(['user_id','student_id'],c,true);

  const where=[];
  const params=[];

  if(visibility){
    where.push(
      `LOWER(COALESCE(sp."${visibility}"::text,'')) IN ('public','visible','connections','true','1')`
    );
  }

  if(city && filters.city){
    params.push(filters.city);
    where.push(`sp."${city}" ILIKE '%' || $${params.length} || '%'`);
  }

  if(branch && filters.branch){
    params.push(filters.branch);
    where.push(`sp."${branch}" ILIKE '%' || $${params.length} || '%'`);
  }

  if(experience && filters.experience_level){
    params.push(filters.experience_level);
    where.push(`sp."${experience}" ILIKE '%' || $${params.length} || '%'`);
  }

  if(role && filters.desired_role){
    params.push(filters.desired_role);
    where.push(`sp."${role}" ILIKE '%' || $${params.length} || '%'`);
  }

  const searchParts=[];

  if(role) searchParts.push(`sp."${role}"::text`);
  if(branch) searchParts.push(`sp."${branch}"::text`);
  if(city) searchParts.push(`sp."${city}"::text`);

  if(filters.search && searchParts.length){
    params.push(filters.search);
    where.push(`(${searchParts.join(' || \' \' || ')}) ILIKE '%' || $${params.length} || '%'`);
  }

  const r=await query(`
    SELECT
      sp.*,
      u.email
    FROM app.student_profiles sp
    JOIN app.users u
      ON u.id=sp."${userCol}"
    ${where.length?`WHERE ${where.join(' AND ')}`:''}
    ORDER BY sp.updated_at DESC NULLS LAST,sp.created_at DESC NULLS LAST,sp.id
    LIMIT 100
  `,params);

  return r.rows;
}

async function listRecruiterJobs(userId){
  const table=await firstTable([
    'jobs',
    'job_postings',
    'opportunities'
  ]);

  if(!table) return [];

  const c=await cols(table);
  const owner=pick(
    ['created_by','owner_user_id','recruiter_user_id','company_user_id'],
    c,
    false
  );

  const params=[];
  const where=[];

  if(owner){
    params.push(userId);
    where.push(`j."${owner}"=$${params.length}`);
  }

  const r=await query(`
    SELECT j.*
    FROM app."${table}" j
    ${where.length?`WHERE ${where.join(' AND ')}`:''}
    ORDER BY j.created_at DESC NULLS LAST,j.id DESC
    LIMIT 100
  `,params);

  return r.rows;
}

async function getRecruiterApplications(userId){
  if(!(await exists('applications'))) return [];

  const c=await cols('applications');
  const owner=pick(
    ['recruiter_id','recruiter_user_id','company_user_id'],
    c,
    false
  );

  if(!owner) return [];

  const r=await query(`
    SELECT a.*
    FROM app.applications a
    WHERE a."${owner}"=$1
    ORDER BY a.created_at DESC NULLS LAST,a.id DESC
    LIMIT 200
  `,[userId]);

  return r.rows;
}

module.exports={
  getCompanyProfiles,
  getCompanyProfile,
  getRecruiterProfiles,
  listTalent,
  listRecruiterJobs,
  getRecruiterApplications
};
