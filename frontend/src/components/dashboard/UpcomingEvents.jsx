import { useEffect, useState } from 'react';

const UpcomingEvents = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 48, minutes: 12, seconds: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) seconds--;
        else {
          seconds = 59;
          if (minutes > 0) minutes--;
          else {
            minutes = 59;
            if (hours > 0) hours--;
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (val) => val.toString().padStart(2, '0');

  const events = [
    { title: 'Global Hackathon', type: 'Hackathon', urgent: true },
    { title: 'Google SWE Intern', type: 'Deadline', urgent: false, staticTime: '3 Days' },
    { title: 'Resume Workshop', type: 'Workshop', urgent: false, staticTime: 'Friday' }
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📅</span>
          <h2 className="text-lg font-bold text-white">Upcoming Events</h2>
        </div>
      </div>

      <div className="space-y-3 flex-1">
        {events.map((ev, i) => (
          <div key={i} className="flex justify-between items-center bg-black/30 rounded-xl p-3 border border-white/5 group hover:bg-white/5 transition-colors cursor-pointer">
            <div>
              <p className="text-white font-semibold text-sm line-clamp-1">{ev.title}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{ev.type}</p>
            </div>
            {ev.urgent ? (
              <div className="flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-1 rounded text-[10px] font-mono font-bold shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1" />
                {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
              </div>
            ) : (
              <div className="bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded text-[10px] font-bold shrink-0">
                {ev.staticTime}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingEvents;
