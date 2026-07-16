import { Link } from 'react-router-dom';

const UpcomingConsultationsWidget = ({ sessions }) => {
  // Only show upcoming or pending sessions
  const upcomingSessions = sessions?.filter(s => ['upcoming', 'pending'].includes(s.status?.toLowerCase())) || [];

  if (upcomingSessions.length === 0) {
    return null; // Hide if no upcoming sessions
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium tracking-widest text-gray-400 uppercase">Upcoming Consultations</h3>
        <Link to="/mentors" className="text-xs text-primary hover:text-primary/80 transition-colors">View All</Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {upcomingSessions.slice(0, 2).map((session) => (
          <div key={session._id} className="bg-white/[0.02] border border-white/5 p-5 rounded-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <img loading="lazy" decoding="async" 
                  src={session.mentorId?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.mentorId?.name || 'M')}&background=random`} 
                  alt={session.mentorId?.name} 
                  className="w-10 h-10 rounded-full bg-black"
                />
                <div>
                  <h4 className="text-white text-sm font-medium">{session.mentorId?.name || 'Mentor'}</h4>
                  <p className="text-gray-400 text-xs">{session.mentorId?.designation || 'Expert'}</p>
                </div>
              </div>
              <span className={`text-[10px] font-medium uppercase tracking-widest px-2 py-1 rounded ${
                session.status === 'upcoming' ? 'bg-primary/10 text-primary' : 'bg-yellow-500/10 text-yellow-500'
              }`}>
                {session.status}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
              <span>📅</span>
              <span>
                {session.scheduledAt ? new Date(session.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Pending Confirmation'}
              </span>
              {session.scheduledAt && (
                <>
                  <span>•</span>
                  <span>{new Date(session.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                </>
              )}
            </div>
            
            <Link 
              to="/mentors" 
              className="block w-full py-2 text-center text-xs font-medium text-white border border-white/10 rounded hover:bg-white/10 transition-colors"
            >
              Manage Session
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingConsultationsWidget;
