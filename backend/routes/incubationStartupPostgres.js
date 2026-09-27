const express=require('express');
const router=express.Router();
const service=require('../services/incubationStartupPostgresService');

router.get('/startups/my',async(req,res,next)=>{
  try{
    res.json(await service.listStartupProfiles(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/startups/:id',async(req,res,next)=>{
  try{
    const row=await service.getStartupProfile(
      req.params.id,
      req.dbUserId
    );

    if(!row){
      return res.status(404).json({
        message:'Startup profile not found.',
        code:'STARTUP_NOT_FOUND'
      });
    }

    res.json(row);
  }catch(e){next(e);}
});

router.get('/applications/my',async(req,res,next)=>{
  try{
    res.json(
      await service.listIncubationApplications(req.dbUserId)
    );
  }catch(e){next(e);}
});

router.get('/applications/:id',async(req,res,next)=>{
  try{
    const row=await service.getIncubationApplication(
      req.params.id,
      req.dbUserId
    );

    if(!row){
      return res.status(404).json({
        message:'Incubation application not found.',
        code:'INCUBATION_APPLICATION_NOT_FOUND'
      });
    }

    res.json(row);
  }catch(e){next(e);}
});

router.get('/programs',async(req,res,next)=>{
  try{
    res.json(await service.listIncubationPrograms());
  }catch(e){next(e);}
});

router.get('/milestones/my',async(req,res,next)=>{
  try{
    res.json(await service.listStartupMilestones(req.dbUserId));
  }catch(e){next(e);}
});

module.exports=router;
