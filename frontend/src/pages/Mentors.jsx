import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { formatTime, formatDateTime } from '../utils/dateUtils';
import api from '../api/axios';
import { showAlert, showConfirm } from '../utils/uiUtils';
import Loader from '../components/common/Loader';
import { Star, MessageSquare, Heart, Clock, Search } from 'lucide-react';

const MentorReviewsModal = ({ mentor, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState({ rating: 5, feedback: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [mentor.id]);

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/mentor-reviews/mentor/${mentor.id}`);
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.feedback) return;
    try {
      setSubmitting(true);
      await api.post(`/mentor-reviews/mentor/${mentor.id}`, newReview);
      showAlert('Review submitted successfully!', 'success');
      setNewReview({ rating: 5, feedback: '' });
      fetchReviews();
    } catch (err) {
      showAlert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-[#0f0f11] border border-white/10 rounded-2xl shadow-2xl p-6 max-h-[90vh] flex flex-col">
        
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xl text-primary">
              {mentor.profile_photo ? <img src={mentor.profile_photo} alt="" className="w-full h-full object-cover rounded-full" /> : mentor.name?.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{mentor.name}</h3>
              <p className="text-sm text-gray-400">Reviews & Ratings</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No reviews yet for this mentor.</div>
          ) : (
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="bg-white/5 border border-white/10 p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-white">{r.student_name}</span>
                    <span className="text-primary font-bold text-sm">★ {r.rating}</span>
                  </div>
                  <p className="text-sm text-gray-300">{r.feedback}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-white/10 pt-6">
          <h4 className="text-sm font-bold text-white mb-3">Leave a Review</h4>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center gap-4">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rating</label>
              <select 
                value={newReview.rating} 
                onChange={e => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                className="bg-[#12121A] border border-white/10 rounded-lg px-3 py-1 text-white text-sm focus:border-primary focus:outline-none"
              >
                {[5, 4.5, 4, 3.5, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
              </select>
            </div>
            <textarea 
              value={newReview.feedback}
              onChange={e => setNewReview({ ...newReview, feedback: e.target.value })}
              placeholder="Share your experience..."
              required
              rows={2}
              className="w-full bg-[#12121A] border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-primary resize-none"
            />
            <button type="submit" disabled={submitting} className="w-full btn-primary py-2 text-sm">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const BookingModal = ({ mentor, onClose, onConfirm }) => {
  const [dateTime, setDateTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [mode, setMode] = useState('Online');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dateTime || !topic) return;
    setLoading(true);
    await onConfirm(mentor.id, dateTime, duration, mode, topic);
    setLoading(false);
  };

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const minDateTime = now.toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-md glass-panel rounded-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xl border border-primary/20">
            {mentor.name?.charAt(0) || 'M'}
          </div>
          <div>
            <h3 className="text-white font-bold text-xl">Book a Session</h3>
            <p className="text-primary text-sm font-semibold">{mentor.name}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Select Date & Time <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={dateTime}
              min={minDateTime}
              required
              onChange={e => setDateTime(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all [color-scheme:dark]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Duration <span className="text-red-400">*</span>
              </label>
              <select
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all [color-scheme:dark]"
              >
                <option className="bg-gray-900" value="30">30 Minutes</option>
                <option className="bg-gray-900" value="60">60 Minutes</option>
                <option className="bg-gray-900" value="90">90 Minutes</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Meeting Mode <span className="text-red-400">*</span>
              </label>
              <select
                value={mode}
                onChange={e => setMode(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all [color-scheme:dark]"
              >
                <option className="bg-gray-900" value="Online">Online (Video Call)</option>
                <option className="bg-gray-900" value="Offline">Offline (In-Person)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Discussion Topic <span className="text-red-400">*</span>
            </label>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Career guidance, Resume review, React best practices..."
              rows={3}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white px-5 py-2.5 font-semibold text-sm transition-colors rounded-xl hover:bg-white/5">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !dateTime}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Booking...</>
            ) : 'Confirm Booking'}
          </button>
        </div>
      </form>
    </div>
  );
};
const QueryModal = ({ mentors = [], onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technical');
  const [priority, setPriority] = useState('Medium');
  const [targetMentorId, setTargetMentorId] = useState('auto');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) return;
    setLoading(true);
    await onSubmit({ title, description, category, priority, target_mentor_id: targetMentorId });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-lg glass-panel rounded-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto mx-4">
        <h3 className="text-white font-bold text-xl mb-6">Submit a Mentor Query</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Topic / Title *</label>
            <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary" placeholder="e.g. Help with React useEffect" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Category *</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary [color-scheme:dark]">
                <option className="bg-gray-900" value="Technical">Technical</option>
                <option className="bg-gray-900" value="Career Guidance">Career Guidance</option>
                <option className="bg-gray-900" value="General">General</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Priority *</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary [color-scheme:dark]">
                <option className="bg-gray-900" value="Low">Low</option>
                <option className="bg-gray-900" value="Medium">Medium</option>
                <option className="bg-gray-900" value="High">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Target Mentor *</label>
            <select value={targetMentorId} onChange={e => setTargetMentorId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary [color-scheme:dark]">
              <option className="bg-gray-900" value="auto">Automatic Assignment (Fastest)</option>
              {mentors.map(m => (
                <option className="bg-gray-900" key={m.id} value={m.id}>{m.name} - {m.expertise?.join(', ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Description *</label>
            <textarea required rows={4} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white resize-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Describe your problem or question in detail..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-white/10">
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white px-5 py-2">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Submitting...' : 'Submit Query'}</button>
        </div>
      </form>
    </div>
  );
};

const QueriesView = ({ showToast, mentors }) => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchQueries = useCallback(async () => {
    try {
      const res = await api.get('/mentor-queries');
      setQueries(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQueries(); }, [fetchQueries]);

  const handleSubmitQuery = async (data) => {
    try {
      await api.post('/mentor-queries', data);
      showToast('Query submitted successfully! A mentor has been assigned.', 'success');
      setShowModal(false);
      fetchQueries();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error submitting query', 'error');
    }
  };

  const handleCloseQuery = async (id) => {
    if (!await showConfirm('Are you sure you want to close this query?')) return;
    try {
      await api.put(`/mentor-queries/${id}/status`, { status: 'Closed' });
      showToast('Query closed.', 'success');
      fetchQueries();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error closing query', 'error');
    }
  };

  if (loading) return <div className="text-center py-12"><Loader message="Loading queries..." /></div>;

  return (
    <div className="relative z-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">My Queries</h2>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm px-4 py-2">+ Ask Mentor</button>
      </div>

      {showModal && <QueryModal mentors={mentors} onClose={() => setShowModal(false)} onSubmit={handleSubmitQuery} />}

      <div className="space-y-4">
        {queries.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl relative overflow-hidden text-center flex flex-col items-center justify-center min-h-[350px]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-xl relative z-10 transform transition-transform hover:scale-105">
              💬
            </div>
            <h3 className="text-xl font-bold text-white mb-2 relative z-10">No Queries Yet</h3>
            <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto relative z-10">
              Need help with a project or career advice? Ask our mentors anything and get expert guidance.
            </p>
            <button onClick={() => setShowModal(true)} className="btn-primary py-3 px-8 text-sm font-bold shadow-[0_0_20px_rgba(32,21,255,0.3)] relative z-10">
              Ask a Mentor
            </button>
          </div>
        ) : queries.map(q => (
          <div key={q.id} className="glass-card p-5 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full pointer-events-none ${
              q.status === 'Closed' ? 'bg-gray-500/10' :
              q.status === 'Escalated' ? 'bg-red-500/10' :
              q.status === 'Answered' ? 'bg-green-500/10' : 'bg-primary/10'
            }`} />
            
            <div className="flex justify-between items-start mb-3 relative z-10">
              <h3 className="font-bold text-lg">{q.title}</h3>
              <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded border ${
                q.status === 'Closed' ? 'text-gray-400 border-gray-500/30 bg-gray-500/10' :
                q.status === 'Escalated' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                q.status === 'Answered' ? 'text-green-400 border-green-500/30 bg-green-500/10' :
                'text-primary border-primary/30 bg-primary/10'
              }`}>{q.status}</span>
            </div>
            <div className="flex items-center gap-2 mb-3 relative z-10">
              {q.category && (
                <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400 uppercase tracking-widest">{q.category}</span>
              )}
              {q.priority && (
                <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${
                  q.priority === 'High' ? 'text-red-400 bg-red-500/10 border border-red-500/20' :
                  q.priority === 'Medium' ? 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20' :
                  'text-green-400 bg-green-500/10 border border-green-500/20'
                }`}>{q.priority} Priority</span>
              )}
            </div>
            
            <p className="text-sm text-gray-300 mb-4 whitespace-pre-wrap relative z-10">{q.description}</p>

            {q.answer && (
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl mb-4 relative z-10">
                <p className="text-[10px] text-primary uppercase font-bold tracking-widest mb-1">Mentor's Response</p>
                <p className="text-sm text-gray-200 whitespace-pre-wrap">{q.answer}</p>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-4 border-t border-white/10 relative z-10">
              <div className="text-[10px] text-gray-500 font-mono">
                Session: {q.session_id} • Assigned: {q.status !== 'Submitted' ? 'Yes' : 'No'}
                {q.deadline_at && q.status !== 'Closed' && q.status !== 'Answered' && (
                  <span className="ml-2 text-yellow-500 block sm:inline">
                    (SLA: {formatTime(q.deadline_at)})
                  </span>
                )}
              </div>
              {q.status !== 'Closed' && (
                <button onClick={() => handleCloseQuery(q.id)} className="text-xs text-red-400 hover:text-red-300">Close Query</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


const Mentors = () => {
  const [activeTab, setActiveTab] = useState('discover'); // 'discover' | 'sessions' | 'queries'
  const [mentors, setMentors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionFilter, setSessionFilter] = useState('All'); // 'All' | 'Scheduled' | 'Completed' | 'Cancelled'
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [bookingMentor, setBookingMentor] = useState(null);
  const [reviewMentor, setReviewMentor] = useState(null);
  const [aiRecommended, setAiRecommended] = useState(null);
  const [followingMap, setFollowingMap] = useState({});
  
  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState('All');
  
  // Extract all unique expertise categories from mentors
  const allExpertise = ['All', ...new Set(mentors.flatMap(m => m.expertise || []))];

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 4000);
  };

  const fetchMentorsAndSessions = useCallback(async () => {
    setLoading(true);
    try {
      const [mentorsRes, sessionsRes, aiRes] = await Promise.all([
        api.get('/mentors'),
        api.get('/mentors/my-sessions').catch(() => ({ data: [] })),
        api.get('/mentors/ai-recommend').catch(() => ({ data: { recommended: null } }))
      ]);
      setMentors(mentorsRes.data);
      setSessions(sessionsRes.data || []);
      setAiRecommended(aiRes.data?.recommended || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMentorsAndSessions(); }, [fetchMentorsAndSessions]);

  const handleConfirmBooking = async (mentorId, scheduledTime, duration, mode, topic) => {
    try {
      await api.post(`/mentors/${mentorId}/book`, {
        scheduled_time: scheduledTime,
        duration,
        mode,
        topic,
      });
      showToast('✨ Session booked! The mentor will reach out to you.', 'success');
      setBookingMentor(null);
      fetchMentorsAndSessions(); // Refresh sessions
      setActiveTab('sessions'); // Switch to sessions tab instantly
    } catch (err) {
      showToast(err.response?.data?.message || 'Error booking session.', 'error');
    }
  };

  const handleFollow = async (mentorId) => {
    try {
      const res = await api.post(`/mentors/${mentorId}/follow`);
      setFollowingMap(prev => ({
        ...prev,
        [mentorId]: res.data.isFollowing
      }));
      showToast(res.data.message, 'success');
    } catch (err) {
      showToast('Error following mentor', 'error');
    }
  };

  const filteredMentors = mentors.filter(m => {
    const matchesSearch = !searchTerm || m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || m.expertise?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesExpertise = selectedExpertise === 'All' || (m.expertise && m.expertise.includes(selectedExpertise));
    return matchesSearch && matchesExpertise;
  });

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <Loader fullScreen={false} message="Loading Mentors..." />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto text-white relative z-10">
      {toast.msg && (
        <div className={`fixed top-4 right-4 z-50 glass-panel px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold ${
          toast.type === 'success' ? 'text-green-400 border-green-500/30' : 'text-red-400 border-red-500/30'
        }`}>
          {toast.msg}
        </div>
      )}

      {bookingMentor && (
        <BookingModal
          mentor={bookingMentor}
          onClose={() => setBookingMentor(null)}
          onConfirm={handleConfirmBooking}
        />
      )}

      {reviewMentor && (
        <MentorReviewsModal
          mentor={reviewMentor}
          onClose={() => setReviewMentor(null)}
        />
      )}

      {/* Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 relative z-10">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 bg-gradient-to-r from-blue-500/10 to-transparent border-blue-500/20">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-2xl">👨‍🏫</div>
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Available Mentors</p>
            <p className="text-2xl font-black text-white">{mentors.length}</p>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 bg-gradient-to-r from-purple-500/10 to-transparent border-purple-500/20">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-2xl">📅</div>
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">My Sessions</p>
            <p className="text-2xl font-black text-white">{sessions.length}</p>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 bg-gradient-to-r from-green-500/10 to-transparent border-green-500/20">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-2xl">⚡</div>
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Completed</p>
            <p className="text-2xl font-black text-white">{sessions.filter(s => s.status === 'Completed').length}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
             <span className="text-gradient">Mentorship Hub</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Book 1-on-1 sessions, raise queries, and manage your learning journey.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 mb-8 overflow-x-auto no-scrollbar relative z-10">
        <button
          onClick={() => setActiveTab('discover')}
          className={`px-6 py-4 font-semibold text-sm transition-all whitespace-nowrap flex items-center gap-2 border-b-2 ${
            activeTab === 'discover' 
              ? 'border-primary text-white bg-primary/5' 
              : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>🔍</span> Discover Mentors
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-6 py-4 font-semibold text-sm transition-all whitespace-nowrap flex items-center gap-2 border-b-2 ${
            activeTab === 'sessions' 
              ? 'border-primary text-white bg-primary/5' 
              : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>📅</span> My Sessions ({sessions.length})
        </button>
        <button
          onClick={() => setActiveTab('queries')}
          className={`px-6 py-4 font-semibold text-sm transition-all whitespace-nowrap flex items-center gap-2 border-b-2 ${
            activeTab === 'queries' 
              ? 'border-primary text-white bg-primary/5' 
              : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>💬</span> Queries & Support
        </button>
      </div>

      {activeTab === 'discover' && (
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <select
              value={selectedExpertise}
              onChange={e => setSelectedExpertise(e.target.value)}
              className="w-full md:w-64 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none [color-scheme:dark]"
            >
              {allExpertise.map(exp => (
                <option className="bg-gray-900" key={exp} value={exp}>{exp}</option>
              ))}
            </select>
          </div>

          {/* AI Recommended Mentor Banner */}
          {aiRecommended && !searchTerm && selectedExpertise === 'All' && (
            <div className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-3xl border-2 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)] shrink-0">
                    {aiRecommended.profile_photo ? <img loading="lazy" src={aiRecommended.profile_photo} alt={aiRecommended.name} className="w-full h-full object-cover rounded-full" /> : aiRecommended.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      AI Recommended Mentor
                    </h3>
                    <h2 className="text-2xl font-bold text-white mb-1">{aiRecommended.name}</h2>
                    <p className="text-sm text-gray-300 font-semibold">{aiRecommended.designation || 'Senior Developer'} @ {aiRecommended.company || 'Tech Corp'} • {aiRecommended.years_of_experience || '5+'} yrs experience</p>
                    <p className="text-xs text-purple-300/80 mt-2 max-w-xl italic">"{aiRecommended.ai_reasoning}"</p>
                  </div>
                </div>
                <button
                  onClick={() => setBookingMentor(aiRecommended)}
                  className="btn-primary whitespace-nowrap shadow-[0_0_20px_rgba(168,85,247,0.3)] shrink-0 px-6 py-3"
                >
                  Book Session
                </button>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMentors.length === 0 ? (
              <div className="col-span-full glass-panel p-12 rounded-3xl relative overflow-hidden text-center flex flex-col items-center justify-center min-h-[350px]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-xl relative z-10 transform transition-transform hover:scale-105">
                  👥
                </div>
                <h3 className="text-xl font-bold text-white mb-2 relative z-10">No Mentors Found</h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto relative z-10">
                  {mentors.length === 0 ? 'No mentors are available right now. Please check back later.' : 'No mentors match your search criteria. Try adjusting your filters.'}
                </p>
              </div>
            ) : filteredMentors.map(m => (
              <div key={m.id} className="glass-card p-6 flex flex-col group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-[100px] pointer-events-none transition-transform duration-500 group-hover:scale-125 group-hover:bg-primary/20" />

                <button 
                  onClick={() => handleFollow(m.id)}
                  className={`absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    followingMap[m.id] ? 'bg-pink-500/20 text-pink-500' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Heart size={16} className={followingMap[m.id] ? 'fill-pink-500' : ''} />
                </button>

                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-2xl border border-primary/20 shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform shrink-0">
                    {m.profile_photo ? <img loading="lazy" decoding="async" src={m.profile_photo} alt={m.name} className="w-full h-full object-cover rounded-full" /> : m.name?.charAt(0) || 'M'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">{m.name}</h2>
                    <p className="text-[12px] text-gray-400 mt-0.5">{m.designation || 'Senior Software Engineer'} @ {m.company || 'Tech Corp'}</p>
                    <p className="text-[10px] text-primary uppercase font-bold tracking-widest mt-1 bg-primary/10 inline-block px-2 py-0.5 rounded">
                      {m.hourly_rate > 0 ? `₹${m.hourly_rate}/hr` : 'Volunteer / Free'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 mb-4 text-xs font-semibold text-gray-300 relative z-10 border-y border-white/5 py-3">
                  <div 
                    onClick={() => setReviewMentor(m)}
                    className="flex flex-col items-center flex-1 border-r border-white/5 cursor-pointer hover:bg-white/5 rounded-lg transition-colors py-1"
                  >
                    <span className="text-primary text-sm font-black">{m.rating || '4.9'}⭐</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Reviews</span>
                  </div>
                  <div className="flex flex-col items-center flex-1 border-r border-white/5">
                    <span className="text-white text-sm font-black">{m.years_of_experience || '5+'} yrs</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Experience</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <span className="text-green-400 text-sm font-black">{m.free_sessions_left || '3'} left</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Free Sessions</span>
                  </div>
                </div>

                <div className="mb-4 relative z-10 flex items-center justify-between">
                   <div className="flex gap-2">
                     {(m.languages || ['English', 'Hindi']).map(lang => (
                       <span key={lang} className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                         🗣️ {lang}
                       </span>
                     ))}
                   </div>
                   <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                     🟢 {m.availability || 'Available Now'}
                   </span>
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2 relative z-10 flex-1">{m.bio}</p>

                <div className="flex flex-wrap gap-2 mb-6 relative z-10 mt-auto">
                  {(m.expertise || []).map(skill => (
                    <span key={skill} className="bg-white/5 border border-white/10 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-widest text-gray-300">
                      {skill}
                    </span>
                  ))}
                </div>

                {(() => {
                  const hasBooked = sessions.some(s => s.mentor_id === m.id && s.status !== 'Completed' && s.status !== 'Cancelled');
                  return hasBooked ? (
                    <button disabled className="mt-auto py-3 bg-white/10 text-white font-bold rounded-xl w-full relative z-10 flex items-center justify-center gap-2 opacity-50 cursor-not-allowed border border-white/5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Session Booked
                    </button>
                  ) : (
                    <button
                      onClick={() => setBookingMentor(m)}
                      className="mt-auto btn-primary w-full shadow-lg group-hover:shadow-primary/30 relative z-10 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Book Session
                    </button>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="relative z-10">
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
            {['All', 'Scheduled', 'Completed', 'Cancelled'].map(filter => (
              <button
                key={filter}
                onClick={() => setSessionFilter(filter)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
                  sessionFilter === filter ? 'bg-primary text-black' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {filter === 'Scheduled' ? 'Upcoming' : filter}
              </button>
            ))}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.filter(s => sessionFilter === 'All' || s.status === sessionFilter).length === 0 ? (
              <div className="col-span-full glass-panel p-12 rounded-3xl relative overflow-hidden text-center flex flex-col items-center justify-center min-h-[350px]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-xl relative z-10 transform transition-transform hover:scale-105">
                  📅
                </div>
                <h3 className="text-xl font-bold text-white mb-2 relative z-10">No Sessions Found</h3>
                <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto relative z-10">
                  You don't have any sessions in this category. Book a session with a mentor to accelerate your growth.
                </p>
                <button onClick={() => setActiveTab('discover')} className="btn-primary py-3 px-8 text-sm font-bold shadow-[0_0_20px_rgba(32,21,255,0.3)] relative z-10">
                  Discover Mentors
                </button>
              </div>
            ) : sessions.filter(s => sessionFilter === 'All' || s.status === sessionFilter).map(s => (
              <div key={s.id} className="glass-card p-6 flex flex-col group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full pointer-events-none transition-transform group-hover:scale-125 ${
                  s.status === 'Scheduled' ? 'bg-blue-500/10' :
                  s.status === 'Completed' ? 'bg-green-500/10' :
                  s.status === 'Cancelled' ? 'bg-red-500/10' : 'bg-yellow-500/10'
                }`} />

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <h2 className="text-lg font-bold leading-tight">{s.mentor?.name || 'Unknown'}</h2>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap mt-2 inline-block ${
                      s.status === 'Scheduled' ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20' :
                      s.status === 'Completed' ? 'text-green-400 bg-green-500/10 border border-green-500/20' :
                      s.status === 'Cancelled' ? 'text-red-400 bg-red-500/10 border border-red-500/20' :
                      'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/5 text-gray-300 flex items-center justify-center font-bold text-lg border border-white/10 shrink-0">
                    {s.mentor?.name ? s.mentor.name.charAt(0) : '?'}
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-4 mb-4 border border-white/5 relative z-10">
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Scheduled Time</p>
                  <p className="text-white font-medium text-sm">
                    {formatDateTime(s.scheduled_time, {
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>

                {s.notes && (
                  <div className="mb-4 relative z-10">
                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Notes</p>
                    <p className="text-sm text-gray-300 line-clamp-2">{s.notes}</p>
                  </div>
                )}
                
                {s.meeting_link && (
                  <a href={s.meeting_link} target="_blank" rel="noreferrer" className="mt-auto w-full btn-secondary py-2 text-xs text-center border-primary/30 hover:border-primary">
                    Join Meeting
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'queries' && <QueriesView showToast={showToast} mentors={mentors} />}
    </div>
  );
};
export default Mentors;
