import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationsApi, opportunitiesApi } from '../api';
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  ExternalLink,
  Trash2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  X,
  FileCheck
} from 'lucide-react';

/* ─── Status Badge Colors ─── */
const STATUS_CONFIG = {
  Applied: {
    label: 'Applied',
    className: 'bg-blue-50 text-[#0066FF] border-blue-200',
    dotColor: 'bg-[#0066FF]',
  },
  'Under Review': {
    label: 'Under Review',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500 animate-pulse',
  },
  Shortlisted: {
    label: 'Shortlisted',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
    dotColor: 'bg-purple-500',
  },
  Interview: {
    label: 'Interview',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dotColor: 'bg-indigo-500 animate-pulse',
  },
  Selected: {
    label: 'Selected',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  Rejected: {
    label: 'Not Selected',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    dotColor: 'bg-slate-400',
  },
  'External Link Opened': {
    label: 'External Link Opened',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400',
  }
};

const formatDate = (val) => {
  if (!val) return '';
  const d = val?.toDate ? val.toDate() : new Date(val);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function Applications({ onNavigateToOpportunities }) {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState(null);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await applicationsApi.list();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setApplications(list);
    } catch (err) {
      console.error('Failed to load applications:', err);
      setError(err?.response?.data?.message || 'Unable to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();

    // Listen for custom application updates
    const handleAppSubmitted = () => fetchApplications();
    window.addEventListener('codovate:application-submitted', handleAppSubmitted);
    return () => {
      window.removeEventListener('codovate:application-submitted', handleAppSubmitted);
    };
  }, [fetchApplications]);

  const handleWithdraw = async (applicationId, oppTitle) => {
    if (!window.confirm(`Are you sure you want to withdraw your application for "${oppTitle || 'this opportunity'}"?`)) {
      return;
    }
    try {
      await applicationsApi.withdraw(applicationId);
      setActionSuccess('Application withdrawn successfully.');
      setApplications(prev => prev.filter(a => a.id !== applicationId));
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to withdraw application.');
    }
  };

  const handleViewDetails = async (oppId) => {
    if (!oppId) return;
    try {
      setModalLoading(true);
      const res = await opportunitiesApi.get(oppId);
      setSelectedOpp(res?.data || res);
    } catch (err) {
      console.error('Failed to load opportunity details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  // Metrics
  const totalCount = applications.length;
  const underReviewCount = applications.filter(a => a.status === 'Under Review').length;
  const shortlistedCount = applications.filter(a => ['Shortlisted', 'Interview'].includes(a.status)).length;
  const selectedCount = applications.filter(a => a.status === 'Selected').length;

  // Filtered List
  const filteredApplications = applications.filter(app => {
    if (filterStatus === 'Active') {
      if (['Selected', 'Rejected', 'External Link Opened'].includes(app.status)) return false;
    } else if (filterStatus !== 'All') {
      if (app.status !== filterStatus) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = (app.title || app.opportunity_title || '').toLowerCase();
      const company = (app.company || app.company_name || '').toLowerCase();
      if (!title.includes(q) && !company.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="w-full space-y-6 font-sans pb-16">
      {/* ── Top Header ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Applications
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Track and manage your submitted job, internship and challenge applications.
          </p>
        </div>

        <button
          onClick={fetchApplications}
          className="self-start sm:self-center inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Alert Toast ── */}
      {actionSuccess && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Applied</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{totalCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Under Review</p>
          <p className="mt-1 text-2xl font-black text-amber-700">{underReviewCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-600">Interviews & Shortlists</p>
          <p className="mt-1 text-2xl font-black text-purple-700">{shortlistedCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Selected</p>
          <p className="mt-1 text-2xl font-black text-emerald-700">{selectedCount}</p>
        </div>
      </div>

      {/* ── Filter Tabs & Search Bar ── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          {['All', 'Active', 'Applied', 'Under Review', 'Selected', 'Rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                filterStatus === status
                  ? 'bg-[#0066FF] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:border-[#0066FF] hover:text-[#0066FF]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company or role..."
            className="w-full h-9 pl-9 pr-8 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0066FF] focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Applications List ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-2xl border border-slate-200/80 bg-white p-5 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center space-y-3">
          <AlertCircle size={28} className="text-red-500 mx-auto" />
          <p className="text-sm font-semibold text-red-800">{error}</p>
          <button
            onClick={fetchApplications}
            className="rounded-xl bg-[#0066FF] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#0066FF] mb-4">
            <Briefcase size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {searchQuery || filterStatus !== 'All' ? 'No matching applications' : 'No applications submitted yet'}
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            {searchQuery || filterStatus !== 'All'
              ? 'Try changing or clearing your search filters.'
              : 'Browse our latest internships, jobs, and hackathons to apply and kickstart your career.'}
          </p>

          <button
            onClick={() => {
              if (onNavigateToOpportunities) {
                onNavigateToOpportunities();
              } else {
                navigate('/dashboard');
              }
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0066FF] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Sparkles size={14} />
            Explore Opportunities
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApplications.map((app) => {
            const statusConfig = STATUS_CONFIG[app.status] || STATUS_CONFIG['Applied'];
            const companyName = app.company || app.company_name || 'Organization';
            const oppTitle = app.title || app.opportunity_title || app.role || 'Position';
            const appliedDate = formatDate(app.applied_at || app.created_at);
            const canWithdraw = app.status === 'Applied';

            return (
              <div
                key={app.id}
                className="group relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs transition hover:border-[#0066FF]/40 hover:shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left Info */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EBF3FF] border border-blue-100 font-extrabold text-[#0066FF] text-lg overflow-hidden">
                      {app.logo ? (
                        <img src={app.logo} alt={companyName} className="h-full w-full object-contain p-1" />
                      ) : (
                        companyName.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
                          {oppTitle}
                        </h3>
                        {app.type && (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            {app.type}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 size={13} className="text-slate-400" />
                          {companyName}
                        </span>

                        {app.location && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <MapPin size={13} className="text-slate-400" />
                              {app.location}
                            </span>
                          </>
                        )}

                        {appliedDate && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Calendar size={13} className="text-slate-400" />
                              Applied {appliedDate}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Status & Actions */}
                  <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
                    {/* Status Pill */}
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusConfig.className}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotColor}`} />
                      {statusConfig.label}
                    </span>

                    {/* View Details Button */}
                    {app.opportunity_id && (
                      <button
                        onClick={() => handleViewDetails(app.opportunity_id)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
                      >
                        Details
                      </button>
                    )}

                    {/* Withdraw Button */}
                    {canWithdraw && (
                      <button
                        onClick={() => handleWithdraw(app.id, oppTitle)}
                        title="Withdraw Application"
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Opportunity Details Modal ── */}
      {selectedOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100">
            <button
              onClick={() => setSelectedOpp(null)}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={18} />
            </button>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EBF3FF] border border-blue-100 text-xl font-black text-[#0066FF]">
                  {selectedOpp.company ? selectedOpp.company.charAt(0).toUpperCase() : 'O'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedOpp.title}</h2>
                  <p className="text-sm font-semibold text-slate-500">{selectedOpp.company}</p>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-2xl bg-slate-50 p-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-400 uppercase">Type</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedOpp.type || 'Opportunity'}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 uppercase">Mode</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedOpp.mode || (selectedOpp.is_remote ? 'Remote' : 'On-site')}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 uppercase">Stipend / Salary</span>
                  <p className="font-bold text-emerald-700 mt-0.5">{selectedOpp.stipend || selectedOpp.salary || 'Competitive'}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 uppercase">Deadline</span>
                  <p className="font-bold text-slate-800 mt-0.5">{formatDate(selectedOpp.deadline) || 'Ongoing'}</p>
                </div>
              </div>

              {/* Description */}
              {selectedOpp.description && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Description
                  </h4>
                  <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                    {selectedOpp.description}
                  </p>
                </div>
              )}

              {/* Required Skills */}
              {Array.isArray(selectedOpp.required_skills) && selectedOpp.required_skills.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Skills Required
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedOpp.required_skills.map((skill) => (
                      <span key={skill} className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#0066FF] border border-blue-100">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedOpp(null)}
                  className="rounded-xl bg-slate-100 px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}