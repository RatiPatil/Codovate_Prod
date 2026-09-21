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

async function getStudentContext(userId){
  const out={
    user:null,
    profile:null,
    career_profile:null,
    skills:[],
    assessment_results:[],
    skill_gaps:[],
    roadmap:null
  };

  const user=await query(`
    SELECT id,email,full_name,full_name
    FROM app.users
    WHERE id=$1
    LIMIT 1
  `,[userId]);

  out.user=user.rows[0]||null;

  if(await exists('student_profiles')){
    const c=await cols('student_profiles');
    const uid=pick(['user_id','student_id'],c,true);

    const r=await query(`
      SELECT sp.*
      FROM app.student_profiles sp
      WHERE sp."${uid}"=$1
      LIMIT 1
    `,[userId]);

    out.profile=r.rows[0]||null;
  }

  if(await exists('career_profiles')){
    const c=await cols('career_profiles');
    const uid=pick(['student_id','user_id'],c,true);

    const r=await query(`
      SELECT cp.*
      FROM app.career_profiles cp
      WHERE cp."${uid}"=$1
      ORDER BY cp.updated_at DESC NULLS LAST
      LIMIT 1
    `,[userId]);

    out.career_profile=r.rows[0]||null;
  }

  const skillsTable=await firstTable([
    'student_skills',
    'user_skills'
  ]);

  if(skillsTable){
    const c=await cols(skillsTable);
    const uid=pick(['student_id','user_id','learner_id'],c,true);
    const skill=pick(['skill_id'],c,true);

    const r=await query(`
      SELECT ss.*
      FROM app."${skillsTable}" ss
      WHERE ss."${uid}"=$1
      ORDER BY ss."${skill}"
    `,[userId]);

    out.skills=r.rows;
  }

  const resultTable=await firstTable([
    'assessment_results',
    'skill_assessment_results',
    'assessment_attempts'
  ]);

  if(resultTable){
    const c=await cols(resultTable);
    const uid=pick(['student_id','user_id','learner_id'],c,true);

    const r=await query(`
      SELECT ar.*
      FROM app."${resultTable}" ar
      WHERE ar."${uid}"=$1
      ORDER BY ar.created_at DESC NULLS LAST,ar.id DESC
      LIMIT 50
    `,[userId]);

    out.assessment_results=r.rows;
  }

  const gapTable=await firstTable([
    'skill_gaps',
    'skill_gap_analysis',
    'assessment_skill_gaps'
  ]);

  if(gapTable){
    const c=await cols(gapTable);
    const uid=pick(['student_id','user_id','learner_id'],c,true);

    const r=await query(`
      SELECT sg.*
      FROM app."${gapTable}" sg
      WHERE sg."${uid}"=$1
      ORDER BY sg.created_at DESC NULLS LAST,sg.id DESC
      LIMIT 100
    `,[userId]);

    out.skill_gaps=r.rows;
  }

  if(await exists('user_roadmaps')){
    const r=await query(`
      SELECT *
      FROM app.user_roadmaps
      WHERE user_id=$1
      ORDER BY updated_at DESC NULLS LAST,generated_at DESC NULLS LAST
      LIMIT 1
    `,[userId]);

    out.roadmap=r.rows[0]||null;
  }

  return out;
}

async function getRecommendations(userId,includeDismissed=false){
  if(!(await exists('ai_recommendations'))) return [];

  const where=['r.user_id=$1'];
  const params=[userId];

  if(!includeDismissed){
    where.push('(r.dismissed=false OR r.dismissed IS NULL)');
  }

  const r=await query(`
    SELECT r.*
    FROM app.ai_recommendations r
    WHERE ${where.join(' AND ')}
    ORDER BY r.score DESC NULLS LAST,r.created_at DESC NULLS LAST,r.id DESC
    LIMIT 100
  `,params);

  return r.rows;
}

async function getRecommendation(id,userId){
  if(!(await exists('ai_recommendations'))) return null;

  const r=await query(`
    SELECT *
    FROM app.ai_recommendations
    WHERE id=$1 AND user_id=$2
    LIMIT 1
  `,[id,userId]);

  return r.rows[0]||null;
}

async function dismissRecommendation(id,userId){
  if(!(await exists('ai_recommendations'))){
    const e=new Error('AI recommendation table is not available.');
    e.status=503;
    e.code='MODULE_NOT_READY';
    throw e;
  }

  const r=await query(`
    UPDATE app.ai_recommendations
    SET dismissed=true
    WHERE id=$1 AND user_id=$2
    RETURNING *
  `,[id,userId]);

  if(!r.rowCount){
    const e=new Error('Recommendation not found or access denied.');
    e.status=404;
    e.code='RECOMMENDATION_NOT_FOUND';
    throw e;
  }

  return r.rows[0];
}

async function getRoadmap(userId){
  if(!(await exists('user_roadmaps'))) return null;

  const r=await query(`
    SELECT *
    FROM app.user_roadmaps
    WHERE user_id=$1
    ORDER BY updated_at DESC NULLS LAST,generated_at DESC NULLS LAST
    LIMIT 1
  `,[userId]);

  return r.rows[0]||null;
}

async function getRoadmapSteps(userId){
  if(!(await exists('roadmap_progress'))) return [];

  const r=await query(`
    SELECT rp.*
    FROM app.roadmap_progress rp
    JOIN app.user_roadmaps ur
      ON ur.id=rp.user_roadmap_id
    WHERE ur.user_id=$1
    ORDER BY rp.step_key
  `,[userId]);

  return r.rows;
}

async function assistantContext(userId){
  const context=await getStudentContext(userId);
  const recommendations=await getRecommendations(userId);
  const roadmapSteps=await getRoadmapSteps(userId);

  return {
    context,
    recommendations,
    roadmap_steps:roadmapSteps
  };
}

module.exports={
  getStudentContext,
  getRecommendations,
  getRecommendation,
  dismissRecommendation,
  getRoadmap,
  getRoadmapSteps,
  assistantContext
};
