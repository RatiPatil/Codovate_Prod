const express=require('express');
const router=express.Router();
const service=require('../services/showcasePostgresService');

router.get('/showcase',async(req,res,next)=>{
  try{
    res.json(await service.getShowcase(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/education',async(req,res,next)=>{
  try{res.json(await service.listEducation(req.dbUserId));}
  catch(e){next(e);}
});

router.get('/experience',async(req,res,next)=>{
  try{res.json(await service.listExperience(req.dbUserId));}
  catch(e){next(e);}
});

router.get('/resumes',async(req,res,next)=>{
  try{res.json(await service.listResumes(req.dbUserId));}
  catch(e){next(e);}
});

router.get('/resumes/:id',async(req,res,next)=>{
  try{
    const row=await service.getResume(req.params.id,req.dbUserId);
    if(!row){
      return res.status(404).json({
        message:'Resume not found.',
        code:'RESUME_NOT_FOUND'
      });
    }
    res.json(row);
  }catch(e){next(e);}
});

router.get('/portfolios',async(req,res,next)=>{
  try{res.json(await service.listPortfolios(req.dbUserId));}
  catch(e){next(e);}
});

router.get('/portfolios/:id',async(req,res,next)=>{
  try{
    const row=await service.getPortfolio(req.params.id,req.dbUserId);
    if(!row){
      return res.status(404).json({
        message:'Portfolio not found.',
        code:'PORTFOLIO_NOT_FOUND'
      });
    }
    res.json(row);
  }catch(e){next(e);}
});

router.get('/certificates',async(req,res,next)=>{
  try{res.json(await service.listCertificates(req.dbUserId));}
  catch(e){next(e);}
});

router.get('/certificates/:id',async(req,res,next)=>{
  try{
    const row=await service.getCertificate(req.params.id,req.dbUserId);
    if(!row){
      return res.status(404).json({
        message:'Certificate not found.',
        code:'CERTIFICATE_NOT_FOUND'
      });
    }
    res.json(row);
  }catch(e){next(e);}
});

module.exports=router;
