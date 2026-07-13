import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiV1 from '../../api/v1/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/dateUtils';
import { showConfirm, showAlert } from '../../utils/uiUtils';

const badgeColors = {
  'Verified Company': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Startup Partner': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'College Partner': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'External Opportunity': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const OpportunityDetails = () => {
  const { id } = useParams();
  const [opp, setOpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    apiV1.get(`/opportunities/${id}`)
      .then(data => setOpp(data.opportunity))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiV1.post('/saved', { opportunity_id: id });
      showAlert('Opportunity saved to your bookmarks!', 'success');
    } catch (err) {
      showAlert(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleApply = async () => {
    // Determine flow based on source_type
    if (opp.source_type === 'external_redirect' || !opp.source_type) {
      if (!opp.apply_url) {
        showAlert('Application link is currently unavailable.', 'error');
        return;
      }
      
      const confirmed = await showConfirm(
        'Leaving Codovate\n\nYou are about to apply on the company\'s official website. We will track this application as "Started".'
      );
      if (!confirmed) return;

      setStarting(true);
      try {
        const res = await apiV1.post('/applications/start', { opportunity_id: id });
        
        // Open link
        window.open(opp.apply_url, '_blank');
        
        if (res.already_started) {
          showAlert('You already started this application. Redirecting to your tracker.', 'info');
        } else {
          showAlert('Application started. Complete it on the company website!', 'success');
        }
        
      } catch (err) {
        showAlert(err.message || 'Failed to start application', 'error');
      } finally {
        setStarting(false);
      }
    } else {
      // Future integration: direct_apply, company_dashboard etc.
      showAlert('Direct applications are coming soon in Codovate V2!', 'info');
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!opp) return <div className="flex-1 p-8"><p className="text-gray-400">Opportunity not found or removed.</p></div>;

  const isClosed = opp.status === 'Closed' || (opp.deadline && new Date(opp.deadline) < new Date());

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto relative z-10 max-w-4xl mx-auto w-full">
      <Link to="/opportunities" className="text-sm text-gray-400 hover:text-white flex items-center gap-2 mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Opportunities
      </Link>

      <div className="glass-panel p-6 md:p-10 rounded-2xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start gap-6 relative z-10">
          {opp.company_logo ? (
            <img src={opp.company_logo} alt={opp.company_name} className="w-24 h-24 rounded-2xl object-contain bg-white/5 p-2 shadow-lg border border-white/10" />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-black text-4xl shadow-lg border border-white/10">
              {opp.company_name?.charAt(0) || 'C'}
            </div>
          )}

          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full border ${badgeColors[opp.source_badge] || badgeColors['External Opportunity']}`}>
                {opp.source_badge || 'External Opportunity'}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full border bg-white/5 border-white/10 text-white">
                {opp.type}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">{opp.title}</h1>
            <p className="text-xl text-gray-300 font-medium flex items-center gap-2">
              <Link to={`/company/${opp.company_id}`} className="hover:text-primary transition-colors hover:underline">
                {opp.company_name}
              </Link>
              {opp.company_verified && <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            {isClosed ? (
              <button disabled className="btn-secondary opacity-50 cursor-not-allowed">Application Closed</button>
            ) : (
              <button 
                onClick={handleApply} 
                disabled={starting}
                className="btn-primary shadow-[0_0_20px_-5px_rgba(32,21,255,0.5)] whitespace-nowrap"
              >
                {starting ? 'Redirecting...' : 'Apply Now'}
              </button>
            )}
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-8 border-t border-white/10 relative z-10">
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Location</p>
            <p className="text-sm text-gray-300 font-semibold">{opp.location || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Mode</p>
            <p className="text-sm text-gray-300 font-semibold">{opp.work_mode || 'Remote'}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Salary / Stipend</p>
            <p className="text-sm text-green-400 font-semibold">{opp.salary_stipend || 'Unpaid / Undisclosed'}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Deadline</p>
            <p className="text-sm text-red-400 font-semibold">{opp.deadline ? formatDate(opp.deadline) : 'Rolling'}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">About the Role</h2>
            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap glass-card p-6">
              {opp.description || 'No description provided.'}
            </div>
          </section>

          {(opp.required_skills?.length > 0 || opp.preferred_skills?.length > 0) && (
            <section>
              <h2 className="text-xl font-bold text-white mb-4">Skills & Requirements</h2>
              <div className="glass-card p-6">
                {opp.required_skills?.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-3">Required</p>
                    <div className="flex flex-wrap gap-2">
                      {opp.required_skills.map(skill => (
                        <span key={skill} className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary text-xs rounded-lg font-medium">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
                {opp.preferred_skills?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-3">Preferred</p>
                    <div className="flex flex-wrap gap-2">
                      {opp.preferred_skills.map(skill => (
                        <span key={skill} className="px-3 py-1.5 bg-white/5 border border-white/10 text-gray-300 text-xs rounded-lg font-medium">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 border-primary/30">
            <h3 className="text-lg font-bold text-white mb-2">AI Match Score</h3>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-black text-primary">85%</span>
              <span className="text-sm text-gray-400 font-medium mb-1">match</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Based on your Codovate profile, projects, and skills, you are a strong fit for this role.
            </p>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Missing Skills</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded">Docker</span>
                <span className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded">Kubernetes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetails;
