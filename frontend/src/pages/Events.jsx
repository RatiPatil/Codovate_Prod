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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 p-6 md:p-8 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">Upcoming Events</h1>
          <p className="text-slate-600 text-sm md:text-base max-w-2xl">
            Discover hackathons, technical workshops, and exclusive webinars. Level up your skills with the community.
          </p>
        </header>

        {/* Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar border-b border-slate-200">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 whitespace-nowrap text-sm font-bold border-b-2 transition-colors ${
                activeTab === tab ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-slate-500 py-12">Loading events...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-500">
                <p>No events found for this category.</p>
              </div>
            )}
            
            {filteredEvents.map((evt) => (
              <div 
                key={evt.id} 
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-indigo-200 transition-all duration-300 group flex flex-col h-full shadow-sm hover:shadow-md relative"
              >
                <button
                  onClick={(e) => handleSave(evt.id, e)}
                  className={`absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    evt.is_saved ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  <Bookmark size={16} className={evt.is_saved ? 'fill-amber-500' : ''} />
                </button>

                <div className="flex justify-between items-start mb-4 pr-10">
                  <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {evt.type}
                  </span>
                  <div className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1">
                    <span className="text-xs font-bold text-slate-500 uppercase">{new Date(evt.date).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-xl font-black text-slate-900">{new Date(evt.date).getDate()}</span>
                  </div>
                </div>
                
                <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">{evt.title}</h3>
                
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" /> 
                    {new Date(evt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" /> 
                    {evt.location}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <Users size={14} className="text-slate-400" /> 
                    {evt.attendees || 0} attending
                  </p>
                </div>

                <p className="text-slate-600 text-sm mb-6 flex-1 line-clamp-3 leading-relaxed">
                  {evt.description}
                </p>
                
                <button 
                  onClick={() => handleRSVP(evt.id)}
                  className={`w-full font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs shadow-sm ${
                    evt.is_rsvp 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                      : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-90 text-white'
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
