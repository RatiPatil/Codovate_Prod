import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { School, MessageSquare, Megaphone, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CollegeCommunity = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const fetchCommunityData = async () => {
    try {
      const res = await api.get('/community');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500 py-12">Loading your community...</div>;
  }

  if (data && !data.hasCollege) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
          <School size={48} />
        </div>
        <h2 className="text-3xl font-black text-white mb-4">No College Linked</h2>
        <p className="text-gray-400 max-w-md mb-8">
          {data.message}
        </p>
        <button 
          onClick={() => navigate('/profile')}
          className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold transition-all"
        >
          Update Profile
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050510] text-white p-6 md:p-8 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 flex items-center gap-4">
              <School className="text-primary" size={40} />
              {data.collegeName}
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl">
              Your exclusive campus hub. Connect with peers, view announcements, and collaborate.
            </p>
          </div>
          <button className="bg-white/5 border border-white/10 hover:bg-white/10 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors">
            <Users size={20} /> Member Directory
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Announcements (Left Col - spans 2) */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="text-yellow-400" /> Official Announcements</h2>
            
            <div className="space-y-4">
              {data.announcements.map(ann => (
                <div key={ann.id} className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-yellow-400">{ann.title}</h3>
                      <p className="text-sm text-gray-500 font-bold mt-1">From: {ann.author}</p>
                    </div>
                    <span className="text-xs text-gray-400 font-medium bg-white/5 px-2 py-1 rounded">{ann.date}</span>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Discussions (Right Col) */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="text-primary" /> Discussions</h2>
            
            <div className="bg-[#0a0a16] border border-white/10 rounded-2xl p-4 space-y-2">
              <button className="w-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 py-3 rounded-xl font-bold mb-4 transition-colors">
                + New Topic
              </button>
              
              {data.discussions.map(disc => (
                <div key={disc.id} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                  <h4 className="font-bold text-gray-200 line-clamp-1 mb-2">{disc.title}</h4>
                  <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                    <span>{disc.author}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={12} /> {disc.replies}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CollegeCommunity;
