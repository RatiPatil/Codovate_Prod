const express=require('express');
const router=express.Router();
const service=require('../services/learningPostgresService');

router.get('/courses',async(req,res,next)=>{
  try{
    res.json(await service.listCourses(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/courses/:id',async(req,res,next)=>{
  try{
    const course=await service.getCourse(req.params.id);
    if(!course){
      return res.status(404).json({
        message:'Course not found.',
        code:'COURSE_NOT_FOUND'
      });
    }
    res.json(course);
  }catch(e){next(e);}
});

router.get('/resources',async(req,res,next)=>{
  try{
    res.json(await service.listResources({
      type:req.query.type,
      search:req.query.search
    }));
  }catch(e){next(e);}
});

router.get('/progress/my',async(req,res,next)=>{
  try{
    res.json(await service.getMyProgress(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/enrollments/my',async(req,res,next)=>{
  try{
    res.json(await service.getMyEnrollments(req.dbUserId));
  }catch(e){next(e);}
});

router.post('/courses/:id/enroll',async(req,res,next)=>{
  try{
    res.status(201).json(
      await service.enroll(req.dbUserId,req.params.id)
    );
  }catch(e){next(e);}
});

module.exports=router;
