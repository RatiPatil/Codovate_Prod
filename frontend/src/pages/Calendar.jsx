import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { formatDate } from '../utils/dateUtils';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { Link } from 'react-router-dom';

const typeColors = {
  Internship: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Hackathon: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Job: 'bg-green-500/10 text-green-400 border-green-500/20',
  Event: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Workshop: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Mentor Session': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Competition: 'bg-red-500/10 text-red-400 border-red-500/20',
  Default: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
};

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchCalendar = useCallback(async () => {
    try {
      const res = await api.get('/calendar');
      setEvents(res.data);
    } catch (err) {
      console.error("Failed to fetch calendar", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Group events by day
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const blanks = Array(firstDayOfMonth).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full h-full">
        <SkeletonLoader type="card" count={4} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto relative z-10 w-full h-full flex flex-col">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            <span className="text-gradient">Deadline Calendar</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Never miss an opportunity, hackathon, or mentor session.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-2 glass-panel">
          <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-white font-bold min-w-[120px] text-center">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden flex-1 flex flex-col bg-[#0f0f13]">
        <div className="grid grid-cols-7 bg-white/5 border-b border-white/5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {blanks.map((_, i) => (
            <div key={`blank-${i}`} className="border-b border-r border-white/5 bg-white/[0.02]" />
          ))}
          {days.map(day => {
            const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0];
            const dayEvents = events.filter(e => e.date.startsWith(dateStr));
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            return (
              <div key={day} className={`border-b border-r border-white/5 p-2 min-h-[120px] transition-colors hover:bg-white/[0.03] ${isToday ? 'bg-primary/5' : ''}`}>
                <div className={`text-sm font-bold mb-2 flex items-center justify-center w-7 h-7 rounded-full ${isToday ? 'bg-primary text-white' : 'text-gray-400'}`}>
                  {day}
                </div>
                <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[100px] no-scrollbar">
                  {dayEvents.map(e => (
                    <Link to={e.link || '/'} key={e.id} className={`text-[10px] font-semibold px-2 py-1.5 rounded border leading-tight truncate hover:opacity-80 transition-opacity ${typeColors[e.type] || typeColors.Default}`} title={e.title}>
                      {e.title}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Upcoming List View for Mobile or quick glance */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-white mb-4">Upcoming Next 7 Days</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.filter(e => {
            const evDate = new Date(e.date);
            const now = new Date();
            const diff = (evDate - now) / (1000 * 60 * 60 * 24);
            return diff >= 0 && diff <= 7;
          }).slice(0, 6).map(e => (
            <Link to={e.link || '/'} key={`upcoming-${e.id}`} className="glass-card p-4 rounded-xl flex items-center gap-4 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 bg-white/5 rounded-lg flex flex-col items-center justify-center border border-white/10 shrink-0">
                <span className="text-[10px] text-gray-400 uppercase font-bold">{formatDate(e.date, { month: 'short' })}</span>
                <span className="text-lg font-black text-white">{formatDate(e.date, { day: 'numeric' })}</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-white font-bold text-sm truncate">{e.title}</h4>
                <p className="text-gray-500 text-xs truncate mt-1">{e.company || e.type}</p>
              </div>
            </Link>
          ))}
          {events.length > 0 && events.filter(e => {
            const evDate = new Date(e.date);
            const now = new Date();
            const diff = (evDate - now) / (1000 * 60 * 60 * 24);
            return diff >= 0 && diff <= 7;
          }).length === 0 && (
            <p className="text-gray-500 text-sm">No upcoming deadlines in the next 7 days! Relax. ☕</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
