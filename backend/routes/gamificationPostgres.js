const express=require('express');
const router=express.Router();
const service=require('../services/gamificationPostgresService');

router.get('/summary',async(req,res,next)=>{
  try{
    res.json(await service.getGamificationSummary(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/goals',async(req,res,next)=>{
  try{
    res.json(await service.getMyGoalProgress(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/badges',async(req,res,next)=>{
  try{
    res.json(await service.listBadges(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/achievements',async(req,res,next)=>{
  try{
    res.json(await service.listAchievements(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/coding-stats',async(req,res,next)=>{
  try{
    res.json(await service.getCodingStats(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/leaderboard',async(req,res,next)=>{
  try{
    res.json(await service.leaderboard(req.query.limit));
  }catch(e){next(e);}
});

module.exports=router;
