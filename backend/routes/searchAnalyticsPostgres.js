const express=require('express');
const router=express.Router();
const service=require('../services/searchAnalyticsPostgresService');

router.get('/search',async(req,res,next)=>{
  try{
    res.json(
      await service.unifiedSearch(
        req.query.q || req.query.search,
        req.query.limit
      )
    );
  }catch(e){next(e);}
});

router.get('/analytics/overview',async(req,res,next)=>{
  try{
    res.json(await service.platformOverview());
  }catch(e){next(e);}
});

router.get('/analytics/me',async(req,res,next)=>{
  try{
    res.json(await service.userOverview(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/audit/recent',async(req,res,next)=>{
  try{
    const roles=Array.isArray(req.dbRoles)
      ? req.dbRoles.map(String)
      : [];

    if(!req.dbIsWildcard && !roles.includes('super_admin')){
      return res.status(403).json({
        message:'Administrator access required.',
        code:'ADMIN_ACCESS_REQUIRED'
      });
    }

    res.json(await service.recentAudit(req.query.limit));
  }catch(e){next(e);}
});

module.exports=router;
