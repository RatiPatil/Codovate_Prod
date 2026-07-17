import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Calendar, MapPin, Users, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleRSVP = (eventId) => {
    toast.success("Successfully RSVP'd for this event!");
  };

  return (
    <div className="min-h-screen bg-[#050510] text-white p-6 md:p-8 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Upcoming Events</h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl">
            Discover hackathons, technical workshops, and exclusive webinars. Level up your skills with the community.
          </p>
        </header>

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading events...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <div 
                key={evt.id} 
                className="bg-[#0a0a16] border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 group flex flex-col h-full hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {evt.type}
                  </span>
                  <div className="flex flex-col items-center bg-white/5 border border-white/10 rounded-lg px-3 py-1">
                    <span className="text-xs font-bold text-gray-400 uppercase">{new Date(evt.date).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-xl font-black text-white">{new Date(evt.date).getDate()}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-black text-white mb-2 group-hover:text-blue-400 transition-colors">{evt.title}</h3>
                
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
                    {evt.attendees} attending
                  </p>
                </div>

                <p className="text-gray-300 text-sm mb-6 flex-1 line-clamp-3 leading-relaxed">
                  {evt.description}
                </p>
                
                <button 
                  onClick={() => handleRSVP(evt.id)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  RSVP Now <ChevronRight size={16} />
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
