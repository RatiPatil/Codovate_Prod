import { Link } from 'react-router-dom';

const ActiveApplicationsWidget = ({ applications }) => {
  // Only show active applications (not rejected)
  const activeApps = applications?.filter(app => app.status !== 'Rejected') || [];

  if (activeApps.length === 0) {
    return null; // Hide completely if no active applications (User rule: Hide empty secondary sections)
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium tracking-widest text-gray-400 uppercase">Active Applications</h3>
        <Link to="/applications" className="text-xs text-primary hover:text-primary/80 transition-colors">View All</Link>
      </div>
      
      <div className="flex flex-col space-y-3">
        {activeApps.slice(0, 3).map((app) => (
          <Link 
            to="/applications" 
            key={app._id} 
            className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-xl hover:bg-white/[0.05] transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-black/50 border border-white/10 flex items-center justify-center shrink-0">
                <span className="text-lg">🏢</span>
              </div>
              <div>
                <h4 className="text-white text-sm font-medium">{app.opportunityId?.title || 'Position'}</h4>
                <p className="text-gray-400 text-xs">{app.opportunityId?.company?.name || 'Company'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={`text-[10px] font-medium uppercase tracking-widest px-2 py-1 rounded ${
                app.status === 'Selected' ? 'bg-green-500/10 text-green-400' :
                app.status === 'Interview' ? 'bg-blue-500/10 text-blue-400' :
                'bg-yellow-500/10 text-yellow-400'
              }`}>
                {app.status || 'Pending'}
              </span>
              <span className="text-gray-600 group-hover:text-white transition-colors">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ActiveApplicationsWidget;
