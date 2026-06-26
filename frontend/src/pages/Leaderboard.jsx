import { useEffect, useState } from 'react';
import api from '../api/axios';

const Leaderboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leaderboard').then(res => setStudents(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto text-white relative z-10">
      <div className="mb-10 text-center max-w-2xl mx-auto relative z-10">
        <h1 className="text-4xl font-black mb-3">
          <span className="text-5xl inline-block mb-2">🏆</span><br/>
          <span className="text-gradient">Student Leaderboard</span>
        </h1>
        <p className="text-gray-400 text-sm">
          Top performing students ranked by their activity points, profile completions, and applications.
        </p>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
        
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/10 text-[11px] uppercase text-gray-400 tracking-widest font-bold">
              <tr>
                <th className="px-6 py-5 whitespace-nowrap">Rank</th>
                <th className="px-6 py-5 whitespace-nowrap">Student Name</th>
                <th className="px-6 py-5 text-center whitespace-nowrap">College</th>
                <th className="px-6 py-5 text-right whitespace-nowrap">Activity Points</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-24 text-gray-400 text-sm border-dashed">
                    <p className="text-4xl mb-4 opacity-50">📊</p>
                    No data available yet.
                  </td>
                </tr>
              ) : students.map((s, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group/row">
                  <td className="px-6 py-5">
                    {i === 0 ? <span className="text-3xl inline-block animate-pulse filter drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">🥇</span> : 
                     i === 1 ? <span className="text-3xl inline-block filter drop-shadow-[0_0_10px_rgba(156,163,175,0.5)]">🥈</span> : 
                     i === 2 ? <span className="text-3xl inline-block filter drop-shadow-[0_0_10px_rgba(180,83,9,0.5)]">🥉</span> : 
                     <span className="text-gray-500 font-bold ml-2 text-lg">#{i + 1}</span>}
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-base group-hover/row:text-primary transition-colors">{s.name}</p>
                    {s.badges && s.badges.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {s.badges.map(b => <span key={b} className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-white font-bold">{b}</span>)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center text-sm text-gray-400">
                    {s.college}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-black shadow-sm inline-flex items-center gap-1 backdrop-blur-sm">
                      ✨ {s.points} PTS
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
