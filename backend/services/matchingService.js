/**
 * Shared Deterministic Student Matching & Skill Normalization Service
 */

const SKILL_ALIASES = {
  'react': 'react', 'react.js': 'react', 'reactjs': 'react',
  'vue': 'vue', 'vue.js': 'vue', 'vuejs': 'vue',
  'angular': 'angular', 'angularjs': 'angular',
  'js': 'javascript', 'javascript': 'javascript',
  'ts': 'typescript', 'typescript': 'typescript',
  'node': 'node.js', 'node.js': 'node.js', 'nodejs': 'node.js', 'express': 'express', 'express.js': 'express',
  'python': 'python', 'django': 'django', 'flask': 'flask',
  'java': 'java', 'spring': 'spring', 'spring boot': 'spring', 'springboot': 'spring',
  'c++': 'c++', 'cpp': 'c++', 'c#': 'c#',
  'html': 'html', 'css': 'css', 'tailwind': 'tailwind', 'tailwind css': 'tailwind',
  'ui/ux': 'ui/ux', 'ui': 'ui/ux', 'ux': 'ui/ux', 'figma': 'ui/ux', 'design': 'ui/ux',
  'docker': 'devops', 'kubernetes': 'devops', 'aws': 'devops', 'devops': 'devops', 'ci/cd': 'devops',
  'ml': 'machine learning', 'machine learning': 'machine learning', 'ai': 'machine learning', 'pytorch': 'machine learning', 'tensorflow': 'machine learning', 'data science': 'machine learning',
  'flutter': 'mobile', 'react native': 'mobile', 'android': 'mobile', 'ios': 'mobile', 'mobile': 'mobile'
};

const FRONTEND_SET = new Set(['react', 'vue', 'angular', 'html', 'css', 'tailwind', 'ui/ux', 'mobile']);
const BACKEND_SET = new Set(['node.js', 'express', 'python', 'django', 'flask', 'java', 'spring', 'c++', 'devops']);
const SPECIALIZED_SET = new Set(['devops', 'machine learning']);

function normalizeSkill(skill) {
  if (!skill) return '';
  const raw = (typeof skill === 'string' ? skill : skill.name || skill.title || '').trim().toLowerCase();
  return SKILL_ALIASES[raw] || raw;
}

/**
 * Calculates a deterministic match score between student A and student B (0 - 98)
 * 
 * Dimensions (Total 100 max, capped at 98):
 * 1. Complementary Skills (Max 30)
 * 2. Shared / Relevant Skills (Max 20)
 * 3. Career / Role Alignment (Max 20)
 * 4. Interests / Goals (Max 15)
 * 5. Same College / Context (Max 5)
 * 6. Profile Completeness (Max 10)
 */
function calculateMatchScore(profileA = {}, profileB = {}) {
  const skillsA = (profileA.skills || []).map(normalizeSkill).filter(Boolean);
  const skillsB = (profileB.skills || []).map(normalizeSkill).filter(Boolean);

  const roleA = (profileA.desiredRole || profileA.careerGoal || profileA.career_goal || '').toLowerCase().trim();
  const roleB = (profileB.desiredRole || profileB.careerGoal || profileB.career_goal || '').toLowerCase().trim();

  const collegeA = (profileA.education?.college || profileA.college || '').toLowerCase().trim();
  const collegeB = (profileB.education?.college || profileB.college || '').toLowerCase().trim();

  const interestsA = (profileA.interests || profileA.passionate_about || []).map(i => i.toLowerCase().trim());
  const interestsB = (profileB.interests || profileB.passionate_about || []).map(i => i.toLowerCase().trim());

  let score = 0;
  const matchReasons = [];

  // 1. Complementary Skill Matching (Max 30 pts)
  const isAFrontend = skillsA.some(s => FRONTEND_SET.has(s)) || roleA.includes('frontend') || roleA.includes('ui');
  const isBBackend = skillsB.some(s => BACKEND_SET.has(s)) || roleB.includes('backend');
  const isABackend = skillsA.some(s => BACKEND_SET.has(s)) || roleA.includes('backend');
  const isBFrontend = skillsB.some(s => FRONTEND_SET.has(s)) || roleB.includes('frontend');

  if ((isAFrontend && isBBackend) || (isABackend && isBFrontend)) {
    score += 30;
    matchReasons.push(`✓ Complementary ${isAFrontend ? 'Frontend' : 'Backend'} + ${isBBackend ? 'Backend' : 'Frontend'} skillsets`);
  } else if (skillsB.some(s => SPECIALIZED_SET.has(s))) {
    score += 25;
    const specSkill = skillsB.find(s => SPECIALIZED_SET.has(s));
    matchReasons.push(`✓ Brings specialized ${specSkill} skills`);
  }

  // 2. Shared / Relevant Skills (Max 20 pts)
  const sharedSkills = skillsB.filter(s => skillsA.includes(s));
  if (sharedSkills.length > 0) {
    const sharedPts = Math.min(20, sharedSkills.length * 5);
    score += sharedPts;
    matchReasons.push(`✓ Shared proficiency in ${sharedSkills.slice(0, 3).join(', ')}`);
  }

  // 3. Career / Role Alignment (Max 20 pts)
  if (roleA && roleB) {
    if (roleA === roleB) {
      score += 20;
      matchReasons.push(`✓ Perfectly aligned role target (${roleB})`);
    } else if ((roleA.includes('developer') || roleA.includes('engineer')) && (roleB.includes('developer') || roleB.includes('engineer'))) {
      score += 15;
      matchReasons.push(`✓ Aligned engineering career goals`);
    }
  }

  // 4. Interests / Goals (Max 15 pts)
  const commonInterests = interestsB.filter(i => interestsA.includes(i));
  if (commonInterests.length > 0) {
    const interestPts = Math.min(15, commonInterests.length * 7.5);
    score += interestPts;
    matchReasons.push(`✓ Shared interest in ${commonInterests[0]}`);
  }

  // 5. College Context (Max 5 pts)
  if (collegeA && collegeB && collegeA === collegeB) {
    score += 5;
    matchReasons.push(`✓ Same campus (${profileB.education?.college || profileB.college})`);
  }

  // 6. Profile Completeness (Max 10 pts)
  const completeness = profileB.profileCompletion || profileB.profile_completion || 0;
  if (completeness >= 70) {
    score += 10;
  } else if (completeness > 0) {
    score += Math.round((completeness / 100) * 10);
  }

  // Strict range 0 - 98 (NO artificial 65% floor, NO artificial 50% baseline)
  const finalScore = Math.max(0, Math.min(98, Math.round(score)));

  if (matchReasons.length === 0 && finalScore > 0) {
    matchReasons.push('✓ Compatible student collaborator');
  }

  return {
    score: finalScore,
    reasons: matchReasons
  };
}

module.exports = {
  normalizeSkill,
  calculateMatchScore
};
