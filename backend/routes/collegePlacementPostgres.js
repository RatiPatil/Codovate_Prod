const express=require('express');
const router=express.Router();
const service=require('../services/collegePlacementPostgresService');

router.get('/departments',async(req,res,next)=>{
  try{
    res.json(await service.listDepartments());
  }catch(e){next(e);}
});

router.get('/faculty/my',async(req,res,next)=>{
  try{
    res.json(await service.listFaculty(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/placement-drives',async(req,res,next)=>{
  try{
    res.json(await service.listPlacementDrives({
      search:req.query.search
    }));
  }catch(e){next(e);}
});

router.get('/placement-drives/:id',async(req,res,next)=>{
  try{
    const row=await service.getPlacementDrive(req.params.id);

    if(!row){
      return res.status(404).json({
        message:'Placement drive not found.',
        code:'PLACEMENT_DRIVE_NOT_FOUND'
      });
    }

    res.json(row);
  }catch(e){next(e);}
});

router.get('/placement-drives/:id/applications',async(req,res,next)=>{
  try{
    res.json(
      await service.listDriveApplications(req.params.id)
    );
  }catch(e){next(e);}
});

router.get('/placements/my',async(req,res,next)=>{
  try{
    res.json(await service.listPlacementRecords(req.dbUserId));
  }catch(e){next(e);}
});

router.get('/placement-dashboard',async(req,res,next)=>{
  try{
    res.json(await service.placementDashboard());
  }catch(e){next(e);}
});

module.exports=router;
