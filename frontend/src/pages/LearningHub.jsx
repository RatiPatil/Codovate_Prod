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
  RotateCcw,
  Check,
  Star,
  X
} from 'lucide-react';

/* ─── Tech Icon Visual Renderers (Light Theme Matched) ───────────────────── */
const TechIconGraphic = ({ type = 'react', className = 'w-12 h-12' }) => {
  switch (type.toLowerCase()) {
    case 'react':
      return (
        <div className="relative flex items-center justify-center p-4 rounded-2xl bg-[#ECFEFF] border border-[#CFFAFE] group-hover:scale-105 transition-transform duration-300">
          <svg className={`${className} text-[#0891B2] animate-spin-slow`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <ellipse cx="12" cy="12" rx="10" ry="4.5" />
            <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(60 12 12)" />
            <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(120 12 12)" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
        </div>
      );
    case 'node':
      return (
        <div className="relative flex items-center justify-center p-4 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] group-hover:scale-105 transition-transform duration-300">
          <div className="text-[#166534] font-black text-xl tracking-tighter flex items-center gap-0.5">
            <span className="text-[#15803D] text-2xl font-extrabold">node</span>
            <span className="text-[10px] bg-[#DCFCE7] text-[#166534] px-1 py-0.5 rounded font-bold">JS</span>
          </div>
        </div>
      );
    case 'python':
      return (
        <div className="relative flex items-center justify-center p-4 rounded-2xl bg-[#FEFCE8] border border-[#FEF08A] group-hover:scale-105 transition-transform duration-300">
          <svg className={`${className}`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2c-3.5 0-4 1.5-4 3v2h8V5c0-1.5-.5-3-4-3zm-2.5 2a.75.75 0 110 1.5.75.75 0 010-1.5zM6 8c-1.5 0-3 .5-3 4s.5 4 3 4h2v-2c0-1.5 1-3 3-3h5V9c0-1-1-1-2-1H6zm12 8c1.5 0 3-.5 3-4s-.5-4-3-4h-2v2c0 1.5-1 3-3 3H8v2c0 1 1 1 2 1h8zm-3.5 2a.75.75 0 110 1.5.75.75 0 010-1.5z" className="text-[#2563EB]" />
          </svg>
        </div>
      );
    case 'aws':
      return (
        <div className="relative flex items-center justify-center p-4 rounded-2xl bg-[#F3E8FF] border border-[#E9D5FF] group-hover:scale-105 transition-transform duration-300">
          <Cloud className={`${className} text-[#7C3AED]`} />
        </div>
      );
    case 'js':
      return (
        <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-[#854D0E] font-bold text-xs flex items-center justify-center shrink-0 border border-[#FDE047]">
          JS
        </div>
      );
    case 'ts':
      return (
        <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] text-[#1E40AF] font-bold text-xs flex items-center justify-center shrink-0 border border-[#93C5FD]">
          TS
        </div>
      );
    case 'mongo':
      return (
        <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] text-[#166534] font-bold text-xs flex items-center justify-center shrink-0 border border-[#86EFAC]">
          M
        </div>
      );
    case 'git':
      return (
        <div className="w-10 h-10 rounded-xl bg-[#FFEDD5] text-[#C2410C] font-bold text-xs flex items-center justify-center shrink-0 border border-[#FDBA74]">
          GIT
        </div>
      );
    default:
      return (
        <div className="relative flex items-center justify-center p-4 rounded-2xl bg-[#F1F5F9] border border-[#E2E8F0]">
          <BookOpen className={`${className} text-[#475569]`} />
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
    categoryCounts: {},
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
      setError("We couldn't load your learning data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filtered Continue Learning
  const filteredContinueLearning = useMemo(() => {
    let list = hubData.continueLearning || [];

    if (selectedCategory !== 'All') {
      const categoryCourseIds = allCatalogCourses
        .filter(c => c.category?.toLowerCase() === selectedCategory.toLowerCase())
        .map(c => c.id);
      list = list.filter(item => categoryCourseIds.includes(item.courseId));
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

  // Filtered Catalog Courses for "Explore All Courses" section
  const filteredCatalogCourses = useMemo(() => {
    let list = allCatalogCourses;

    if (selectedCategory !== 'All') {
      list = list.filter(c => c.category?.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c =>
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        (c.skills && c.skills.some(s => s.toLowerCase().includes(q)))
      );
    }

    return list;
  }, [allCatalogCourses, selectedCategory, searchQuery]);

  // Dynamic Category Counts calculated from real catalog
  const categoriesList = useMemo(() => {
    const getCount = (catName) => allCatalogCourses.filter(c => c.category === catName).length;
    return [
      { name: "Web Development", icon: Globe, color: "bg-[#EFF6FF] text-[#2563EB]", count: getCount("Web Development") },
      { name: "Programming", icon: Code, color: "bg-[#F3E8FF] text-[#7C3AED]", count: getCount("Programming") },
      { name: "Data Science", icon: BarChart3, color: "bg-[#E0F2FE] text-[#0284C7]", count: getCount("Data Science") },
      { name: "Cloud Computing", icon: Cloud, color: "bg-[#F0F9FF] text-[#0369A1]", count: getCount("Cloud Computing") },
      { name: "UI/UX Design", icon: Palette, color: "bg-[#F3E8FF] text-[#9333EA]", count: getCount("UI/UX Design") },
      { name: "DevOps", icon: InfinityIcon, color: "bg-[#DCFCE7] text-[#16A34A]", count: getCount("DevOps") },
    ];
  }, [allCatalogCourses]);

  // Recommended courses fallback to real catalog if none returned
  const recommendedList = useMemo(() => {
    if (hubData.recommendedCourses && hubData.recommendedCourses.length > 0) {
      return hubData.recommendedCourses;
    }
    return allCatalogCourses.slice(0, 4).map(c => {
      const hrs = Math.floor((c.durationMinutes || 300) / 60);
      const mins = (c.durationMinutes || 300) % 60;
      return {
        id: c.id,
        title: c.title,
        rating: c.rating || 4.8,
        durationStr: `${hrs}h ${mins}m`,
        techIcon: c.techIcon || 'js',
        category: c.category
      };
    });
  }, [hubData.recommendedCourses, allCatalogCourses]);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const currentDayIndex = (new Date().getDay() + 6) % 7; // Monday = 0

  const handleScrollToCatalog = () => {
    const el = document.getElementById('all-courses-catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-[#FAFBFF] flex flex-col items-center justify-center space-y-4 font-sans">
        <div className="w-12 h-12 border-4 border-[#7C3AED]/20 border-t-[#7C3AED] rounded-full animate-spin" />
        <p className="text-[#64748B] text-sm font-semibold animate-pulse">Loading your Learning Hub...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFF] p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 font-sans text-[#0F172A]">
      
      {/* ── ERROR ALERT STATE ──────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between text-red-700 text-sm shadow-sm">
          <span>{error}</span>
          <button
            onClick={fetchHubData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 transition-colors font-semibold text-red-800 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Retry
          </button>
        </div>
      )}

      {/* ── TOP BREADCRUMB & PAGE HEADER ───────────────────────────────────── */}
      <div className="space-y-4">
        <div className="text-xs text-[#64748B] font-medium flex items-center gap-1.5">
          <span className="hover:text-[#0F172A] cursor-pointer transition-colors" onClick={() => navigate('/dashboard')}>Home</span>
          <span>&gt;</span>
          <span className="text-[#0F172A] font-semibold">Learning</span>
        </div>

        <div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Learning Hub
          </h1>
          <p className="text-[#64748B] text-sm mt-1 font-medium">
            Learn. Practice. Build. Grow your skills with Codovate.
          </p>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for courses, skills, topics..."
              className="w-full bg-white border border-[#E2E8F0] focus:border-[#2563EB] rounded-2xl pl-11 pr-9 py-3 text-sm text-[#0F172A] placeholder-[#94A3B8] shadow-[0_2px_12px_rgba(15,23,42,0.04)] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-medium"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className={`w-full sm:w-auto flex items-center justify-between gap-2.5 px-5 py-3 border rounded-2xl text-sm font-semibold transition-all cursor-pointer shadow-[0_2px_12px_rgba(15,23,42,0.04)] ${
                selectedCategory !== 'All' ? 'bg-[#F3E8FF] border-[#7C3AED] text-[#7C3AED]' : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] text-[#334155]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#7C3AED]" />
                <span>{selectedCategory === 'All' ? 'Filters' : selectedCategory}</span>
              </div>
              <span className="text-xs text-[#94A3B8]">▼</span>
            </button>

            {filterDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-30 p-2 space-y-1">
                {['All', 'Web Development', 'Programming', 'Data Science', 'Cloud Computing', 'UI/UX Design', 'DevOps'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                      selectedCategory === cat ? 'bg-[#F3E8FF] text-[#7C3AED] font-bold' : 'text-[#334155] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span>{cat}</span>
                    {selectedCategory === cat && <CheckCircle2 className="w-3.5 h-3.5 text-[#7C3AED]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 4 LEARNING STAT CARDS (REAL DATA ONLY) ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: Courses Enrolled */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] hover:shadow-md transition-all space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F3E8FF] border border-[#E9D5FF] text-[#9333EA] flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Courses Enrolled</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
              {hubData.stats.coursesEnrolled ?? 0}
            </div>
            <p className="text-xs font-medium text-[#16A34A] flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{hubData.stats.coursesEnrolled > 0 ? `${hubData.stats.coursesEnrolled} active courses` : '0 active courses'}</span>
            </p>
          </div>
        </div>

        {/* CARD 2: Hours Learned */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] hover:shadow-md transition-all space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Hours Learned</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
              {hubData.stats.hoursLearned ?? 0}
            </div>
            <p className="text-xs font-medium text-[#16A34A] flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{hubData.stats.hoursLearned > 0 ? `${hubData.stats.hoursLearned} hrs logged` : '0 hrs logged'}</span>
            </p>
          </div>
        </div>

        {/* CARD 3: Certificates */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] hover:shadow-md transition-all space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Certificates</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
              {hubData.stats.certificatesCount ?? 0}
            </div>
            <p className="text-xs font-medium text-[#16A34A] flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{hubData.stats.certificatesCount > 0 ? `${hubData.stats.certificatesCount} earned` : '0 earned'}</span>
            </p>
          </div>
        </div>

        {/* CARD 4: Streak */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] hover:shadow-md transition-all space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFEDD5] border border-[#FED7AA] text-[#EA580C] flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Streak</span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
              {hubData.stats.streakDays ?? 0} Days
            </div>
            <p className="text-xs font-semibold text-[#EA580C] mt-1">
              {hubData.stats.streakDays > 0 ? 'Keep it going! 🔥' : 'Start your streak today! 🔥'}
            </p>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID (LEFT 72% | RIGHT 28%) ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN (72% WIDTH ON DESKTOP) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* SECTION: CONTINUE LEARNING */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#0F172A]">Continue Learning</h2>
              <button
                onClick={() => setSelectedCategory('All')}
                className="text-sm font-semibold text-[#7C3AED] hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {filteredContinueLearning.length === 0 ? (
              /* EMPTY STATE */
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center space-y-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                <div className="w-14 h-14 bg-[#F3E8FF] text-[#7C3AED] rounded-full flex items-center justify-center mx-auto">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#0F172A]">You haven't started learning yet</h3>
                  <p className="text-xs text-[#64748B]">Explore our curated courses and level up your software engineering skills.</p>
                </div>
                <button
                  onClick={handleScrollToCatalog}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#9333EA] text-white font-bold text-xs rounded-xl shadow-md hover:opacity-95 transition-all cursor-pointer"
                >
                  Explore Courses
                </button>
              </div>
            ) : (
              /* COURSE CARDS GRID */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {filteredContinueLearning.slice(0, 4).map((course) => {
                  const badgeStyle = course.status === 'COMPLETED'
                    ? 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]'
                    : course.status === 'NEW'
                    ? 'bg-[#F3E8FF] text-[#9333EA] border-[#E9D5FF]'
                    : 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]';

                  const badgeText = course.status === 'COMPLETED'
                    ? 'Completed ✓'
                    : course.status === 'NEW'
                    ? 'New'
                    : 'In Progress';

                  return (
                    <div
                      key={course.courseId}
                      onClick={() => navigate(`/learning/course/${course.courseId}`)}
                      className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-2xl p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] hover:shadow-lg transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badgeStyle}`}>
                            {badgeText}
                          </span>
                        </div>

                        <div className="py-2 flex justify-center">
                          <TechIconGraphic type={course.techIcon} />
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors line-clamp-1">
                            {course.title}
                          </h3>
                          <p className="text-xs text-[#64748B] line-clamp-2 mt-1 h-8 leading-snug">
                            {course.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#F1F5F9] space-y-2">
                        <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#2563EB] to-[#9333EA] h-full rounded-full transition-all duration-500"
                            style={{ width: `${course.progressPercentage || 0}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] text-[#64748B] font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#94A3B8]" />
                            {course.remainingTime || '0m left'}
                          </span>
                          <span className="font-extrabold text-[#0F172A]">
                            {course.progressPercentage || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION: BROWSE BY CATEGORIES */}
          <div className="space-y-4 pt-2">
            <h2 className="text-xl font-bold text-[#0F172A]">Browse by Categories</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
              {categoriesList.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = selectedCategory === cat.name;

                return (
                  <div
                    key={cat.name}
                    onClick={() => setSelectedCategory(isSelected ? 'All' : cat.name)}
                    className={`bg-white border rounded-2xl p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)] hover:shadow-md transition-all flex flex-col items-center text-center cursor-pointer group ${
                      isSelected ? 'border-[#7C3AED] ring-2 ring-[#7C3AED]/20 bg-[#F3E8FF]/20' : 'border-[#E2E8F0] hover:border-[#7C3AED]/40'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl ${cat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="text-xs font-bold text-[#0F172A] group-hover:text-[#7C3AED] transition-colors mt-3">
                      {cat.name}
                    </h3>
                    <span className="text-[11px] font-medium text-[#64748B] mt-0.5">
                      {cat.count} {cat.count === 1 ? 'Course' : 'Courses'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION: EXPLORE ALL COURSES CATALOG */}
          <div id="all-courses-catalog" className="space-y-4 pt-4 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0F172A]">Explore All Courses</h2>
                <p className="text-xs text-[#64748B] mt-0.5">Select a course to enroll and start learning</p>
              </div>
              {selectedCategory !== 'All' && (
                <button onClick={() => setSelectedCategory('All')} className="text-xs font-bold text-[#7C3AED] hover:underline cursor-pointer">
                  Show All ({allCatalogCourses.length})
                </button>
              )}
            </div>

            {filteredCatalogCourses.length === 0 ? (
              <div className="bg-white border border-dashed border-[#CBD5E1] rounded-2xl p-8 text-center space-y-2 text-xs text-[#64748B]">
                <p className="font-bold text-[#0F172A]">No courses found matching your criteria</p>
                <p>Try clearing your search query or selecting a different category.</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                  className="px-4 py-2 bg-[#7C3AED] text-white rounded-xl font-bold mt-2 cursor-pointer"
                >
                  Reset Search & Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCatalogCourses.map((c) => {
                  const hrs = Math.floor((c.durationMinutes || 300) / 60);
                  const mins = (c.durationMinutes || 300) % 60;
                  const isEnrolled = hubData.continueLearning?.some(item => item.courseId === c.id);

                  return (
                    <div
                      key={c.id}
                      className="bg-white border border-[#E2E8F0] hover:border-[#7C3AED]/40 rounded-2xl p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] hover:shadow-lg transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#F3E8FF] text-[#7C3AED] border border-[#E9D5FF]">
                            {c.category}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                            {c.level || 'Intermediate'}
                          </span>
                        </div>

                        <div className="py-2 flex justify-center">
                          <TechIconGraphic type={c.techIcon || 'js'} />
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors line-clamp-1">
                            {c.title}
                          </h3>
                          <p className="text-xs text-[#64748B] line-clamp-2 mt-1 leading-relaxed">
                            {c.description}
                          </p>
                        </div>

                        {c.skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {c.skills.slice(0, 3).map((s, idx) => (
                              <span key={idx} className="bg-[#FAFBFF] border border-[#E2E8F0] text-[#475569] text-[10px] font-semibold px-2 py-0.5 rounded-md">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-5 pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                        <div className="text-xs text-[#64748B] font-medium flex items-center gap-2">
                          <span className="flex items-center gap-1 text-[#D97706] font-bold">
                            <Star className="w-3.5 h-3.5 fill-[#D97706]" /> {c.rating || 4.8}
                          </span>
                          <span>•</span>
                          <span>{hrs}h {mins}m</span>
                        </div>

                        <button
                          onClick={() => navigate(`/learning/course/${c.id}`)}
                          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                            isEnrolled
                              ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] hover:bg-[#BBF7D0]'
                              : 'bg-gradient-to-r from-[#2563EB] to-[#9333EA] text-white shadow-md hover:opacity-95'
                          }`}
                        >
                          {isEnrolled ? 'Resume' : 'Start Course'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN (28% WIDTH ON DESKTOP - INSIGHTS PANELS) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* PANEL 1: LEARNING STREAK */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <h3 className="text-base font-bold text-[#0F172A]">Learning Streak</h3>
            </div>

            <div>
              <div className="text-2xl font-extrabold text-[#0F172A]">
                {hubData.stats.streakDays ?? 0} Days
              </div>
              <p className="text-xs text-[#64748B] font-medium mt-0.5">
                {hubData.stats.streakDays > 0 ? 'Keep learning every day!' : 'Complete a lesson today to start your streak!'}
              </p>
            </div>

            {/* Days of Week Badges */}
            <div className="flex items-center justify-between pt-2">
              {daysOfWeek.map((day, idx) => {
                const isActive = hubData.stats.daysOfWeekActive?.[idx];
                const isToday = idx === currentDayIndex;

                return (
                  <div key={day} className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                      isActive
                        ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
                        : isToday
                        ? 'border-2 border-[#7C3AED] text-[#7C3AED] font-bold bg-[#F3E8FF]'
                        : 'border border-[#E2E8F0] text-[#94A3B8]'
                    }`}>
                      {isActive ? <Check className="w-4 h-4 stroke-[3]" /> : (idx + 1)}
                    </div>
                    <span className="text-[11px] font-semibold text-[#64748B]">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PANEL 2: RECOMMENDED FOR YOU */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F172A]">Recommended for You</h3>
              <button onClick={handleScrollToCatalog} className="text-xs font-semibold text-[#7C3AED] hover:underline cursor-pointer">
                View all
              </button>
            </div>

            <div className="space-y-3">
              {recommendedList.slice(0, 4).map((rec) => {
                const durStr = rec.durationStr || `${Math.floor((rec.durationMinutes || 300) / 60)}h ${(rec.durationMinutes || 300) % 60}m`;

                return (
                  <div key={rec.id} className="flex items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9] last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <TechIconGraphic type={rec.techIcon || 'js'} />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#0F172A] hover:text-[#2563EB] cursor-pointer truncate" onClick={() => navigate(`/learning/course/${rec.id}`)}>
                          {rec.title}
                        </h4>
                        <p className="text-[11px] text-[#64748B] mt-0.5 font-medium">
                          {rec.rating || 4.8} ★ • {durStr}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/learning/course/${rec.id}`)}
                      className="px-3 py-1.5 bg-[#F1F5F9] hover:bg-gradient-to-r hover:from-[#2563EB] hover:to-[#9333EA] hover:text-white text-[#334155] font-bold text-xs rounded-xl transition-all shrink-0 cursor-pointer"
                    >
                      Start
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PANEL 3: RECENT ACHIEVEMENTS */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F172A]">Recent Achievements</h3>
              <button onClick={() => navigate('/gamification')} className="text-xs font-semibold text-[#7C3AED] hover:underline cursor-pointer">
                View all
              </button>
            </div>

            <div className="space-y-3">
              {hubData.recentAchievements.length === 0 ? (
                <div className="p-4 bg-[#FAFBFF] border border-dashed border-[#CBD5E1] rounded-xl text-center text-xs text-[#64748B]">
                  No achievements earned yet. Complete course lessons to earn XP and unlock badges!
                </div>
              ) : (
                hubData.recentAchievements.map((ach) => (
                  <div key={ach.id} className="flex items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9] last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        ach.icon === 'flame' ? 'bg-[#FFEDD5] text-[#EA580C]' : ach.icon === 'quiz' ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#F3E8FF] text-[#9333EA]'
                      }`}>
                        {ach.icon === 'flame' ? <Flame className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#0F172A] truncate">
                          {ach.title}
                        </h4>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          {ach.subtitle || ach.description || 'Achievement'}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-extrabold text-[#16A34A] shrink-0">
                      +{ach.xp || 50} XP
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default LearningHub;
