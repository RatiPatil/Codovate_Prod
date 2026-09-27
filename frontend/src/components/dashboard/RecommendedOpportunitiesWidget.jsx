import { Link } from 'react-router-dom';

const RecommendedOpportunitiesWidget = ({ opportunities, profile }) => {
  if (!opportunities || opportunities.length === 0) {
    return null; // Hide if no opportunities available
  }

  // Basic mock sorting logic to show 'top' matches
  // In a real scenario, this is sorted by the backend based on profile skills
  const topMatches = opportunities.slice(0, 2);

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium tracking-widest text-gray-400 uppercase">Top Recommended Opportunities</h3>
        <Link to="/opportunities" className="text-xs text-primary hover:text-primary/80 transition-colors">View All</Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topMatches.map((opp) => (
          <Link 
            to={`/opportunities/${opp._id}`} 
            key={opp._id} 
            className="flex flex-col justify-between bg-white/[0.02] border border-white/5 p-5 rounded-xl hover:bg-white/[0.05] transition-colors group"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-black/50 border border-white/10 flex items-center justify-center shrink-0 text-xs">
                    {opp.company?.name?.[0] || '🏢'}
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-medium">{opp.title}</h4>
                    <p className="text-gray-400 text-xs">{opp.company?.name}</p>
                  </div>
                </div>
                <span className="text-[10px] text-green-400 font-medium tracking-widest uppercase bg-green-400/10 px-2 py-1 rounded">
                  Top Match
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1">📍 {opp.location || 'Remote'}</span>
                <span className="flex items-center gap-1">💼 {opp.type || 'Full-time'}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1 py-2 text-center text-xs font-medium text-white bg-primary/20 hover:bg-primary/30 transition-colors rounded">
                View Details
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecommendedOpportunitiesWidget;
