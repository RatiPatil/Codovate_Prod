const { query } = require('../config/postgres');

async function exists(table){
  const r=await query(`
    SELECT EXISTS(
      SELECT 1 FROM information_schema.tables
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

async function listDepartments(){
  const table=await firstTable(['departments','college_departments']);
  if(!table) return [];

  const r=await query(`
    SELECT *
    FROM app."${table}"
    ORDER BY id
    LIMIT 500
  `);

  return r.rows;
}

async function listFaculty(userId){
  const table=await firstTable([
    'faculty_profiles',
    'faculty',
    'faculty_members',
    'college_faculty'
  ]);

  if(!table) return [];

  const c=await cols(table);
  const uid=pick(
    ['user_id','faculty_user_id','owner_user_id'],
    c,
    false
  );

  const params=[];
  let where='';

  if(uid){
    params.push(userId);
    where=`WHERE f."${uid}"=$1`;
  }

  const r=await query(`
    SELECT f.*
    FROM app."${table}" f
    ${where}
    ORDER BY f.created_at DESC NULLS LAST,f.id DESC
    LIMIT 200
  `,params);

  return r.rows;
}

async function listPlacementDrives(filters={}){
  if(!(await exists('placement_drives'))) return [];

  const c=await cols('placement_drives');
  const status=pick(['status','state','record_status'],c,false);
  const title=pick(['title','name'],c,false);

  const where=[];
  const params=[];

  if(status){
    where.push(
      `LOWER(COALESCE(pd."${status}"::text,'')) NOT IN ('deleted','archived')`
    );
  }

  if(title && filters.search){
    params.push(filters.search);
    where.push(
      `pd."${title}" ILIKE '%' || $${params.length} || '%'`
    );
  }

  const r=await query(`
    SELECT pd.*
    FROM app.placement_drives pd
    ${where.length?`WHERE ${where.join(' AND ')}`:''}
    ORDER BY pd.start_date ASC NULLS LAST,
             pd.created_at DESC NULLS LAST,
             pd.id DESC
    LIMIT 200
  `,params);

  return r.rows;
}

async function getPlacementDrive(id){
  if(!(await exists('placement_drives'))) return null;

  const r=await query(`
    SELECT *
    FROM app.placement_drives
    WHERE id=$1
    LIMIT 1
  `,[id]);

  return r.rows[0]||null;
}

async function listDriveApplications(driveId){
  const table=await firstTable([
    'placement_drive_applications',
    'placement_applications'
  ]);

  if(!table) return [];

  const c=await cols(table);
  const drive=pick(
    ['placement_drive_id','drive_id'],
    c,
    true
  );

  const r=await query(`
    SELECT pda.*
    FROM app."${table}" pda
    WHERE pda."${drive}"=$1
    ORDER BY pda.created_at DESC NULLS LAST,pda.id DESC
    LIMIT 500
  `,[driveId]);

  return r.rows;
}

async function listPlacementRecords(userId){
  if(!(await exists('placements'))) return [];

  const c=await cols('placements');
  const uid=pick(
    ['user_id','student_id','placed_student_id'],
    c,
    false
  );

  if(!uid) return [];

  const r=await query(`
    SELECT p.*
    FROM app.placements p
    WHERE p."${uid}"=$1
    ORDER BY p.created_at DESC NULLS LAST,p.id DESC
  `,[userId]);

  return r.rows;
}

async function placementDashboard(){
  const out={
    students:0,
    placement_drives:0,
    applications:0,
    interviews:0,
    offers:0,
    placements:0
  };

  const countTable=async(table,key)=>{
    if(await exists(table)){
      const r=await query(`SELECT count(*)::int AS count FROM app."${table}"`);
      out[key]=r.rows[0].count;
    }
  };

  await countTable('users','students');
  await countTable('placement_drives','placement_drives');
  await countTable('applications','applications');
  await countTable('interviews','interviews');
  await countTable('offers','offers');
  await countTable('placements','placements');

  return out;
}

module.exports={
  listDepartments,
  listFaculty,
  listPlacementDrives,
  getPlacementDrive,
  listDriveApplications,
  listPlacementRecords,
  placementDashboard
};
