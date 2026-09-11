const express=require('express');
const router=express.Router();
const service=require('../services/eventsCommunityPostgresService');

router.get('/events',async(req,res,next)=>{
  try{
    res.json(await service.listEvents({
      search:req.query.search
    }));
  }catch(e){next(e);}
});

router.get('/events/:id',async(req,res,next)=>{
  try{
    const row=await service.getEvent(req.params.id);
    if(!row){
      return res.status(404).json({
        message:'Event not found.',
        code:'EVENT_NOT_FOUND'
      });
    }
    res.json(row);
  }catch(e){next(e);}
});

router.get('/events/registrations/my',async(req,res,next)=>{
  try{
    res.json(await service.myRegistrations(req.dbUserId));
  }catch(e){next(e);}
});

router.post('/events/:id/register',async(req,res,next)=>{
  try{
    res.status(201).json(
      await service.registerEvent(req.dbUserId,req.params.id)
    );
  }catch(e){next(e);}
});

router.get('/communities',async(req,res,next)=>{
  try{
    res.json(await service.listCommunities());
  }catch(e){next(e);}
});

router.get('/community/posts',async(req,res,next)=>{
  try{
    res.json(await service.listPosts(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/community/activity/my',async(req,res,next)=>{
  try{
    res.json(await service.myCommunityActivity(req.dbUserId));
  }catch(e){next(e);}
});

module.exports=router;
