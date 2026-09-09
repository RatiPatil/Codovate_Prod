const express = require('express');
const router = express.Router();
const service = require('../services/teamProjectPostgresService');

router.get('/teams', async (req,res,next)=>{
  try { res.json(await service.listMyTeams(req.dbUserId)); }
  catch(e){ next(e); }
});

router.post('/teams', async (req,res,next)=>{
  try { res.status(201).json(await service.createTeam(req.dbUserId,req.body||{})); }
  catch(e){ next(e); }
});

router.get('/teams/:id/members', async (req,res,next)=>{
  try { res.json(await service.getTeamMembers(req.params.id,req.dbUserId)); }
  catch(e){ next(e); }
});

router.post('/teams/:id/invites', async (req,res,next)=>{
  try {
    res.status(201).json(
      await service.inviteMember(
        req.params.id,
        req.dbUserId,
        req.body?.invited_user_id
      )
    );
  } catch(e){ next(e); }
});

router.post('/teams/:id/members', async (req,res,next)=>{
  try {
    res.status(201).json(
      await service.addMember(
        req.params.id,
        req.body?.user_id,
        req.body?.role || 'member'
      )
    );
  } catch(e){ next(e); }
});

router.get('/projects', async (req,res,next)=>{
  try { res.json(await service.listMyProjects(req.dbUserId)); }
  catch(e){ next(e); }
});

router.post('/projects', async (req,res,next)=>{
  try { res.status(201).json(await service.createProject(req.dbUserId,req.body||{})); }
  catch(e){ next(e); }
});

router.get('/projects/:id', async (req,res,next)=>{
  try {
    const row = await service.getProject(req.params.id,req.dbUserId);
    if (!row) return res.status(404).json({
      message:'Project not found.',
      code:'PROJECT_NOT_FOUND'
    });
    res.json(row);
  } catch(e){ next(e); }
});

module.exports = router;
