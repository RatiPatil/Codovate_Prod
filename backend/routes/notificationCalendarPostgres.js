const express=require('express');
const router=express.Router();
const service=require('../services/notificationCalendarPostgresService');

router.get('/notifications',async(req,res,next)=>{
  try{
    res.json(await service.listNotifications(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/notifications/unread-count',async(req,res,next)=>{
  try{
    res.json({
      unread_count:await service.unreadCount(req.dbUserId)
    });
  }catch(e){next(e);}
});

router.put('/notifications/:id/read',async(req,res,next)=>{
  try{
    res.json(
      await service.markRead(
        req.params.id,
        req.dbUserId
      )
    );
  }catch(e){next(e);}
});

router.get('/calendar',async(req,res,next)=>{
  try{
    res.json(await service.listCalendarItems(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/deadlines',async(req,res,next)=>{
  try{
    res.json(await service.upcomingDeadlines(req.dbUserId));
  }catch(e){next(e);}
});

module.exports=router;
