import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiV1 from '../../api/v1/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/dateUtils';
import { formatTimeAgo } from '../../utils/dateUtils'; // Assuming this exists or will write it

const typeColors = {
  Internship: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Job: 'text-green-400 bg-green-500/10 border-green-500/20',
  Hackathon: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
};

const badgeColors = {
  'Verified Company': 'text-green-400',
  'Startup Partner': 'text-blue-400',
  'College Partner': 'text-purple-400',
  'External Opportunity': 'text-gray-400',
};

const OpportunitiesList = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: 'All', search: '' });

  const fetchOpps = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiV1.get('/opportunities', { params: filters });
      setOpportunities(data.opportunities || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // Basic debounce for search
    const timer = setTimeout(() => {
      fetchOpps();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchOpps, filters]);

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto relative z-10 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            <span className="text-gradient">Opportunities</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Discover internships, jobs, and hackathons tailored for you.</p>
        </div>
        <div className="flex gap-4">
          <Link to="/opportunities/saved" className="btn-secondary whitespace-nowrap text-sm">
            Saved Opportunities
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row gap-4 mb-8">
        <input 
          type="text" 
          placeholder="Search roles, companies, skills..." 
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-primary/50 transition-colors"
          value={filters.search}
          onChange={e => setFilters({ ...filters, search: e.target.value })}
        />
        <select 
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-primary/50"
          value={filters.type}
          onChange={e => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="All">All Types</option>
          <option value="Internship">Internships</option>
          <option value="Job">Jobs</option>
          <option value="Hackathon">Hackathons</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="glass-card h-64 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-20 glass-card border-dashed">
          <p className="text-gray-400">No opportunities found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunities.map(opp => (
            <Link key={opp.id} to={`/opportunities/${opp.id}`} className="glass-card p-6 flex flex-col group hover:border-primary/50 transition-all hover:shadow-[0_0_30px_-5px_rgba(32,21,255,0.2)]">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  {opp.company_logo ? (
                    <img src={opp.company_logo} alt={opp.company_name} className="w-12 h-12 rounded-xl object-contain bg-white/5 p-1" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-xl">
                      {opp.company_name?.charAt(0) || 'C'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors leading-tight">
                      {opp.title}
                    </h3>
                    <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                      {opp.company_name} 
                      {opp.company_verified && <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`text-xs px-2.5 py-1 rounded-full border ${typeColors[opp.type] || 'text-gray-400 bg-gray-500/10 border-gray-500/20'}`}>
                  {opp.type}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full border text-gray-300 bg-white/5 border-white/10">
                  {opp.work_mode || 'Remote'}
                </span>
              </div>

              <div className="mt-auto space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>📍 {opp.location || 'Anywhere'}</span>
                  <span className="text-green-400 font-semibold">{opp.salary_stipend || 'Unpaid'}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${badgeColors[opp.source_badge] || 'text-gray-500'}`}>
                    {opp.source_badge || 'External'}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {opp.deadline ? `Ends ${formatDate(opp.deadline)}` : 'Open'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default OpportunitiesList;
