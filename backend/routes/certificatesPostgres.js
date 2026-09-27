const express=require('express');
const router=express.Router();
const {query}=require('../config/postgres');
const uid=req=>req.dbUser?.id||req.user?.id;

router.post('/',async(req,res,next)=>{
 try{
  const b=req.body||{};
  if(!b.title||!b.issuer)return res.status(400).json({message:'Title and issuer are required.'});
  const r=await query(`
   INSERT INTO app.certificates
   (user_id,title,issuer,issue_date,expiry_date,credential_id,credential_url,image_url,skills)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
   RETURNING *
  `,[uid(req),b.title,b.issuer,b.issueDate||null,b.expiryDate||null,b.credentialId||null,b.credentialUrl||null,b.imageUrl||null,b.skills||null]);
  res.status(201).json(r.rows[0]);
 }catch(e){next(e)}
});

router.get('/',async(req,res,next)=>{
 try{
  const r=await query(`SELECT * FROM app.certificates WHERE user_id=$1 ORDER BY created_at DESC`,[uid(req)]);
  res.json(r.rows);
 }catch(e){next(e)}
});

router.put('/:id',async(req,res,next)=>{
 try{
  const b=req.body||{};
  const r=await query(`
   UPDATE app.certificates SET
   title=COALESCE($1,title),
   issuer=COALESCE($2,issuer),
   issue_date=COALESCE($3,issue_date),
   expiry_date=COALESCE($4,expiry_date),
   credential_id=COALESCE($5,credential_id),
   credential_url=COALESCE($6,credential_url),
   image_url=COALESCE($7,image_url),
   skills=COALESCE($8,skills)
   WHERE id=$9 AND user_id=$10
   RETURNING *
  `,[b.title,b.issuer,b.issueDate,b.expiryDate,b.credentialId,b.credentialUrl,b.imageUrl,b.skills,req.params.id,uid(req)]);
  if(!r.rowCount)return res.status(404).json({message:'Certificate not found.'});
  res.json(r.rows[0]);
 }catch(e){next(e)}
});

router.delete('/:id',async(req,res,next)=>{
 try{
  const r=await query(`DELETE FROM app.certificates WHERE id=$1 AND user_id=$2 RETURNING id`,[req.params.id,uid(req)]);
  if(!r.rowCount)return res.status(404).json({message:'Certificate not found.'});
  res.json({message:'Certificate deleted successfully.'});
 }catch(e){next(e)}
});

module.exports=router;
