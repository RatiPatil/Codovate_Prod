const JobRepository = require('./JobRepository');
const AppError = require('../utils/AppError');
const db = require('../config/firebase');

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

class AiRecommendationEngine {
  
  /**
   * Calculates a match score between a student profile and a job.
   * Deterministic Algorithm: 
   * - Skill Match (50% weight): Intersection of studentSkills and requiredSkills.
   * - CGPA Threshold (30% weight): Does student meet the cutoff?
   * - Experience/Branch (20% weight): Exact match bonus.
   */
  async calculateJobMatch(studentProfile, job) {
    if (!studentProfile) throw new AppError('Student profile required for matching', 400);

    const studentSkills = Array.isArray(studentProfile.skills) ? studentProfile.skills.map(s => s.toLowerCase()) : [];
    const reqSkills = Array.isArray(job.skillsRequired) ? job.skillsRequired.map(s => s.toLowerCase()) : [];
    
    // Skill Match
    let skillScore = 0;
    let missingSkills = [];
    if (reqSkills.length > 0) {
      let matched = 0;
      reqSkills.forEach(skill => {
        if (studentSkills.includes(skill)) {
          matched++;
        } else {
          missingSkills.push(skill);
        }
      });
      skillScore = (matched / reqSkills.length) * 50; // Max 50 points
    } else {
      skillScore = 50; // If no skills required, full points
    }

    // CGPA Match
    let cgpaScore = 0;
    const studentCgpa = parseFloat(studentProfile.cgpa) || 0;
    const reqCgpa = parseFloat(job.eligibilityCriteria?.cgpaCutoff) || 0;
    if (studentCgpa >= reqCgpa) {
      cgpaScore = 30; // Max 30 points
    } else {
      // Partial points if close (within 1.0)
      const diff = reqCgpa - studentCgpa;
      if (diff <= 1.0) {
         cgpaScore = 30 - (diff * 30);
      }
    }

    // Branch Match (Mock assumption: if eligibleBranches includes student's department)
    let branchScore = 0;
    const eligibleBranches = job.eligibilityCriteria?.eligibleBranches || [];
    if (eligibleBranches.length === 0 || eligibleBranches.includes(studentProfile.department)) {
      branchScore = 20; // Max 20 points
    }

    const totalScore = Math.round(skillScore + cgpaScore + branchScore);
    
    // Generate explanation
    let reason = '';
    if (totalScore >= 80) reason = 'Excellent match based on your strong skill alignment and CGPA.';
    else if (totalScore >= 50) reason = 'Good match, but you are missing some key required skills.';
    else reason = 'Low match. You do not meet the core eligibility or skill requirements for this role.';

    return {
      jobId: job.id,
      jobTitle: job.title,
      company: job.companyName || 'Corporate',
      matchScore: totalScore,
      missingSkills,
      reason
    };
  }

  async getRecommendedJobs(studentId) {
    // 1. Fetch Student Profile
    const studentDoc = await db.collection('users').doc(studentId).get();
    if (!studentDoc.exists) throw new AppError('Student not found', 404);
    const studentProfile = mapDoc(studentDoc);

    // 2. Fetch Active Jobs (Limit for performance)
    const activeJobs = await JobRepository.collection.where('status', '==', 'PUBLISHED').limit(50).get();
    
    // 3. Score all jobs
    const recommendations = [];
    for (const doc of activeJobs.docs) {
      const job = { id: doc.id, ...mapDoc(doc) };
      const matchData = await this.calculateJobMatch(studentProfile, job);
      if (matchData.matchScore >= 40) { // Only recommend if score > 40%
        recommendations.push(matchData);
      }
    }

    // 4. Sort by highest match
    return recommendations.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
  }

  async generateRoadmap(missingSkills) {
    // A deterministic timeline generator based on volume of missing skills
    const roadmap = [];
    if (!missingSkills || missingSkills.length === 0) {
      return [{ timeframe: '30 Days', action: 'Apply aggressively. Your profile is fully optimized.' }];
    }

    roadmap.push({ timeframe: '30 Days', action: `Complete a foundational course in: ${missingSkills[0]}` });
    if (missingSkills.length > 1) {
      roadmap.push({ timeframe: '60 Days', action: `Build a project utilizing: ${missingSkills[0]} and ${missingSkills[1]}` });
    }
    if (missingSkills.length > 2) {
      roadmap.push({ timeframe: '90 Days', action: `Master advanced concepts in: ${missingSkills.slice(2).join(', ')}` });
    }

    return roadmap;
  }

  async getDashboard(studentId) {
    const recommendedJobs = await this.getRecommendedJobs(studentId);
    
    // Aggregate missing skills across top 3 jobs to find the biggest gap
    const skillGaps = new Set();
    recommendedJobs.slice(0,3).forEach(job => {
       job.missingSkills.forEach(s => skillGaps.add(s));
    });
    
    const roadmap = await this.generateRoadmap(Array.from(skillGaps));
    
    // Calculate a mock Placement Probability (e.g. Average of top 3 match scores)
    let avgMatch = 0;
    if (recommendedJobs.length > 0) {
      avgMatch = recommendedJobs.slice(0,3).reduce((sum, job) => sum + job.matchScore, 0) / Math.min(3, recommendedJobs.length);
    }
    const placementProbability = Math.min(99, Math.round(avgMatch + 5)); // Add a small baseline curve

    return {
      placementProbability,
      recommendedJobs,
      skillGap: Array.from(skillGaps),
      roadmap
    };
  }
}

module.exports = new AiRecommendationEngine();
