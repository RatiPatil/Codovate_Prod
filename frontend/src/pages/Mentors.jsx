import { useEffect, useState } from 'react';
import api from '../api/axios';

const Mentors = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    api.get('/mentors').then(res => setMentors(res.data)).finally(() => setLoading(false));
  }, []);

  const handleBook = async (id) => {
    const time = prompt("Enter a time (e.g. 2026-07-01 10:00 AM):", "2026-07-01 10:00:00");
    if (!time) return;
    try {
      await api.post(`/mentors/${id}/book`, { scheduled_time: time, notes: "Need guidance on career and tech stack." });
      setToast('Mentor booked successfully! They will reach out to you.');
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || "Error booking mentor.");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto text-white relative z-10">
      {toast && (
        <div className="fixed top-4 right-4 glass-panel px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold z-50 animate-[fade-in-down_0.3s_ease-out]">
          <span className="text-green-400">✨ {toast}</span>
        </div>
      )}
      
      <div className="mb-10 text-center md:text-left relative z-10">
        <h1 className="text-3xl md:text-4xl font-bold flex items-center justify-center md:justify-start gap-3">
          <span className="text-4xl">👨‍🏫</span> <span className="text-gradient">Expert Mentors</span>
        </h1>
        <p className="text-gray-400 text-sm mt-2">Book a 1-on-1 session with industry veterans.</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {mentors.length === 0 ? (
          <div className="col-span-full text-center py-24 glass-card border-dashed">
            <p className="text-4xl mb-4">👥</p>
            <p className="text-gray-400 text-sm mb-4">No mentors are available right now. Check back later!</p>
          </div>
        ) : mentors.map(m => (
          <div key={m.id} className="glass-card p-6 flex flex-col group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-[100px] pointer-events-none transition-transform duration-500 group-hover:scale-125 group-hover:bg-primary/20" />
            
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xl border border-primary/20 shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform">
                {m.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">{m.name}</h2>
                <p className="text-[10px] text-primary uppercase font-bold tracking-widest mt-1 bg-primary/10 inline-block px-2 py-0.5 rounded">
                  {m.hourly_rate > 0 ? `$${m.hourly_rate}/hr` : 'Volunteer / Free'}
                </p>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm mb-5 h-10 overflow-hidden line-clamp-2 relative z-10">{m.bio}</p>
            
            <div className="flex flex-wrap gap-2 mb-6 relative z-10">
              {m.expertise.map(skill => (
                <span key={skill} className="bg-white/5 border border-white/10 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest text-gray-300">
                  {skill}
                </span>
              ))}
            </div>
            
            <button 
              onClick={() => handleBook(m.id)} 
              className="mt-auto btn-primary w-full shadow-lg group-hover:shadow-primary/30 relative z-10"
            >
              Book Session
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Mentors;
