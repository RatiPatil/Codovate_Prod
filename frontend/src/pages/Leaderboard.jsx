import { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Leaderboard = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('All');

  useEffect(() => {
    Promise.all([
      api.get('/leaderboard'),
      api.get('/students/profile').catch(() => ({ data: null }))
    ])
    .then(([resLeaderboard, resProfile]) => {
      setStudents(resLeaderboard.data);
      setProfile(resProfile.data);
    })
    .finally(() => setLoading(false));
  }, []);

  const colleges = useMemo(() => {
    const unique = [...new Set(students.map(s => s.college).filter(Boolean))];
    return ['All', ...unique.sort()];
  }, [students]);

  const filtered = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.college?.toLowerCase().includes(search.toLowerCase());
      const matchesCollege = collegeFilter === 'All' || s.college === collegeFilter;
      return matchesSearch && matchesCollege;
    });
  }, [students, search, collegeFilter]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const top3 = students.slice(0, 3);
  const myRank = students.findIndex(s => s.email === currentUser?.email || (profile && s.name === profile.name));
  const me = myRank !== -1 ? students[myRank] : null;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto text-white relative z-10">
      <div className="mb-12 text-center max-w-2xl mx-auto relative z-10">
        <h1 className="text-4xl font-black mb-3">
          <span className="text-5xl inline-block mb-2">🏆</span><br/>
          <span className="text-gradient">Student Leaderboard</span>
        </h1>
        <p className="text-gray-400 text-sm">
          Top performing students ranked by total points, activity, and achievements.
        </p>
      </div>

      {/* Podium for Top 3 */}
      {top3.length > 0 && !search && collegeFilter === 'All' && (
        <div className="flex flex-col md:flex-row items-end justify-center gap-4 mb-16 px-4">
          {/* Rank 2 */}
          {top3[1] && (
            <div className="flex-1 max-w-[200px] flex flex-col items-center group relative w-full">
              <div className="absolute inset-0 bg-blue-500/20 blur-[50px] pointer-events-none" />
              <div className="w-16 h-16 rounded-full bg-blue-500/10 border-2 border-blue-400/50 flex items-center justify-center text-2xl font-bold mb-3 z-10 shadow-[0_0_15px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform">
                {top3[1].name.charAt(0)}
              </div>
              <p className="font-bold text-sm text-center mb-1 line-clamp-1">{top3[1].name}</p>
              <p className="text-blue-400 text-xs font-black tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full mb-3">{top3[1].points} PTS</p>
              <div className="w-full h-24 bg-gradient-to-t from-blue-900/40 to-blue-500/10 border-t-2 border-blue-500/50 rounded-t-xl flex items-center justify-center relative">
                <span className="text-4xl absolute -top-5 drop-shadow-md">🥈</span>
                <span className="text-white/30 font-black text-4xl">2</span>
              </div>
            </div>
          )}

          {/* Rank 1 */}
          {top3[0] && (
            <div className="flex-1 max-w-[240px] flex flex-col items-center group relative w-full -mt-8 order-first md:order-none">
              <div className="absolute inset-0 bg-yellow-500/20 blur-[60px] pointer-events-none" />
              <div className="w-24 h-24 rounded-full bg-yellow-500/10 border-2 border-yellow-400/50 flex items-center justify-center text-4xl font-bold mb-3 z-10 shadow-[0_0_25px_rgba(234,179,8,0.4)] group-hover:scale-110 transition-transform">
                {top3[0].name.charAt(0)}
              </div>
              <p className="font-bold text-lg text-center mb-1 line-clamp-1 text-yellow-100">{top3[0].name}</p>
              <p className="text-yellow-400 text-sm font-black tracking-widest bg-yellow-500/10 px-3 py-1 rounded-full mb-4 shadow-inner border border-yellow-500/20">{top3[0].points} PTS</p>
              <div className="w-full h-32 bg-gradient-to-t from-yellow-900/40 to-yellow-500/10 border-t-2 border-yellow-500/50 rounded-t-xl flex items-center justify-center relative">
                <span className="text-5xl absolute -top-6 drop-shadow-lg">🥇</span>
                <span className="text-white/30 font-black text-5xl">1</span>
              </div>
            </div>
          )}

          {/* Rank 3 */}
          {top3[2] && (
            <div className="flex-1 max-w-[200px] flex flex-col items-center group relative w-full">
              <div className="absolute inset-0 bg-orange-500/20 blur-[50px] pointer-events-none" />
              <div className="w-16 h-16 rounded-full bg-orange-500/10 border-2 border-orange-400/50 flex items-center justify-center text-2xl font-bold mb-3 z-10 shadow-[0_0_15px_rgba(249,115,22,0.3)] group-hover:scale-110 transition-transform">
                {top3[2].name.charAt(0)}
              </div>
              <p className="font-bold text-sm text-center mb-1 line-clamp-1">{top3[2].name}</p>
              <p className="text-orange-400 text-xs font-black tracking-widest bg-orange-500/10 px-2 py-0.5 rounded-full mb-3">{top3[2].points} PTS</p>
              <div className="w-full h-20 bg-gradient-to-t from-orange-900/40 to-orange-500/10 border-t-2 border-orange-500/50 rounded-t-xl flex items-center justify-center relative">
                <span className="text-4xl absolute -top-5 drop-shadow-md">🥉</span>
                <span className="text-white/30 font-black text-4xl">3</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Your Rank Highlight */}
      {me && (
        <div className="mb-10 glass-panel p-6 rounded-2xl border-primary/30 bg-primary/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold">
              #{myRank + 1}
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Your Current Rank</p>
              <h3 className="text-xl font-bold text-white">Keep going, {me.name.split(' ')[0]}! 🚀</h3>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Points</p>
              <p className="text-2xl font-black text-primary">{me.points}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Activity Score</p>
              <p className="text-xl font-black text-white">{me.activity_score || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 relative z-10">
        <div className="relative flex-1">
          <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or college..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
        <select
          value={collegeFilter}
          onChange={e => setCollegeFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none min-w-[180px]"
        >
          {colleges.map(c => (
            <option key={c} value={c} className="bg-[#0a0a0a]">{c}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 glass-card border-dashed">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-gray-400 text-sm">No students match your search.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10 text-[11px] uppercase text-gray-400 tracking-widest font-bold">
                <tr>
                  <th className="px-6 py-5 whitespace-nowrap w-24">Rank</th>
                  <th className="px-6 py-5 whitespace-nowrap">Student Name</th>
                  <th className="px-6 py-5 text-center whitespace-nowrap">College</th>
                  <th className="px-6 py-5 text-center whitespace-nowrap hidden md:table-cell">Activity Score</th>
                  <th className="px-6 py-5 text-center whitespace-nowrap">Skills</th>
                  <th className="px-6 py-5 text-right whitespace-nowrap w-32">Points</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const originalRank = students.findIndex(st => st.name === s.name);
                  const isMe = me && s.name === me.name;
                  return (
                    <tr key={i} className={`border-b border-white/5 transition-colors group/row ${isMe ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-white/5'}`}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          {originalRank === 0 ? <span className="text-3xl inline-block animate-pulse">🥇</span> :
                           originalRank === 1 ? <span className="text-3xl inline-block">🥈</span> :
                           originalRank === 2 ? <span className="text-3xl inline-block">🥉</span> :
                           <span className="text-gray-500 font-bold ml-2 text-lg">#{originalRank + 1}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                            isMe ? 'bg-primary/20 text-primary border-primary/50' : 'bg-primary/10 text-primary border-primary/20'
                          }`}>
                            {s.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-base group-hover/row:text-primary transition-colors flex items-center gap-2">
                              {s.name} {isMe && <span className="bg-primary text-white text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider">You</span>}
                            </p>
                            {s.badges && s.badges.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {s.badges.map(b => <span key={b} className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-white font-bold">{b}</span>)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center text-sm text-gray-400">
                        {s.college || '—'}
                      </td>
                      <td className="px-6 py-5 text-center hidden md:table-cell">
                        <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded border border-white/10">
                          ⚡ {s.activity_score || 0}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {(s.skills || []).slice(0, 3).map(skill => (
                            <span key={skill} className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-300 font-bold uppercase tracking-widest">{skill}</span>
                          ))}
                          {(s.skills || []).length > 3 && (
                            <span className="text-[9px] text-gray-500">+{s.skills.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-black shadow-sm inline-flex items-center gap-1 backdrop-blur-sm">
                          {s.points} PTS
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
