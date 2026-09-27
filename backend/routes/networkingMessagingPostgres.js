const express=require('express');
const router=express.Router();
const service=require('../services/networkingMessagingPostgresService');

router.get('/connections',async(req,res,next)=>{
  try{res.json(await service.listConnections(req.dbUserId));}
  catch(e){next(e);}
});

router.post('/connections',async(req,res,next)=>{
  try{
    res.status(201).json(
      await service.sendConnectionRequest(
        req.dbUserId,
        req.body?.target_user_id || req.body?.user_id
      )
    );
  }catch(e){next(e);}
});

router.put('/connections/:id',async(req,res,next)=>{
  try{
    res.json(
      await service.updateConnection(
        req.params.id,
        req.dbUserId,
        req.body?.status
      )
    );
  }catch(e){next(e);}
});

router.get('/conversations',async(req,res,next)=>{
  try{res.json(await service.listConversations(req.dbUserId));}
  catch(e){next(e);}
});

router.post('/conversations',async(req,res,next)=>{
  try{
    res.status(201).json(
      await service.createConversation(
        req.dbUserId,
        req.body?.participant_ids || req.body?.participants || [],
        req.body?.type || 'direct'
      )
    );
  }catch(e){next(e);}
});

router.get('/conversations/:id/messages',async(req,res,next)=>{
  try{
    res.json(
      await service.getMessages(
        req.dbUserId,
        req.params.id,
        req.query.limit
      )
    );
  }catch(e){next(e);}
});

router.post('/conversations/:id/messages',async(req,res,next)=>{
  try{
    const io=req.app.get('io') || null;
    res.status(201).json(
      await service.sendMessage(
        req.dbUserId,
        req.params.id,
        req.body?.content || req.body?.message || req.body?.text,
        io
      )
    );
  }catch(e){next(e);}
});

module.exports=router;
