import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { ExternalLink, CheckCircle, MessageSquare } from 'lucide-react';

const MentorProjects = () => {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const res = await api.get('/project-mentorships/mentor');
        setInvites(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvites();
  }, []);

  const handleReview = async (id, status) => {
    if (status === 'Reviewed' && !feedback) {
      return toast.error('Please provide feedback before reviewing.');
    }
    
    try {
      await api.put(`/project-mentorships/${id}/review`, { status, feedback });
      toast.success(`Project ${status.toLowerCase()} successfully!`);
      setInvites(invites.map(i => i.id === id ? { ...i, status, feedback } : i));
      setReviewingId(null);
      setFeedback('');
    } catch (err) {
      toast.error('Failed to update project status.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Project Mentorship</h1>
        <p className="text-gray-400">Review, guide, and approve student projects.</p>
      </div>

      {invites.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-gray-400 text-lg">No project invites yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {invites.map(invite => (
            <div key={invite.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{invite.project?.title || invite.project_title}</h3>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase ${
                      invite.status === 'Approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      invite.status === 'Reviewed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    }`}>
                      {invite.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">By <span className="text-white font-medium">{invite.student_name}</span></p>
                </div>
                <div className="flex gap-3">
                  {invite.project?.githubUrl && (
                    <a href={invite.project.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-white transition">
                      GitHub <ExternalLink size={14} />
                    </a>
                  )}
                  {invite.project?.liveUrl && (
                    <a href={invite.project.liveUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm bg-primary/20 hover:bg-primary/30 px-3 py-1.5 rounded-lg text-primary transition font-medium">
                      Live Demo <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>

              <div className="mb-6 bg-black/20 p-4 rounded-xl">
                <p className="text-sm text-gray-300"><span className="text-gray-500 font-bold uppercase tracking-wider text-xs mr-2">Message:</span> {invite.message}</p>
              </div>

              {invite.status === 'Pending' && reviewingId !== invite.id ? (
                <div className="flex gap-4 border-t border-white/10 pt-4 mt-4">
                  <button onClick={() => setReviewingId(invite.id)} className="flex items-center gap-2 text-sm font-bold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-4 py-2 rounded-lg transition">
                    <MessageSquare size={16} /> Provide Feedback
                  </button>
                  <button onClick={() => handleReview(invite.id, 'Approved')} className="flex items-center gap-2 text-sm font-bold bg-green-500/20 text-green-400 hover:bg-green-500/30 px-4 py-2 rounded-lg transition">
                    <CheckCircle size={16} /> Approve Project
                  </button>
                </div>
              ) : reviewingId === invite.id ? (
                <div className="border-t border-white/10 pt-4 mt-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Your Feedback</label>
                  <textarea rows={3} value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Provide guidance and review comments..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 mb-4 resize-none"></textarea>
                  <div className="flex gap-3">
                    <button onClick={() => setReviewingId(null)} className="text-sm font-bold bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition">Cancel</button>
                    <button onClick={() => handleReview(invite.id, 'Reviewed')} className="text-sm font-bold bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition shadow-lg shadow-blue-500/20">Submit Review</button>
                  </div>
                </div>
              ) : invite.feedback ? (
                <div className="border-t border-white/10 pt-4 mt-4">
                  <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-2 text-xs">Your Feedback</p>
                  <p className="text-sm text-blue-300 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">{invite.feedback}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentorProjects;
