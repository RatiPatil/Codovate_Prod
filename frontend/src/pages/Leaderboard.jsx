import { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Leaderboard = () => {
  const { user: currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('All');
  const [courseFilter, setCourseFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('Overall');

  const tabs = ['Overall', 'Weekly', 'Monthly', 'College Wise', 'Course Wise', 'Skill Wise'];

  useEffect(() => {
    setLoading(true);
    let queryParams = new URLSearchParams();
    
    if (activeTab === 'Weekly') queryParams.append('filter', 'weekly');
    if (activeTab === 'Monthly') queryParams.append('filter', 'monthly');
    // If college wise, maybe we pass the filter, but we handle it client-side for simplicity if we fetch 50
    // Actually, backend supports `?college=` and `?course=`
    if (activeTab === 'College Wise' && collegeFilter !== 'All') queryParams.append('college', collegeFilter);
    if (activeTab === 'Course Wise' && courseFilter !== 'All') queryParams.append('course', courseFilter);

    api.get(`/leaderboard?${queryParams.toString()}`)
      .then(res => {
        setStudents(res.data.leaderboard || []);
        setMe(res.data.currentUser || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTab, collegeFilter, courseFilter]);

  const filtered = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.college?.toLowerCase().includes(search.toLowerCase());
      // Client-side fallback if backend doesn't filter perfectly
      const matchesCollege = (activeTab !== 'College Wise' || collegeFilter === 'All') ? true : s.college === collegeFilter;
      const matchesCourse = (activeTab !== 'Course Wise' || courseFilter === 'All') ? true : s.course === courseFilter;
      return matchesSearch && matchesCollege && matchesCourse;
    });
  }, [students, search, collegeFilter, courseFilter, activeTab]);

  // Extract unique colleges/courses for dropdowns based on students fetched or pre-defined lists
  const colleges = useMemo(() => ['All', ...new Set(students.map(s => s.college).filter(Boolean))].sort(), [students]);
  const courses = useMemo(() => ['All', ...new Set(students.map(s => s.course).filter(Boolean))].sort(), [students]);

  const top3 = filtered.slice(0, 3);

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto text-white relative z-10">
      <div className="mb-10 text-center max-w-2xl mx-auto relative z-10">
        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
          <span className="text-5xl inline-block mb-2 animate-bounce">🏆</span><br/>
          <span className="text-gradient">Student Leaderboard</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base">
          Compete, climb the ranks, and showcase your placement readiness to top tech companies.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8 relative z-10">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border ${
              activeTab === tab
                ? 'bg-primary text-white border-primary shadow-[0_0_20px_rgba(32,21,255,0.4)] scale-105'
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters Area */}
      <div className="flex flex-col md:flex-row gap-4 mb-10 relative z-10">
        <div className="relative flex-1">
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by student name or college..."
            className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-inner"
          />
        </div>
        
        {activeTab === 'College Wise' && (
          <select
            value={collegeFilter}
            onChange={e => setCollegeFilter(e.target.value)}
            className="bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-primary transition-all appearance-none min-w-[200px]"
          >
            {colleges.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        {activeTab === 'Course Wise' && (
          <select
            value={courseFilter}
            onChange={e => setCourseFilter(e.target.value)}
            className="bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-primary transition-all appearance-none min-w-[200px]"
          >
            {courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(32,21,255,0.5)]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 glass-card border-dashed rounded-3xl">
          <p className="text-6xl mb-6 opacity-80 animate-pulse">🔍</p>
          <p className="text-gray-300 text-lg font-bold">No leaderboard data available.</p>
          <p className="text-gray-500 text-sm mt-2">Adjust your filters or check back later.</p>
        </div>
      ) : (
        <>
          {/* Podium for Top 3 (Only show if search is empty to preserve ranks) */}
          {!search && filtered.length >= 3 && (
            <div className="flex flex-col items-center md:flex-row md:items-end justify-center gap-4 mb-16 px-4 pt-10">
              {/* Rank 2 - Silver */}
              <div className="flex-1 max-w-[200px] flex flex-col items-center group relative w-full transform transition-transform hover:-translate-y-2">
                <div className="absolute inset-0 bg-blue-400/20 blur-[50px] pointer-events-none rounded-full" />
                <div className="w-20 h-20 rounded-full bg-slate-800 border-4 border-slate-400 flex items-center justify-center mb-3 z-10 shadow-[0_0_20px_rgba(148,163,184,0.4)] overflow-hidden">
                  {top3[1].avatar_url ? <img src={top3[1].avatar_url} className="w-full h-full object-cover" alt="" /> : <span className="text-3xl font-bold text-slate-300">{top3[1].name.charAt(0)}</span>}
                </div>
                <p className="font-bold text-base text-center mb-1 text-slate-200 line-clamp-1">{top3[1].name}</p>
                <p className="text-slate-300 text-xs font-black tracking-widest bg-slate-400/10 px-3 py-1 rounded-full mb-4">{top3[1].points} PTS</p>
                <div className="w-full h-28 bg-gradient-to-t from-slate-900/60 to-slate-500/20 border-t-2 border-slate-400/50 rounded-t-xl flex flex-col items-center justify-start pt-4 relative">
                  <span className="text-4xl drop-shadow-md mb-1">🥈</span>
                  <span className="text-white/20 font-black text-2xl">2</span>
                </div>
              </div>

              {/* Rank 1 - Gold */}
              <div className="flex-1 max-w-[240px] flex flex-col items-center group relative w-full -mt-8 order-first md:order-none transform transition-transform hover:-translate-y-3 z-20">
                <div className="absolute inset-0 bg-yellow-500/30 blur-[60px] pointer-events-none rounded-full" />
                <div className="w-28 h-28 rounded-full bg-yellow-900 border-4 border-yellow-400 flex items-center justify-center mb-4 z-10 shadow-[0_0_35px_rgba(234,179,8,0.5)] overflow-hidden">
                  {top3[0].avatar_url ? <img src={top3[0].avatar_url} className="w-full h-full object-cover" alt="" /> : <span className="text-5xl font-bold text-yellow-400">{top3[0].name.charAt(0)}</span>}
                </div>
                <p className="font-bold text-xl text-center mb-1 text-yellow-100 line-clamp-1">{top3[0].name}</p>
                <p className="text-yellow-400 text-sm font-black tracking-widest bg-yellow-500/20 border border-yellow-500/30 px-4 py-1.5 rounded-full mb-5 shadow-inner">{top3[0].points} PTS</p>
                <div className="w-full h-40 bg-gradient-to-t from-yellow-900/60 to-yellow-500/20 border-t-2 border-yellow-400/60 rounded-t-xl flex flex-col items-center justify-start pt-5 relative">
                  <span className="text-5xl drop-shadow-lg mb-2 animate-bounce">🥇</span>
                  <span className="text-white/20 font-black text-3xl">1</span>
                </div>
              </div>

              {/* Rank 3 - Bronze */}
              <div className="flex-1 max-w-[200px] flex flex-col items-center group relative w-full transform transition-transform hover:-translate-y-2">
                <div className="absolute inset-0 bg-orange-500/20 blur-[50px] pointer-events-none rounded-full" />
                <div className="w-20 h-20 rounded-full bg-orange-900/50 border-4 border-orange-500/80 flex items-center justify-center mb-3 z-10 shadow-[0_0_20px_rgba(249,115,22,0.3)] overflow-hidden">
                  {top3[2].avatar_url ? <img src={top3[2].avatar_url} className="w-full h-full object-cover" alt="" /> : <span className="text-3xl font-bold text-orange-400">{top3[2].name.charAt(0)}</span>}
                </div>
                <p className="font-bold text-base text-center mb-1 text-orange-100 line-clamp-1">{top3[2].name}</p>
                <p className="text-orange-400 text-xs font-black tracking-widest bg-orange-500/10 px-3 py-1 rounded-full mb-4">{top3[2].points} PTS</p>
                <div className="w-full h-24 bg-gradient-to-t from-orange-900/60 to-orange-500/20 border-t-2 border-orange-500/50 rounded-t-xl flex flex-col items-center justify-start pt-4 relative">
                  <span className="text-4xl drop-shadow-md mb-1">🥉</span>
                  <span className="text-white/20 font-black text-2xl">3</span>
                </div>
              </div>
            </div>
          )}

          {/* Current User Highlight Banner */}
          {me && (
            <div className="mb-10 p-[1px] rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-pink-500 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-pink-500 opacity-50 blur-xl group-hover:opacity-70 transition-opacity pointer-events-none" />
              <div className="bg-[#0a0a0f] rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 h-full">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 border border-primary/50 flex items-center justify-center text-2xl font-black text-primary shadow-[0_0_15px_rgba(32,21,255,0.3)]">
                    #{me.rank || '-'}
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Your Current Position</p>
                    <h3 className="text-xl md:text-2xl font-bold text-white">Keep climbing, {me.name?.split(' ')[0]}! 🚀</h3>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-center md:justify-end gap-6 md:gap-10 w-full md:w-auto">
                  <div className="text-center md:text-right">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Points</p>
                    <p className="text-2xl font-black text-white">{me.total_points || 0}</p>
                  </div>
                  <div className="hidden sm:block w-px h-10 bg-white/10" />
                  <div className="text-center md:text-right">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Placement Readiness</p>
                    <p className="text-2xl font-black text-green-400">{me.placement_score || 0}%</p>
                  </div>
                  <div className="hidden sm:block w-px h-10 bg-white/10" />
                  <div className="text-center md:text-right">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Current Streak</p>
                    <p className="text-2xl font-black text-orange-400 flex items-center justify-center gap-1">
                      {me.streak_count || 0} <span className="text-sm">🔥</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enterprise Ranking Table */}
          <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-hidden relative shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 border-b border-white/10 text-[10px] uppercase text-gray-400 tracking-widest font-bold">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap w-20 text-center">Rank</th>
                    <th className="px-6 py-4 whitespace-nowrap min-w-[250px]">Student Details</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">Placement Score</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center hidden lg:table-cell">Metrics</th>
                    <th className="px-6 py-4 whitespace-nowrap hidden xl:table-cell">Badges</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center hidden md:table-cell">Streak</th>
                    <th className="px-6 py-4 whitespace-nowrap text-right w-32">Total Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((s) => {
                    const isMe = me && s.id === me.id;
                    return (
                      <tr key={s.id} className={`transition-colors group/row ${isMe ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-white/5'}`}>
                        {/* Rank */}
                        <td className="px-6 py-4 text-center font-bold text-gray-400">
                          {s.rank === 1 ? <span className="text-2xl">🥇</span> :
                           s.rank === 2 ? <span className="text-2xl">🥈</span> :
                           s.rank === 3 ? <span className="text-2xl">🥉</span> :
                           `#${s.rank}`}
                        </td>

                        {/* Student Details */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="relative shrink-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border overflow-hidden ${
                                isMe ? 'bg-primary/20 text-primary border-primary/50' : 'bg-white/5 text-gray-300 border-white/10'
                              }`}>
                                {s.avatar_url ? <img src={s.avatar_url} className="w-full h-full object-cover" alt="" /> : s.name?.charAt(0).toUpperCase()}
                              </div>
                              {isMe && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-[#0a0a0f]" title="You" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-gray-200 group-hover/row:text-white truncate flex items-center gap-2">
                                {s.name}
                                {isMe && <span className="bg-primary/20 text-primary border border-primary/30 text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider">You</span>}
                              </p>
                              <p className="text-xs text-gray-500 truncate mt-0.5">{s.college}</p>
                              <p className="text-[10px] text-gray-600 truncate mt-0.5 uppercase tracking-widest">{s.course}</p>
                            </div>
                          </div>
                        </td>

                        {/* Placement Score */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${s.placement_score >= 80 ? 'bg-green-400' : s.placement_score >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                style={{ width: `${s.placement_score}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-gray-300 w-8">{s.placement_score}%</span>
                          </div>
                        </td>

                        {/* Metrics (Projects, Certs, Apps) */}
                        <td className="px-6 py-4 text-center hidden lg:table-cell">
                          <div className="flex items-center justify-center gap-3">
                            <div className="flex flex-col items-center" title="Projects">
                              <span className="text-gray-500 text-[10px] uppercase font-bold">PRJ</span>
                              <span className="text-xs font-semibold text-gray-300">{s.projects_count || 0}</span>
                            </div>
                            <div className="flex flex-col items-center" title="Certificates">
                              <span className="text-gray-500 text-[10px] uppercase font-bold">CRT</span>
                              <span className="text-xs font-semibold text-gray-300">{s.certificates_count || 0}</span>
                            </div>
                            <div className="flex flex-col items-center" title="Applications">
                              <span className="text-gray-500 text-[10px] uppercase font-bold">APP</span>
                              <span className="text-xs font-semibold text-gray-300">{s.applications_count || 0}</span>
                            </div>
                          </div>
                        </td>

                        {/* Badges */}
                        <td className="px-6 py-4 hidden xl:table-cell">
                          <div className="flex flex-wrap gap-1.5">
                            {(s.badges || []).slice(0, 2).map((b, idx) => (
                              <span key={idx} className={`text-[9px] px-2 py-0.5 rounded border border-white/5 font-bold whitespace-nowrap ${b.color}`}>
                                {b.name}
                              </span>
                            ))}
                            {(s.badges || []).length > 2 && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded text-gray-400 font-bold border border-white/10">
                                +{(s.badges || []).length - 2}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Streak */}
                        <td className="px-6 py-4 text-center hidden md:table-cell">
                           <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
                             🔥 {s.streak_count || 0}
                           </span>
                        </td>

                        {/* Total Points */}
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-black tracking-widest ${
                            isMe ? 'bg-primary text-white shadow-[0_0_10px_rgba(32,21,255,0.3)]' : 'bg-white/5 text-gray-300 border border-white/10'
                          }`}>
                            {s.points} <span className="opacity-50 ml-0.5">PTS</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination / Footer */}
            <div className="bg-white/5 border-t border-white/10 p-4 flex items-center justify-between text-xs text-gray-400 font-medium">
              <p>Showing top {filtered.length} students</p>
              <p>Updated in real-time</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
