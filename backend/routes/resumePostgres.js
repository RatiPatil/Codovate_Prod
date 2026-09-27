const express=require('express');
const router=express.Router();
const {query}=require('../config/postgres');
const uid=req=>req.dbUser?.id||req.user?.id;

router.get('/',async(req,res,next)=>{
 try{
  const r=await query(`SELECT * FROM app.resumes WHERE user_id=$1 ORDER BY is_default DESC,updated_at DESC`,[uid(req)]);
  res.json(r.rows[0]||null);
 }catch(e){next(e)}
});

router.put('/',async(req,res,next)=>{
 try{
  const b=req.body||{};
  const name=String(b.name||b.resumeName||'My Resume');
  const r=await query(`SELECT id FROM app.resumes WHERE user_id=$1 AND name=$2 LIMIT 1`,[uid(req),name]);
  let result;
  if(r.rowCount){
   result=await query(`UPDATE app.resumes SET content=$1,updated_at=NOW() WHERE id=$2 RETURNING *`,[JSON.stringify(b),r.rows[0].id]);
  }else{
   result=await query(`INSERT INTO app.resumes(user_id,name,content,is_default) VALUES($1,$2,$3,true) RETURNING *`,[uid(req),name,JSON.stringify(b)]);
  }
  res.json({message:'Resume saved successfully.',resume:result.rows[0]});
 }catch(e){next(e)}
});

router.post('/save',async(req,res,next)=>{
 try{
  const b=req.body||{};
  const r=await query(`SELECT id FROM app.resumes WHERE user_id=$1 ORDER BY is_default DESC,updated_at DESC LIMIT 1`,[uid(req)]);
  let result;
  if(r.rowCount)result=await query(`UPDATE app.resumes SET content=$1,updated_at=NOW() WHERE id=$2 RETURNING *`,[JSON.stringify(b),r.rows[0].id]);
  else result=await query(`INSERT INTO app.resumes(user_id,name,content,is_default) VALUES($1,'My Resume',$2,true) RETURNING *`,[uid(req),JSON.stringify(b)]);
  res.json({message:'Resume saved successfully.',resume:result.rows[0]});
 }catch(e){next(e)}
});

router.get('/versions',async(req,res,next)=>{
 try{
  const r=await query(`SELECT rv.* FROM app.resume_versions rv JOIN app.resumes r ON r.id=rv.resume_id WHERE r.user_id=$1 ORDER BY rv.version_number DESC`,[uid(req)]);
  res.json(r.rows);
 }catch(e){next(e)}
});

router.post('/versions',async(req,res,next)=>{
 try{
  const b=req.body||{};
  if(!b.versionName)return res.status(400).json({message:'versionName required.'});
  const rr=await query(`SELECT id FROM app.resumes WHERE user_id=$1 ORDER BY is_default DESC,updated_at DESC LIMIT 1`,[uid(req)]);
  if(!rr.rowCount)return res.status(404).json({message:'Resume not found.'});
  const vr=await query(`SELECT COALESCE(MAX(version_number),0)+1 n FROM app.resume_versions WHERE resume_id=$1`,[rr.rows[0].id]);
  const r=await query(`INSERT INTO app.resume_versions(resume_id,version_number,content) VALUES($1,$2,$3) RETURNING *`,[rr.rows[0].id,vr.rows[0].n,JSON.stringify({versionName:b.versionName,templateId:b.templateId,pdfUrl:b.pdfUrl})]);
  res.json({message:'Version saved successfully.',id:r.rows[0].id,version:r.rows[0]});
 }catch(e){next(e)}
});

router.get('/versions/:id',async(req,res,next)=>{
 try{
  const r=await query(`SELECT rv.* FROM app.resume_versions rv JOIN app.resumes r ON r.id=rv.resume_id WHERE rv.id=$1 AND r.user_id=$2`,[req.params.id,uid(req)]);
  if(!r.rowCount)return res.status(404).json({message:'Version not found.'});
  res.json(r.rows[0]);
 }catch(e){next(e)}
});

router.delete('/versions/:id',async(req,res,next)=>{
 try{
  const r=await query(`DELETE FROM app.resume_versions rv USING app.resumes r WHERE rv.id=$1 AND rv.resume_id=r.id AND r.user_id=$2 RETURNING rv.id`,[req.params.id,uid(req)]);
  if(!r.rowCount)return res.status(404).json({message:'Version not found.'});
  res.json({message:'Version deleted.'});
 }catch(e){next(e)}
});

router.get('/reviews',async(req,res,next)=>{
 try{
  const r=await query(`SELECT rr.* FROM app.resume_reviews rr JOIN app.resumes r ON r.id=rr.resume_id WHERE r.user_id=$1 ORDER BY rr.created_at DESC`,[uid(req)]);
  res.json(r.rows);
 }catch(e){next(e)}
});

module.exports=router;
