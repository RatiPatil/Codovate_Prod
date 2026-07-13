import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiV1 from '../../api/v1/api';

const CompanyProfile = () => {
  const { companyId } = useParams();
  const [data, setData] = useState({ company: null, active_opportunities: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiV1.get(`/companies/${companyId}`)
      .then(res => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [companyId]);

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!data.company) return <div className="flex-1 p-8"><p className="text-gray-400">Company not found.</p></div>;

  const { company, active_opportunities } = data;

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto relative z-10 max-w-5xl mx-auto w-full">
      <div className="glass-panel p-8 md:p-12 rounded-2xl relative overflow-hidden mb-8 flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        
        {company.logo ? (
          <img src={company.logo} alt={company.name} className="w-32 h-32 rounded-2xl object-contain bg-white/5 p-2 shadow-xl border border-white/10 relative z-10" />
        ) : (
          <div className="w-32 h-32 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-black text-6xl shadow-xl border border-white/10 relative z-10">
            {company.name?.charAt(0) || 'C'}
          </div>
        )}

        <div className="relative z-10 flex-1">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{company.name}</h1>
            {company.verified && <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
          </div>
          <p className="text-gray-400 text-lg mb-6">{company.industry} • {company.location || 'Global'}</p>
          
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            {company.website && (
              <a href={company.website} target="_blank" rel="noreferrer" className="btn-secondary py-2 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                Visit Website
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">About {company.name}</h2>
            <div className="glass-card p-6 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {company.description || 'No description provided.'}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Active Opportunities ({active_opportunities.length})</h2>
            <div className="space-y-4">
              {active_opportunities.length === 0 ? (
                <div className="glass-card p-6 text-center text-gray-500">No active opportunities at the moment.</div>
              ) : (
                active_opportunities.map(opp => (
                  <Link key={opp.id} to={`/opportunities/${opp.id}`} className="glass-card p-5 flex justify-between items-center group hover:border-primary/50 transition-colors">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{opp.title}</h3>
                      <p className="text-sm text-gray-400 mt-1">{opp.type} • {opp.location || 'Remote'}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
