const express = require("express");
const router = express.Router();
const { db, FieldValue } = require("../config/firebase");
const auth = require("../middleware/auth");
const { mapDoc, mapDocs } = require("../utils/firestoreMapper");

// ─── DEFAULT SEED CATALOG (Used if Firestore catalog is empty) ───────────────
const SEED_COURSES = [
  {
    id: "course_react_guide",
    title: "React.js Complete Guide",
    description: "Build modern web apps with React, Hooks, Context, and Redux Toolkit.",
    category: "Web Development",
    skills: ["React", "JavaScript", "Frontend", "JSX"],
    level: "Intermediate",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80",
    techIcon: "react",
    durationMinutes: 720, // 12h
    instructor: "Sarah Jenkins",
    rating: 4.8,
    published: true,
    modules: [
      {
        id: "mod_1",
        title: "Module 1: React Fundamentals & JSX",
        order: 1,
        lessons: [
          {
            id: "les_1_1",
            title: "What is React & Virtual DOM",
            type: "video",
            durationMinutes: 45,
            order: 1,
            videoUrl: "https://www.youtube.com/embed/bMknfKXIFA8",
            notes: "# Introduction to React\n\nReact is a declarative, efficient, and flexible JavaScript library for building user interfaces.\n\n### Key Concepts:\n- **Component-Based**: Build encapsulated components that manage their own state.\n- **Virtual DOM**: React creates an in-memory data-structure cache, computes the resulting differences, and then updates the browser's displayed DOM efficiently."
          },
          {
            id: "les_1_2",
            title: "JSX Syntax & Component Architecture",
            type: "notes",
            durationMinutes: 60,
            order: 2,
            notes: "# JSX Syntax Guide\n\nJSX allows us to write HTML-like structures inside JavaScript files.\n\n```jsx\nfunction Welcome(props) {\n  return <h1>Hello, {props.name}</h1>;\n}\n```"
          },
          {
            id: "les_1_3",
            title: "State Management with useState",
            type: "video",
            durationMinutes: 90,
            order: 3,
            videoUrl: "https://www.youtube.com/embed/O6P86uwfdR0",
            notes: "# useState Hook\n\nThe `useState` hook allows functional components to hold local state."
          }
        ]
      },
      {
        id: "mod_2",
        title: "Module 2: Advanced Hooks & Effects",
        order: 2,
        lessons: [
          {
            id: "les_2_1",
            title: "Side Effects with useEffect",
            type: "video",
            durationMinutes: 90,
            order: 1,
            videoUrl: "https://www.youtube.com/embed/0ZJgOiRjBLg",
            notes: "# useEffect Hook\n\nPerform side effects in function components such as data fetching or subscriptions."
          },
          {
            id: "les_2_2",
            title: "React Context API & Global State",
            type: "notes",
            durationMinutes: 75,
            order: 2,
            notes: "# Context API\n\nPass data down the component tree without prop drilling."
          },
          {
            id: "les_2_3",
            title: "React Core Quiz",
            type: "quiz",
            durationMinutes: 30,
            order: 3,
            quiz: {
              questions: [
                {
                  question: "What is the Virtual DOM in React?",
                  options: [
                    "A direct copy of the browser DOM updated on every render",
                    "An in-memory representation of the real DOM used for fast diffing",
                    "A database table used by React Server Components",
                    "A styling framework for React"
                  ],
                  correctAnswer: 1
                },
                {
                  question: "Which hook is used to handle side effects in React?",
                  options: ["useState", "useContext", "useEffect", "useReducer"],
                  correctAnswer: 2
                }
              ]
            }
          }
        ]
      }
    ]
  },
  {
    id: "course_node_fundamentals",
    title: "Node.js Fundamentals",
    description: "Learn backend development with Node.js, Express, REST APIs, and Databases.",
    category: "Web Development",
    skills: ["Node.js", "Express", "Backend", "API", "REST"],
    level: "Intermediate",
    thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=600&auto=format&fit=crop&q=80",
    techIcon: "node",
    durationMinutes: 520, // ~8h 40m
    instructor: "David Miller",
    rating: 4.7,
    published: true,
    modules: [
      {
        id: "mod_node_1",
        title: "Module 1: Node Architecture & Event Loop",
        order: 1,
        lessons: [
          {
            id: "les_node_1_1",
            title: "Understanding Node.js & V8 Engine",
            type: "video",
            durationMinutes: 60,
            order: 1,
            videoUrl: "https://www.youtube.com/embed/TlB_eWDSMt4",
            notes: "# Node.js Basics\n\nNode.js is an open-source, cross-platform JavaScript runtime environment."
          },
          {
            id: "les_node_1_2",
            title: "Building RESTful APIs with Express",
            type: "notes",
            durationMinutes: 90,
            order: 2,
            notes: "# Express API Design\n\nExpress is a minimal and flexible Node.js web application framework."
          }
        ]
      }
    ]
  },
  {
    id: "course_python_beginners",
    title: "Python for Beginners",
    description: "Start your coding journey with Python syntax, data structures, and automation.",
    category: "Programming",
    skills: ["Python", "Syntax", "OOP", "Scripts"],
    level: "Beginner",
    thumbnail: "https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?w=600&auto=format&fit=crop&q=80",
    techIcon: "python",
    durationMinutes: 240, // 4h
    instructor: "Alex Chen",
    rating: 4.9,
    published: true,
    modules: [
      {
        id: "mod_py_1",
        title: "Module 1: Python Essentials",
        order: 1,
        lessons: [
          {
            id: "les_py_1_1",
            title: "Python Setup & Hello World",
            type: "video",
            durationMinutes: 30,
            order: 1,
            videoUrl: "https://www.youtube.com/embed/rfscVS0vtbw",
            notes: "# Welcome to Python!\n\nPython is renowned for its readable syntax and versatile ecosystem."
          }
        ]
      }
    ]
  },
  {
    id: "course_aws_practitioner",
    title: "AWS Cloud Practitioner",
    description: "Introduction to AWS Cloud Services, EC2, S3, IAM, and Security.",
    category: "Cloud Computing",
    skills: ["AWS", "Cloud", "S3", "EC2", "IAM", "DevOps"],
    level: "Beginner",
    thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
    techIcon: "aws",
    durationMinutes: 535, // ~8h 55m
    instructor: "Elena Rostova",
    rating: 4.8,
    published: true,
    modules: [
      {
        id: "mod_aws_1",
        title: "Module 1: AWS Global Infrastructure",
        order: 1,
        lessons: [
          {
            id: "les_aws_1_1",
            title: "Cloud Concepts & AWS Architecture",
            type: "video",
            durationMinutes: 45,
            order: 1,
            videoUrl: "https://www.youtube.com/embed/SOTamWNgDKc",
            notes: "# AWS Core Concepts\n\nLearn Regions, Availability Zones, Edge Locations, and foundational cloud economics."
          }
        ]
      }
    ]
  },
  {
    id: "course_js_mastery",
    title: "JavaScript Basic to Advanced",
    description: "Master modern ECMAScript 2024, closures, async/await, and design patterns.",
    category: "Programming",
    skills: ["JavaScript", "ES6+", "Async", "DOM", "Web"],
    level: "Beginner",
    thumbnail: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=600&auto=format&fit=crop&q=80",
    techIcon: "js",
    durationMinutes: 750, // 12h 30m
    instructor: "Michael Vance",
    rating: 4.8,
    published: true,
    modules: [
      {
        id: "mod_js_1",
        title: "Module 1: JavaScript Foundations",
        order: 1,
        lessons: [
          {
            id: "les_js_1_1",
            title: "JS Execution Context & Hoisting",
            type: "video",
            durationMinutes: 60,
            order: 1,
            videoUrl: "https://www.youtube.com/embed/W6NZfCO5SIk",
            notes: "# JavaScript Execution Context\n\nEverything in JavaScript happens inside an Execution Context."
          }
        ]
      }
    ]
  },
  {
    id: "course_ts_mastery",
    title: "TypeScript Mastery",
    description: "Static typing for scalable JavaScript applications.",
    category: "Web Development",
    skills: ["TypeScript", "Types", "Interfaces", "Generics"],
    level: "Intermediate",
    thumbnail: "https://images.unsplash.com/photo-1516116211223-48a12725222c?w=600&auto=format&fit=crop&q=80",
    techIcon: "ts",
    durationMinutes: 525, // 8h 45m
    instructor: "Rachel Green",
    rating: 4.7,
    published: true,
    modules: [
      {
        id: "mod_ts_1",
        title: "Module 1: Type System Fundamentals",
        order: 1,
        lessons: [
          {
            id: "les_ts_1_1",
            title: "Types, Interfaces & Type Aliases",
            type: "video",
            durationMinutes: 50,
            order: 1,
            videoUrl: "https://www.youtube.com/embed/ahCwqrYpIto",
            notes: "# TypeScript Basics\n\nTypeScript adds static type definitions to JavaScript."
          }
        ]
      }
    ]
  },
  {
    id: "course_mongodb_basics",
    title: "MongoDB Basics",
    description: "NoSQL document database design, CRUD queries, and indexing.",
    category: "Data Science",
    skills: ["MongoDB", "NoSQL", "Database", "Mongoose"],
    level: "Beginner",
    thumbnail: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80",
    techIcon: "mongo",
    durationMinutes: 380, // 6h 20m
    instructor: "Jason Wang",
    rating: 4.6,
    published: true,
    modules: [
      {
        id: "mod_mongo_1",
        title: "Module 1: Document Database Concepts",
        order: 1,
        lessons: [
          {
            id: "les_mongo_1_1",
            title: "Collections, Documents & BSON",
            type: "video",
            durationMinutes: 40,
            order: 1,
            videoUrl: "https://www.youtube.com/embed/ofme2o290GE",
            notes: "# MongoDB Overview\n\nMongoDB stores data in flexible, JSON-like BSON documents."
          }
        ]
      }
    ]
  },
  {
    id: "course_git_github",
    title: "Git & GitHub Full Course",
    description: "Version control mastery, branching strategies, and open-source collaboration.",
    category: "DevOps",
    skills: ["Git", "GitHub", "Version Control", "DevOps"],
    level: "Beginner",
    thumbnail: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=600&auto=format&fit=crop&q=80",
    techIcon: "git",
    durationMinutes: 315, // 5h 15m
    instructor: "Kevin Powell",
    rating: 4.9,
    published: true,
    modules: [
      {
        id: "mod_git_1",
        title: "Module 1: Git Essentials",
        order: 1,
        lessons: [
          {
            id: "les_git_1_1",
            title: "Git Commits, Branches & Merging",
            type: "video",
            durationMinutes: 45,
            order: 1,
            videoUrl: "https://www.youtube.com/embed/RGOj5yH7evk",
            notes: "# Git Workflow\n\nTrack changes in source code during software development."
          }
        ]
      }
    ]
  }
];

