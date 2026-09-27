const express=require('express');
const router=express.Router();
const service=require('../services/recruiterTalentPostgresService');

router.get('/companies/my',async(req,res,next)=>{
  try{
    res.json(await service.getCompanyProfiles(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/companies/:id',async(req,res,next)=>{
  try{
    const row=await service.getCompanyProfile(req.params.id);

    if(!row){
      return res.status(404).json({
        message:'Company profile not found.',
        code:'COMPANY_NOT_FOUND'
      });
    }

    res.json(row);
  }catch(e){next(e);}
});

router.get('/recruiters/my',async(req,res,next)=>{
  try{
    res.json(await service.getRecruiterProfiles(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/talent',async(req,res,next)=>{
  try{
    res.json(
      await service.listTalent({
        search:req.query.search,
        city:req.query.city,
        branch:req.query.branch,
        experience_level:req.query.experience_level,
        desired_role:req.query.desired_role
      })
    );
  }catch(e){next(e);}
});

router.get('/jobs/my',async(req,res,next)=>{
  try{
    res.json(await service.listRecruiterJobs(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/applications/my',async(req,res,next)=>{
  try{
    res.json(await service.getRecruiterApplications(req.dbUserId));
  }catch(e){next(e);}
});

module.exports=router;
