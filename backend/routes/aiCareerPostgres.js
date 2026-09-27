const express=require('express');
const router=express.Router();
const service=require('../services/aiCareerPostgresService');

router.get('/context',async(req,res,next)=>{
  try{
    res.json(await service.getStudentContext(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/recommendations',async(req,res,next)=>{
  try{
    res.json(
      await service.getRecommendations(
        req.dbUserId,
        String(req.query.include_dismissed||'false')==='true'
      )
    );
  }catch(e){next(e);}
});

router.get('/recommendations/:id',async(req,res,next)=>{
  try{
    const row=await service.getRecommendation(
      req.params.id,
      req.dbUserId
    );

    if(!row){
      return res.status(404).json({
        message:'AI recommendation not found.',
        code:'RECOMMENDATION_NOT_FOUND'
      });
    }

    res.json(row);
  }catch(e){next(e);}
});

router.put('/recommendations/:id/dismiss',async(req,res,next)=>{
  try{
    res.json(
      await service.dismissRecommendation(
        req.params.id,
        req.dbUserId
      )
    );
  }catch(e){next(e);}
});

router.get('/roadmap',async(req,res,next)=>{
  try{
    const roadmap=await service.getRoadmap(req.dbUserId);

    if(!roadmap){
      return res.status(404).json({
        message:'Career roadmap not found.',
        code:'ROADMAP_NOT_FOUND'
      });
    }

    res.json(roadmap);
  }catch(e){next(e);}
});

router.get('/roadmap/steps',async(req,res,next)=>{
  try{
    res.json(await service.getRoadmapSteps(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/assistant/context',async(req,res,next)=>{
  try{
    res.json(await service.assistantContext(req.dbUserId));
  }catch(e){next(e);}
});

module.exports=router;