let courseCatalogCache = null;
let courseCacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Helper: Get courses from Firestore catalog
async function getOrSeedCourses() {
  if (courseCatalogCache && (Date.now() - courseCacheTimestamp < CACHE_TTL_MS)) {
    return courseCatalogCache;
  }

  const coursesRef = db.collection("courses");
  const snap = await coursesRef.get();
  if (!snap.empty) {
    courseCatalogCache = mapDocs(snap);
    courseCacheTimestamp = Date.now();
    return courseCatalogCache;
  }
  
  courseCatalogCache = [];
  courseCacheTimestamp = Date.now();
  return [];
}

// ─── GET /api/learning/hub ───────────────────────────────────────────────────
router.get("/hub", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 1. Fetch user profile for recommendations
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.exists ? mapDoc(userDoc) : {};
    const profileDoc = await db.collection("profiles").doc(userId).get();
    const profileData = profileDoc.exists ? mapDoc(profileDoc) : {};

    // 2. Fetch all courses
    const allCourses = await getOrSeedCourses();

    // 3. Fetch user's learning progress docs (collection: learningProgress, docId format: uid_courseId or query by userId)
    let progressDocs = [];
    try {
      const progSnap = await db.collection("learningProgress")
        .where("userId", "==", userId)
        .get();
      if (!progSnap.empty) {
        progressDocs = mapDocs(progSnap);
      }
    } catch (e) {
      console.warn("Learning progress query fallback:", e.message);
    }

    // Calculate Stats from Real User Data
    const enrolledProgress = progressDocs.filter(p => p.status === "IN_PROGRESS" || p.status === "COMPLETED");
    const coursesEnrolled = enrolledProgress.length;

    const totalMinutesLearned = progressDocs.reduce((acc, p) => acc + (p.minutesLearned || 0), 0);
    const hoursLearned = parseFloat((totalMinutesLearned / 60).toFixed(1));

    // Certificates count
    let certificatesCount = 0;
    try {
      const certSnap = await db.collection("certificates")
        .where("ownerUid", "==", userId)
        .get();
      certificatesCount = certSnap.size;
    } catch (e) {}

    // Streak calculation based on learningActivity
    let streakDays = 0;
    const daysOfWeekActive = [false, false, false, false, false, false, false]; // Mon-Sun
    try {
      const actSnap = await db.collection("learningActivity")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(30)
        .get();

      if (!actSnap.empty) {
        const activities = mapDocs(actSnap);
        const today = new Date();
        const startOfWeek = new Date(today);
        const dayIdx = (today.getDay() + 6) % 7; // Monday = 0
        startOfWeek.setDate(today.getDate() - dayIdx);
        startOfWeek.setHours(0,0,0,0);

        // Mark active days of current week
        activities.forEach(a => {
          const actDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          if (actDate >= startOfWeek) {
            const idx = (actDate.getDay() + 6) % 7;
            daysOfWeekActive[idx] = true;
          }
        });

        // Consecutive streak calculation
        let checkDate = new Date();
        checkDate.setHours(0,0,0,0);
        let consecutive = 0;
        for (let i = 0; i < 30; i++) {
          const dayStart = new Date(checkDate);
          const dayEnd = new Date(checkDate);
          dayEnd.setHours(23,59,59,999);

          const hasActivity = activities.some(a => {
            const d = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            return d >= dayStart && d <= dayEnd;
          });

          if (hasActivity) {
            consecutive++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else if (i === 0) {
            // Check yesterday if user hasn't logged activity today yet
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        streakDays = consecutive;
      }
    } catch (e) {
      console.warn("Streak calculation error:", e.message);
    }

    // Build Continue Learning items (max 4)
    const continueLearning = enrolledProgress
      .map(p => {
        const course = allCourses.find(c => c.id === p.courseId);
        if (!course) return null;
        
        const totalMin = course.durationMinutes || 600;
        const minutesLeft = Math.max(0, totalMin - (p.minutesLearned || 0));
        const hoursLeft = Math.floor(minutesLeft / 60);
        const minsLeft = minutesLeft % 60;
        const remainingStr = hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m left` : `${minsLeft}m left`;

        return {
          courseId: course.id,
          status: p.status || "IN_PROGRESS",
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          techIcon: course.techIcon || "react",
          progressPercentage: p.progressPercentage || 0,
          remainingTime: remainingStr,
          lastLessonId: p.lastLessonId || null
        };
      })
      .filter(Boolean)
      .slice(0, 4);

    // Build Category breakdown counts from actual course data
    const categoryCounts = {
      "Web Development": allCourses.filter(c => c.category === "Web Development").length,
      "Programming": allCourses.filter(c => c.category === "Programming").length,
      "Data Science": allCourses.filter(c => c.category === "Data Science").length,
      "Cloud Computing": allCourses.filter(c => c.category === "Cloud Computing").length,
      "UI/UX Design": allCourses.filter(c => c.category === "UI/UX Design").length,
      "DevOps": allCourses.filter(c => c.category === "DevOps").length,
    };

    // Recommended for You (Personalized based on skills or career goal)
    const userSkills = profileData?.skills || userData?.skills || [];
    const recommendedCourses = allCourses
      .filter(c => !enrolledProgress.some(p => p.courseId === c.id))
      .sort((a, b) => {
        const aMatch = (a.skills || []).some(s => userSkills.includes(s)) ? 1 : 0;
        const bMatch = (b.skills || []).some(s => userSkills.includes(s)) ? 1 : 0;
        return bMatch - aMatch || (b.rating - a.rating);
      })
      .slice(0, 4)
      .map(c => {
        const hrs = Math.floor((c.durationMinutes || 300) / 60);
        const mins = (c.durationMinutes || 300) % 60;
        return {
          courseId: c.id,
          title: c.title,
          techIcon: c.techIcon || "js",
          rating: c.rating || 4.8,
          durationStr: `${hrs}h ${mins}m`,
          category: c.category
        };
      });

    // Recent Achievements (from achievements collection)
    let recentAchievements = [];
    try {
      const achSnap = await db.collection("achievements")
        .where("uid", "==", userId)
        .orderBy("earnedAt", "desc")
        .limit(3)
        .get();
      if (!achSnap.empty) {
        recentAchievements = mapDocs(achSnap);
      }
    } catch (e) {}

    res.json({
      stats: {
        coursesEnrolled,
        hoursLearned,
        certificatesCount,
        streakDays,
        daysOfWeekActive
      },
      continueLearning,
      categoryCounts,
      recommendedCourses,
      recentAchievements
    });
  } catch (err) {
    console.error("Learning Hub error:", err);
    res.status(500).json({ message: "We couldn't load your learning progress. Please try again." });
  }
});

// ─── GET /api/learning/courses ───────────────────────────────────────────────
router.get("/courses", auth, async (req, res) => {
  try {
    const { search, category } = req.query;
    let courses = await getOrSeedCourses();

    if (category) {
      courses = courses.filter(c => c.category?.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase().trim();
      courses = courses.filter(c =>
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        (c.skills && c.skills.some(s => s.toLowerCase().includes(q)))
      );
    }

    res.json(courses);
  } catch (err) {
    console.error("Fetch courses error:", err);
    res.status(500).json({ message: "Failed to load courses. Please try again." });
  }
});

// ─── GET /api/learning/course/:courseId ─────────────────────────────────────
router.get("/course/:courseId", auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // 1. Fetch course details
    const allCourses = await getOrSeedCourses();
    const course = allCourses.find(c => c.id === courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // 2. Fetch user's progress for this course
    const docId = `${userId}_${courseId}`;
    let userProgress = {
      userId,
      courseId,
      status: "NOT_STARTED",
      progressPercentage: 0,
      completedLessons: [],
      lastLessonId: null,
      minutesLearned: 0
    };

    const progDoc = await db.collection("learningProgress").doc(docId).get();
    if (progDoc.exists) {
      userProgress = mapDoc(progDoc);
    }

    res.json({
      course,
      userProgress
    });
  } catch (err) {
    console.error("Fetch course details error:", err);
    res.status(500).json({ message: "Failed to load course details." });
  }
});

// ─── POST /api/learning/course/:courseId/complete-lesson ────────────────────
router.post("/course/:courseId/complete-lesson", auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { lessonId, minutes = 15 } = req.body;
    const userId = req.user.id;

    if (!lessonId) {
      return res.status(400).json({ message: "Lesson ID is required." });
    }

    const allCourses = await getOrSeedCourses();
    const course = allCourses.find(c => c.id === courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    // Count total lessons in course
    let totalLessonsCount = 0;
    (course.modules || []).forEach(m => {
      totalLessonsCount += (m.lessons || []).length;
    });
    if (totalLessonsCount === 0) totalLessonsCount = 1;

    const docId = `${userId}_${courseId}`;
    const progRef = db.collection("learningProgress").doc(docId);
    const progDoc = await progRef.get();

    let completedLessons = [];
    let minutesLearned = 0;

    if (progDoc.exists) {
      const data = mapDoc(progDoc);
      completedLessons = data.completedLessons || [];
      minutesLearned = data.minutesLearned || 0;
    }

    if (!completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId);
      minutesLearned += Number(minutes) || 15;
    }

    const progressPercentage = Math.min(100, Math.round((completedLessons.length / totalLessonsCount) * 100));
    const isCompleted = progressPercentage >= 100;
    const status = isCompleted ? "COMPLETED" : "IN_PROGRESS";

    const updatePayload = {
      userId,
      courseId,
      status,
      progressPercentage,
      completedLessons,
      lastLessonId: lessonId,
      minutesLearned,
      lastActivityAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    if (!progDoc.exists) {
      updatePayload.startedAt = FieldValue.serverTimestamp();
    }
    if (isCompleted) {
      updatePayload.completedAt = FieldValue.serverTimestamp();
    }

    await progRef.set(updatePayload, { merge: true });

    // Record activity entry for streak
    const actRef = db.collection("learningActivity").doc();
    await actRef.set({
      activityId: actRef.id,
      userId,
      courseId,
      lessonId,
      activityType: "lesson_completed",
      minutes: Number(minutes) || 15,
      createdAt: FieldValue.serverTimestamp()
    });

    // If completed course, grant achievement & certificate
    if (isCompleted) {
      const achRef = db.collection("achievements").doc();
      await achRef.set({
        achievementId: achRef.id,
        uid: userId,
        type: "course_completed",
        title: `${course.title}`,
        description: "Course Completed",
        xp: 100,
        earnedAt: FieldValue.serverTimestamp()
      });

      const certRef = db.collection("certificates").doc();
      await certRef.set({
        certificateId: certRef.id,
        ownerUid: userId,
        title: `${course.title} Certification`,
        issuer: "Codovate Learning Hub",
        issueDate: new Date(),
        skills: course.skills || [],
        verified: true,
        createdAt: FieldValue.serverTimestamp()
      });
    }

    res.json({
      success: true,
      userProgress: {
        userId,
        courseId,
        status,
        progressPercentage,
        completedLessons,
        lastLessonId: lessonId,
        minutesLearned
      }
    });
  } catch (err) {
    console.error("Complete lesson error:", err);
    res.status(500).json({ message: "Failed to save lesson progress." });
  }
});

module.exports = router;
