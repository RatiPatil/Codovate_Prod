const express=require('express');
const router=express.Router();
const service=require('../services/codingMockInterviewPostgresService');

router.get('/problems',async(req,res,next)=>{
  try{
    res.json(await service.listCodingProblems({
      search:req.query.search,
      difficulty:req.query.difficulty
    }));
  }catch(e){next(e);}
});

router.get('/problems/:id',async(req,res,next)=>{
  try{
    const row=await service.getCodingProblem(req.params.id);

    if(!row){
      return res.status(404).json({
        message:'Coding problem not found.',
        code:'CODING_PROBLEM_NOT_FOUND'
      });
    }

    res.json(row);
  }catch(e){next(e);}
});

router.get('/attempts/my',async(req,res,next)=>{
  try{
    res.json(await service.myCodingAttempts(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/stats/my',async(req,res,next)=>{
  try{
    res.json(await service.getCodingStats(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/summary',async(req,res,next)=>{
  try{
    res.json(await service.codingSummary(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/mock-interviews',async(req,res,next)=>{
  try{
    res.json(await service.listMockInterviews(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/mock-interviews/:id',async(req,res,next)=>{
  try{
    const row=await service.getMockInterview(
      req.params.id,
      req.dbUserId
    );

    if(!row){
      return res.status(404).json({
        message:'Mock interview not found.',
        code:'MOCK_INTERVIEW_NOT_FOUND'
      });
    }

    res.json(row);
  }catch(e){next(e);}
});

router.get('/mock-questions',async(req,res,next)=>{
  try{
    res.json(await service.listMockQuestions());
  }catch(e){next(e);}
});

module.exports=router;
