import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiV1 from '../../api/v1/api';
import { formatDate } from '../../utils/dateUtils';
import { showAlert } from '../../utils/uiUtils';

const typeColors = {
  Internship: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Job: 'text-green-400 bg-green-500/10 border-green-500/20',
  Hackathon: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
};

const SavedOpportunities = () => {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiV1.get('/saved')
      .then(data => setSaved(data.saved || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (id) => {
    try {
      await apiV1.delete(`/saved/${id}`);
      setSaved(prev => prev.filter(s => s.save_id !== id));
      showAlert('Removed from saved opportunities', 'success');
    } catch (err) {
      showAlert(err.message || 'Failed to remove', 'error');
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto relative z-10 max-w-7xl mx-auto w-full">
      <Link to="/opportunities" className="text-sm text-gray-400 hover:text-white flex items-center gap-2 mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Opportunities
      </Link>

      <div className="mb-8 relative z-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          <span className="text-gradient">Saved Opportunities</span>
        </h1>
        <p className="text-gray-400 text-sm mt-2">Bookmarks and opportunities you want to apply for later.</p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="glass-card h-64 animate-pulse rounded-2xl"></div>)}
        </div>
      ) : saved.length === 0 ? (
        <div className="text-center py-20 glass-card border-dashed">
          <p className="text-gray-400 mb-4">You haven't saved any opportunities yet.</p>
          <Link to="/opportunities" className="btn-primary">Browse Opportunities</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {saved.map(opp => (
            <div key={opp.save_id} className="glass-card p-6 flex flex-col group relative">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  handleRemove(opp.save_id);
                }}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                title="Remove"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM9 15a1 1 0 011-1h6a1 1 0 110 2h-6a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>

              <div className="flex justify-between items-start mb-4 pr-10">
                <div className="flex gap-3">
                  {opp.company_logo ? (
                    <img src={opp.company_logo} alt={opp.company_name} className="w-12 h-12 rounded-xl object-contain bg-white/5 p-1" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-xl">
                      {opp.company_name?.charAt(0) || 'C'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg text-white leading-tight">
                      <Link to={`/opportunities/${opp.id}`} className="hover:text-primary transition-colors">{opp.title}</Link>
                    </h3>
                    <p className="text-sm text-gray-400">{opp.company_name}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`text-xs px-2.5 py-1 rounded-full border ${typeColors[opp.type] || 'text-gray-400 bg-gray-500/10 border-gray-500/20'}`}>
                  {opp.type}
                </span>
              </div>

              <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                  Saved {formatDate(opp.saved_at)}
                </p>
                <Link to={`/opportunities/${opp.id}`} className="text-primary text-sm font-semibold hover:underline">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedOpportunities;
