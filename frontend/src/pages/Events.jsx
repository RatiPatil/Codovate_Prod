import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Calendar, MapPin, Users, ChevronRight, Bookmark, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  const tabs = ['All', 'Hackathon', 'Workshop', 'Webinar', 'College Event', 'Placement Drive'];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data);
    } catch (err) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (eventId) => {
    try {
      const res = await api.post(`/events/${eventId}/rsvp`);
      toast.success(res.data.message);
      setEvents(prev => prev.map(e => {
        if (e.id === eventId) {
          return {
            ...e,
            is_rsvp: res.data.is_rsvp,
            attendees: res.data.is_rsvp ? (e.attendees || 0) + 1 : Math.max(0, (e.attendees || 1) - 1)
          };
        }
        return e;
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating RSVP');
    }
  };

  const handleSave = async (eventId, e) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/events/${eventId}/save`);
      toast.success(res.data.message);
      setEvents(prev => prev.map(evt => evt.id === eventId ? { ...evt, is_saved: res.data.is_saved } : evt));
    } catch (err) {
      toast.error('Failed to save event');
    }
  };

  const filteredEvents = events.filter(e => activeTab === 'All' || e.type === activeTab);

  return (
    <div className="min-h-screen bg-[#050510] text-white p-6 md:p-8 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Upcoming Events</h1>
          <p className="text-gray-400 text-sm md:text-base max-w-2xl">
            Discover hackathons, technical workshops, and exclusive webinars. Level up your skills with the community.
          </p>
        </header>

        {/* Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar border-b border-white/10">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 whitespace-nowrap text-sm font-bold border-b-2 transition-colors ${
                activeTab === tab ? 'border-blue-500 text-white bg-blue-500/10' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading events...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.length === 0 && (
              <div className="col-span-full py-16 text-center text-gray-400">
                <p>No events found for this category.</p>
              </div>
            )}
            
            {filteredEvents.map((evt) => (
              <div 
                key={evt.id} 
                className="bg-[#0a0a16] border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 group flex flex-col h-full hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] relative"
              >
                <button
                  onClick={(e) => handleSave(evt.id, e)}
                  className={`absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    evt.is_saved ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Bookmark size={16} className={evt.is_saved ? 'fill-yellow-500' : ''} />
                </button>

                <div className="flex justify-between items-start mb-4 pr-10">
                  <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {evt.type}
                  </span>
                  <div className="flex flex-col items-center bg-white/5 border border-white/10 rounded-lg px-3 py-1">
                    <span className="text-xs font-bold text-gray-400 uppercase">{new Date(evt.date).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-xl font-black text-white">{new Date(evt.date).getDate()}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-black text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">{evt.title}</h3>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" /> 
                    {new Date(evt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    <MapPin size={16} className="text-gray-500" /> 
                    {evt.location}
                  </p>
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    <Users size={16} className="text-gray-500" /> 
                    {evt.attendees || 0} attending
                  </p>
                </div>

                <p className="text-gray-300 text-sm mb-6 flex-1 line-clamp-3 leading-relaxed">
                  {evt.description}
                </p>
                
                <button 
                  onClick={() => handleRSVP(evt.id)}
                  className={`w-full font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                    evt.is_rsvp 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {evt.is_rsvp ? (
                    <><CheckCircle size={16} /> Registered</>
                  ) : (
                    <>RSVP Now <ChevronRight size={16} /></>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
