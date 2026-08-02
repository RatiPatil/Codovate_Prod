import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  BookOpen,
  Clock,
  Award,
  Flame,
  Search,
  Filter,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Globe,
  Code,
  BarChart3,
  Cloud,
  Palette,
  Infinity as InfinityIcon,
  Play,
  RotateCcw
} from 'lucide-react';

/* ─── Tech Icon Visual Renderers ─────────────────────────────────────────── */
const TechIconGraphic = ({ type = 'react', className = 'w-16 h-16' }) => {
  switch (type.toLowerCase()) {
    case 'react':
      return (
        <div className="relative flex items-center justify-center p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
          <svg className={`${className} text-cyan-400 animate-spin-slow`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <ellipse cx="12" cy="12" rx="10" ry="4.5" />
            <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(60 12 12)" />
            <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(120 12 12)" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
        </div>
      );
    case 'node':
      return (
        <div className="relative flex items-center justify-center p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
          <div className="text-emerald-400 font-black text-2xl tracking-tighter flex items-center gap-0.5">
            <span className="text-emerald-400 text-3xl font-extrabold">node</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded">JS</span>
          </div>
        </div>
      );
    case 'python':
      return (
        <div className="relative flex items-center justify-center p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20 group-hover:scale-105 transition-transform duration-300">
          <svg className={`${className}`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c-3.5 0-4 1.5-4 3v2h8V5c0-1.5-.5-3-4-3zm-2.5 2a.75.75 0 110 1.5.75.75 0 010-1.5zM6 8c-1.5 0-3 .5-3 4s.5 4 3 4h2v-2c0-1.5 1-3 3-3h5V9c0-1-1-1-2-1H6zm12 8c1.5 0 3-.5 3-4s-.5-4-3-4h-2v2c0 1.5-1 3-3 3H8v2c0 1 1 1 2 1h8zm-3.5 2a.75.75 0 110 1.5.75.75 0 010-1.5z" className="text-blue-400" />
          </svg>
        </div>
      );
    case 'aws':
      return (
        <div className="relative flex items-center justify-center p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 group-hover:scale-105 transition-transform duration-300">
          <Cloud className={`${className} text-purple-400`} />
        </div>
      );
    case 'js':
      return (
        <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-400/30">
          JS
        </div>
      );
    case 'ts':
      return (
        <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-400/30">
          TS
        </div>
      );
    case 'mongo':
      return (
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-400/30">
          M
        </div>
      );
    case 'git':
      return (
        <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-300 font-bold text-xs flex items-center justify-center shrink-0 border border-orange-400/30">
          GIT
        </div>
      );
    default:
      return (
        <div className="relative flex items-center justify-center p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20">
          <BookOpen className={`${className} text-indigo-400`} />
        </div>
      );
  }
};

/* ─── Main LearningHub Component ─────────────────────────────────────────── */
const LearningHub = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  // Real Learning Hub Data State
  const [hubData, setHubData] = useState({
    stats: {
      coursesEnrolled: 0,
      hoursLearned: 0,
      certificatesCount: 0,
      streakDays: 0,
      daysOfWeekActive: [false, false, false, false, false, false, false]
    },
    continueLearning: [],
    categoryCounts: {
      "Web Development": 0,
      "Programming": 0,
      "Data Science": 0,
      "Cloud Computing": 0,
      "UI/UX Design": 0,
      "DevOps": 0
    },
    recommendedCourses: [],
    recentAchievements: []
  });

  const [allCatalogCourses, setAllCatalogCourses] = useState([]);

  useEffect(() => {
    fetchHubData();
  }, []);

  const fetchHubData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [hubRes, coursesRes] = await Promise.all([
        api.get('/learning/hub'),
        api.get('/learning/courses')
      ]);

      if (hubRes.data) {
        setHubData(hubRes.data);
      }
      if (coursesRes.data) {
        setAllCatalogCourses(coursesRes.data);
      }
    } catch (err) {
      console.error('[LearningHub] Fetch error:', err);
      setError("We couldn't load your learning progress. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Search & Category Filtering on Continue Learning / Courses
  const filteredContinueLearning = useMemo(() => {
    let list = hubData.continueLearning || [];

    if (selectedCategory !== 'All') {
      const categoryCourses = allCatalogCourses
        .filter(c => c.category?.toLowerCase() === selectedCategory.toLowerCase())
        .map(c => c.id);
      list = list.filter(item => categoryCourses.includes(item.courseId));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item =>
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [hubData.continueLearning, allCatalogCourses, selectedCategory, searchQuery]);

  // Categories metadata matching reference
  const categoriesList = [
    { name: "Web Development", icon: Globe, count: hubData.categoryCounts["Web Development"] || 24 },
    { name: "Programming", icon: Code, count: hubData.categoryCounts["Programming"] || 18 },
    { name: "Data Science", icon: BarChart3, count: hubData.categoryCounts["Data Science"] || 16 },
    { name: "Cloud Computing", icon: Cloud, count: hubData.categoryCounts["Cloud Computing"] || 12 },
    { name: "UI/UX Design", icon: Palette, count: hubData.categoryCounts["UI/UX Design"] || 10 },
    { name: "DevOps", icon: InfinityIcon, count: hubData.categoryCounts["DevOps"] || 8 },
  ];

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const currentDayIndex = (new Date().getDay() + 6) % 7; // Monday = 0

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto flex flex-col items-center justify-center space-y-4 min-h-[400px]">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-medium animate-pulse">Loading your Learning Hub...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 font-sans">
      
      {/* ── ERROR ALERT STATE ──────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center justify-between text-red-200 text-sm">
          <span>{error}</span>
          <button
            onClick={fetchHubData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 transition-colors font-semibold"
          >
            <RotateCcw className="w-4 h-4" /> Retry
          </button>
        </div>
      )}

      {/* ── TOP PAGE HEADER ────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
          <span className="hover:text-white cursor-pointer transition-colors" onClick={() => navigate('/dashboard')}>Home</span>
          <span>&gt;</span>
          <span className="text-white font-semibold">Learning</span>
        </div>

        <div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Learning Hub
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Learn. Practice. Build. Grow your skills with Codovate.
          </p>
        </div>

        {/* SEARCH & FILTER ROW */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for courses, skills, topics..."
              className="w-full bg-[#090D24] border border-[#1E2548] focus:border-indigo-500/60 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all shadow-inner"
            />
          </div>

          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className="w-full sm:w-auto flex items-center justify-between gap-2.5 px-5 py-3 bg-[#090D24] border border-[#1E2548] hover:border-indigo-500/50 rounded-2xl text-sm font-semibold text-gray-200 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-400" />
                <span>Filters</span>
              </div>
              <span className="text-xs text-gray-400">▼</span>
            </button>

            {filterDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#0B0F2B] border border-[#1E2548] rounded-2xl shadow-2xl z-30 p-2 space-y-1">
                {['All', 'Web Development', 'Programming', 'Data Science', 'Cloud Computing', 'UI/UX Design', 'DevOps'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
                      selectedCategory === cat ? 'bg-indigo-600/30 text-indigo-300 font-bold' : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <span>{cat}</span>
                    {selectedCategory === cat && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. LEARNING STATISTICS (4 HORIZONTAL CARDS) ─────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: Courses Enrolled */}
        <div className="bg-[#0A0E28]/90 border border-[#1B2248] hover:border-indigo-500/40 rounded-2xl p-5 transition-all duration-300 space-y-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Courses Enrolled</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {hubData.stats.coursesEnrolled}
            </div>
            <p className="text-[11px] font-medium text-emerald-400 flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>{hubData.stats.coursesEnrolled > 0 ? `${hubData.stats.coursesEnrolled} active courses` : 'Start your first course'}</span>
            </p>
          </div>
        </div>

        {/* CARD 2: Hours Learned */}
        <div className="bg-[#0A0E28]/90 border border-[#1B2248] hover:border-indigo-500/40 rounded-2xl p-5 transition-all duration-300 space-y-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Hours Learned</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {hubData.stats.hoursLearned}
            </div>
            <p className="text-[11px] font-medium text-blue-400 flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>{hubData.stats.hoursLearned > 0 ? `${hubData.stats.hoursLearned}h total learning` : '0.0 hours'}</span>
            </p>
          </div>
        </div>

        {/* CARD 3: Certificates */}
        <div className="bg-[#0A0E28]/90 border border-[#1B2248] hover:border-indigo-500/40 rounded-2xl p-5 transition-all duration-300 space-y-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Certificates</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {hubData.stats.certificatesCount}
            </div>
            <p className="text-[11px] font-medium text-emerald-400 flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>{hubData.stats.certificatesCount > 0 ? `${hubData.stats.certificatesCount} earned` : 'Complete courses to earn'}</span>
            </p>
          </div>
        </div>

        {/* CARD 4: Streak */}
        <div className="bg-[#0A0E28]/90 border border-[#1B2248] hover:border-indigo-500/40 rounded-2xl p-5 transition-all duration-300 space-y-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Streak</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {hubData.stats.streakDays} Days
            </div>
            <p className="text-[11px] font-medium text-amber-400 flex items-center gap-1 mt-1">
              <span>Keep it going! 🔥</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT & RIGHT SIDEBAR GRID ──────────────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* LEFT COLUMN: CONTINUE LEARNING & CATEGORIES */}
        <div className="flex-1 space-y-10 min-w-0">
          
          {/* 3. CONTINUE LEARNING SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Continue Learning
              </h2>
              <button
                onClick={() => setSelectedCategory('All')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {filteredContinueLearning.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {filteredContinueLearning.map((item) => (
                  <div
                    key={item.courseId}
                    onClick={() => navigate(`/learning/course/${item.courseId}`)}
                    className="group bg-[#0A0E28]/90 border border-[#1B2248] hover:border-indigo-500/60 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.15)] cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider border ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : item.status === 'NEW'
                            ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}>
                          {item.status === 'COMPLETED' ? 'Completed ✓' : item.status === 'NEW' ? 'New' : 'In Progress'}
                        </span>
                      </div>

                      <div className="py-2 flex justify-center">
                        <TechIconGraphic type={item.techIcon || 'react'} />
                      </div>

                      <div>
                        <h3 className="font-bold text-white text-base leading-snug group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-gray-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="w-full bg-[#141A3B] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.progressPercentage || 0}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          {item.remainingTime}
                        </span>
                        <span className="text-indigo-400 font-bold">{item.progressPercentage}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* REAL EMPTY STATE */
              <div className="bg-[#0A0E28]/60 border border-[#1B2248] rounded-2xl p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">You haven't started a course yet</h3>
                  <p className="text-gray-400 text-xs mt-1 max-w-md mx-auto">
                    Explore available courses below and start learning to build real-world skills.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const firstCourse = allCatalogCourses[0]?.id || 'course_react_guide';
                    navigate(`/learning/course/${firstCourse}`);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  Explore Courses
                </button>
              </div>
            )}
          </div>

          {/* 5. BROWSE BY CATEGORIES SECTION */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Browse by Categories
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {categoriesList.map((cat) => {
                const CategoryIcon = cat.icon;
                const isSelected = selectedCategory === cat.name;
                return (
                  <div
                    key={cat.name}
                    onClick={() => {
                      setSelectedCategory(cat.name);
                    }}
                    className={`group bg-[#0A0E28]/90 border rounded-2xl p-4 text-center space-y-3 transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-md ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                        : 'border-[#1B2248] hover:border-indigo-500/40'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                      <CategoryIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs tracking-tight group-hover:text-indigo-300 transition-colors">
                        {cat.name}
                      </h4>
                      <p className="text-[11px] font-semibold text-gray-500 mt-0.5">
                        {cat.count} Courses
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FOOTER QUOTE */}
          <div className="pt-6 text-center">
            <p className="text-xs italic text-indigo-300/80 font-medium tracking-wide">
              "The beautiful thing about learning is that no one can take it away from you." – B.B. King
            </p>
          </div>
        </div>

        {/* ── RIGHT COLUMN: LEARNING STREAK, RECOMMENDED, ACHIEVEMENTS ───────── */}
        <div className="w-full xl:w-80 shrink-0 space-y-6">
          
          {/* 6. LEARNING STREAK CARD */}
          <div className="bg-[#0A0E28]/90 border border-[#1B2248] rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <h3 className="font-bold text-white text-sm">Learning Streak</h3>
            </div>

            <div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {hubData.stats.streakDays} Days
              </div>
              <p className="text-xs font-medium text-gray-400 mt-0.5">
                Keep learning every day!
              </p>
            </div>

            {/* DAYS OF WEEK BADGES */}
            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {daysOfWeek.map((day, idx) => {
                const isActiveDay = hubData.stats.daysOfWeekActive[idx];
                const isCurrent = idx === currentDayIndex;

                return (
                  <div key={day} className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all ${
                      isActiveDay
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                        : isCurrent
                        ? 'bg-indigo-600/30 text-indigo-300 border-2 border-indigo-500 animate-pulse'
                        : 'bg-[#121735] text-gray-500 border border-white/5'
                    }`}>
                      {isActiveDay ? '✓' : idx + 1}
                    </div>
                    <span className="text-[10px] font-semibold text-gray-400">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7. RECOMMENDED FOR YOU CARD */}
          <div className="bg-[#0A0E28]/90 border border-[#1B2248] rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Recommended for You</h3>
              <button
                onClick={() => setSelectedCategory('All')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                View all
              </button>
            </div>

            <div className="space-y-3">
              {(hubData.recommendedCourses.length > 0 ? hubData.recommendedCourses : [
                { courseId: 'course_js_mastery', title: 'JavaScript Basic to Advanced', techIcon: 'js', rating: 4.8, durationStr: '12h 30m' },
                { courseId: 'course_ts_mastery', title: 'TypeScript Mastery', techIcon: 'ts', rating: 4.7, durationStr: '8h 45m' },
                { courseId: 'course_mongodb_basics', title: 'MongoDB Basics', techIcon: 'mongo', rating: 4.6, durationStr: '6h 20m' },
                { courseId: 'course_git_github', title: 'Git & GitHub Full Course', techIcon: 'git', rating: 4.9, durationStr: '5h 15m' }
              ]).map((c) => (
                <div key={c.courseId} className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <TechIconGraphic type={c.techIcon} />
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-xs line-clamp-1 group-hover:text-indigo-300 transition-colors">
                        {c.title}
                      </h4>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                        {c.rating} ★ • {c.durationStr}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/learning/course/${c.courseId}`)}
                    className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 font-bold text-xs rounded-xl transition-all shrink-0 cursor-pointer"
                  >
                    Start
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 8. RECENT ACHIEVEMENTS CARD */}
          <div className="bg-[#0A0E28]/90 border border-[#1B2248] rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Recent Achievements</h3>
              <span className="text-xs font-semibold text-gray-400">View all</span>
            </div>

            {hubData.recentAchievements.length > 0 ? (
              <div className="space-y-3">
                {hubData.recentAchievements.map((ach) => (
                  <div key={ach.achievementId || ach.title} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs">{ach.title}</h4>
                        <p className="text-[10px] text-gray-400">{ach.description || 'Achievement Unlocked'}</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-400">+{ach.xp || 50} XP</span>
                  </div>
                ))}
              </div>
            ) : (
              /* PROFESSIONAL EMPTY STATE FOR ACHIEVEMENTS */
              <div className="p-4 rounded-xl bg-white/5 text-center space-y-1">
                <p className="text-xs font-semibold text-gray-300">No achievements yet</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Complete lessons and courses to start earning achievements.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default LearningHub;
