const express = require('express');
const router = express.Router();
const AiRecommendationEngine = require('../core/AiRecommendationEngine');
const ApiResponse = require('../utils/ApiResponse');

// All routes here should be strictly accessed by the student themselves.

router.get('/dashboard', async (req, res, next) => {
  try {
    const studentId = req.user.uid;
    const data = await AiRecommendationEngine.getDashboard(studentId);
    return ApiResponse.success(res, 200, "AI Dashboard Data retrieved", data);
  } catch (err) { next(err); }
});

router.get('/jobs', async (req, res, next) => {
  try {
    const studentId = req.user.uid;
    const data = await AiRecommendationEngine.getRecommendedJobs(studentId);
    return ApiResponse.success(res, 200, "Recommended Jobs retrieved", data);
  } catch (err) { next(err); }
});

// Mock routes for future expansion
router.get('/mentors', async (req, res, next) => {
  try {
    // For now, return a static array of mock mentors or empty array to fulfill the API contract
    return ApiResponse.success(res, 200, "Mentors retrieved", []);
  } catch (err) { next(err); }
});

module.exports = router;
