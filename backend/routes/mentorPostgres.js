const express=require('express');
const router=express.Router();
const service=require('../services/mentorPostgresService');

router.get('/mentors',async(req,res,next)=>{
  try{
    res.json(await service.getMentorProfiles(req.dbUserId,{
      search:req.query.search,
      domain:req.query.domain,
      status:req.query.status,
      exclude_user_id:req.dbUserId
    }));
  }catch(e){next(e);}
});

router.get('/mentors/:id',async(req,res,next)=>{
  try{
    const mentor=await service.getMentorProfile(req.params.id);
    if(!mentor){
      return res.status(404).json({
        message:'Mentor profile not found.',
        code:'MENTOR_NOT_FOUND'
      });
    }
    res.json(mentor);
  }catch(e){next(e);}
});

router.get('/queries/my',async(req,res,next)=>{
  try{res.json(await service.listQueries(req.dbUserId));}
  catch(e){next(e);}
});

router.get('/sessions/my',async(req,res,next)=>{
  try{res.json(await service.listSessions(req.dbUserId));}
  catch(e){next(e);}
});

router.get('/reviews/my',async(req,res,next)=>{
  try{res.json(await service.listReviews(req.dbUserId));}
  catch(e){next(e);}
});

module.exports=router;
