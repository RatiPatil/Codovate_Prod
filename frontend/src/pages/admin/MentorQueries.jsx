import { formatDate, formatTime, formatDateTime, parseDate, getISODate } from '../../utils/dateUtils';
import React, { useState, useEffect } from 'react';
import MentorLayout from '../../components/layouts/MentorLayout';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

const MentorQueries = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answeringId, setAnsweringId] = useState(null);
  const [answerText, setAnswerText] = useState('');
  
  const { socket } = useSocket();
  const { user } = useAuth();

  const fetchQueries = async () => {
    try {
      const res = await api.get('/mentor-queries');
      setQueries(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  useEffect(() => {
    if (!socket || !user) return;
    
    const handleNewQuery = (query) => {
      setQueries(prev => [query, ...prev]);
    };
    
    const handleQueryUpdate = (updatedQuery) => {
      setQueries(prev => prev.map(q => q.id === updatedQuery.id ? updatedQuery : q));
    };

    socket.on('new_query', handleNewQuery);
    socket.on('query_update', handleQueryUpdate);

    return () => {
      socket.off('new_query', handleNewQuery);
      socket.off('query_update', handleQueryUpdate);
    };
  }, [socket, user]);

  const updateStatus = async (id, status) => {
    try {
      const res = await api.put(`/mentor-queries/${id}/status`, { status, answer: answerText });
      setQueries(prev => prev.map(q => q.id === id ? res.data : q));
      setAnsweringId(null);
      setAnswerText('');
    } catch (err) {
      console.error(err);
      alert('Failed to update query status');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Assigned': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'In Progress': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case 'Answered': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Closed': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      case 'Escalated': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-white bg-white/10 border-white/20';
    }
  };

  return (
    <MentorLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">Student Queries</h1>
          <p className="text-gray-500 font-medium">Answer questions and help students grow.</p>
        </header>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : queries.length === 0 ? (
          <div className="bg-[#080812] border border-white/5 rounded-2xl p-12 text-center">
            <span className="text-4xl block mb-4">🙌</span>
            <h3 className="text-white font-bold mb-2">No queries assigned to you!</h3>
            <p className="text-gray-500 text-sm">You're all caught up. Take a break.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {queries.map(q => (
              <div key={q.id} className="bg-[#080812] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-bold text-lg">{q.title}</h3>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border ${getStatusColor(q.status)}`}>
                        {q.status}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{q.description}</p>
                    <p className="text-xs text-gray-600 mt-2">
                      From: <span className="text-gray-400">{q.student_name || 'Student'}</span> • {formatDateTime(q.created_at)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {q.status === 'Assigned' && (
                      <button onClick={() => updateStatus(q.id, 'In Progress')} className="px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 rounded-xl text-xs font-bold transition-colors">
                        Mark In Progress
                      </button>
                    )}
                    {(q.status === 'Assigned' || q.status === 'In Progress') && (
                      <button onClick={() => setAnsweringId(q.id)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-cyan-900/50">
                        Answer Query
                      </button>
                    )}
                  </div>
                </div>

                {/* Answer Form */}
                {answeringId === q.id && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Type your detailed answer here..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-cyan-500/50 focus:outline-none mb-3 min-h-[100px]"
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setAnsweringId(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-colors">
                        Cancel
                      </button>
                      <button onClick={() => updateStatus(q.id, 'Answered')} disabled={!answerText.trim()} className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
                        Submit Answer
                      </button>
                    </div>
                  </div>
                )}

                {/* Existing Answer */}
                {q.answer && (
                  <div className="mt-4 p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-xl">
                    <p className="text-xs text-cyan-400 font-bold uppercase tracking-widest mb-2">Your Answer:</p>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{q.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </MentorLayout>
  );
};

export default MentorQueries;
