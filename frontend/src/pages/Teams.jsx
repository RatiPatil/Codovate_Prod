import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/axios';
import { parseDate, formatTime } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';

const MembersModal = ({ team, onClose }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/teams/${team.id}/members`)
      .then(res => setMembers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [team.id]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-[90vw] md:w-full max-w-md glass-panel rounded-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white font-bold text-xl">{team.name}</h3>
            <p className="text-gray-400 text-sm mt-1">{team.member_count} members</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((m, i) => (
              <div key={m.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 shrink-0">
                  {m.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{m.name}</p>
                  <p className="text-gray-500 text-xs truncate">{m.email}</p>
                </div>
                {i === 0 && (
                  <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest shrink-0">Leader</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const DiscussionModal = ({ team, onClose, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  const fetchMessages = useCallback(() => {
    api.get(`/teams/${team.id}/discussions`)
      .then(res => setMessages(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [team.id]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Polling every 5s
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await api.post(`/teams/${team.id}/discussions`, { message: text });
      setMessages(prev => [...prev, res.data]);
      setText('');
    } catch (err) {
      console.error(err);
      alert('Failed to send message');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 lg:p-10">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-[95vw] md:w-full max-w-4xl h-[80vh] flex flex-col glass-panel rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/40">
          <div>
            <h3 className="text-white font-bold text-xl flex items-center gap-2">
              <span>💬</span> {team.name}
            </h3>
            <p className="text-gray-400 text-sm mt-1">Team Discussion Board</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
             <div className="flex justify-center py-8">
               <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
             </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((m, idx) => {
              const isMe = m.user_id === currentUser?.id;
              return (
                <div key={m.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                    isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-white/10 text-gray-200 rounded-bl-sm'
                  }`}>
                    {!isMe && <p className="text-xs font-bold text-gray-400 mb-1">{m.user_name}</p>}
                    <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 px-1">
                    {formatTime(m.created_at)}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10 bg-black/40">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button type="submit" disabled={!text.trim()} className="bg-primary text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
const PrivateChatModal = ({ connection, currentUser, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [expired, setExpired] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get(`/networking/chats/${connection.id}`);
      setMessages(res.data);
    } catch (err) {
      if (err.response?.data?.expired) {
        setExpired(true);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [connection.id]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || expired) return;
    try {
      const res = await api.post(`/networking/chats/${connection.id}/messages`, { text });
      setMessages(prev => [...prev, res.data]);
      setText('');
    } catch (err) {
      if (err.response?.status === 403) setExpired(true);
      console.error(err);
      alert(err.response?.data?.message || 'Failed to send message');
    }
  };

  const expiresDate = parseDate(connection.chat_expires_at);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 lg:p-10">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-[95vw] md:w-full max-w-4xl h-[80vh] flex flex-col glass-panel rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/40">
          <div>
            <h3 className="text-white font-bold text-xl flex items-center gap-2">
              <span>💬</span> Chat with {connection.other_user?.name}
            </h3>
            <p className={`text-sm mt-1 font-bold ${expired ? 'text-red-400' : 'text-yellow-400'}`}>
              {expired ? 'Chat has expired (24h limit reached).' : `Expires at: ${expiresDate.toLocaleString()}`}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
             <div className="flex justify-center py-8">
               <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
             </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No messages yet. Say hello before the 24 hours run out!
            </div>
          ) : (
            messages.map((m, idx) => {
              const isMe = m.sender_id === currentUser?.id;
              return (
                <div key={m.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                    isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-white/10 text-gray-200 rounded-bl-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 px-1">
                    {formatTime(m.created_at || Date.now())}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-white/10 bg-black/40">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={expired ? "Chat expired." : "Type your message..."}
              disabled={expired}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            <button type="submit" disabled={!text.trim() || expired} className="bg-primary text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const ConnectionsView = ({ currentUser }) => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);

  const fetchConnections = useCallback(async () => {
    try {
      const res = await api.get('/networking/connections');
      setConnections(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  const handleAction = async (id, action) => {
    try {
      await api.put(`/networking/connect/${id}`, { action });
      fetchConnections();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing request');
    }
  };

  if (loading) return <div className="text-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6">
      {activeChat && <PrivateChatModal connection={activeChat} currentUser={currentUser} onClose={() => setActiveChat(null)} />}
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <div>
          <h3 className="text-lg font-bold mb-4">Incoming Requests</h3>
          <div className="space-y-3">
            {connections.filter(c => c.status === 'pending' && c.receiver_id === currentUser?.id).length === 0 ? (
              <p className="text-sm text-gray-500">No incoming requests.</p>
            ) : connections.filter(c => c.status === 'pending' && c.receiver_id === currentUser?.id).map(c => (
              <div key={c.id} className="glass-card p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-bold">{c.other_user?.name}</h4>
                  <p className="text-xs text-gray-400">{c.other_user?.college}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction(c.id, 'accept')} className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-xs font-bold hover:bg-green-500/30">Accept</button>
                  <button onClick={() => handleAction(c.id, 'reject')} className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs font-bold hover:bg-red-500/30">Reject</button>
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-bold mt-8 mb-4">Sent Requests</h3>
          <div className="space-y-3">
            {connections.filter(c => c.status === 'pending' && c.sender_id === currentUser?.id).length === 0 ? (
              <p className="text-sm text-gray-500">No sent requests.</p>
            ) : connections.filter(c => c.status === 'pending' && c.sender_id === currentUser?.id).map(c => (
              <div key={c.id} className="glass-card p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-bold">{c.other_user?.name}</h4>
                  <p className="text-xs text-gray-400">Waiting for response...</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Chats */}
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            Active Chats <span className="text-xs font-normal text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">24h Limit</span>
          </h3>
          <div className="space-y-3">
            {connections.filter(c => c.status === 'accepted').length === 0 ? (
              <p className="text-sm text-gray-500">No active chats.</p>
            ) : connections.filter(c => c.status === 'accepted').map(c => {
              const expiresDate = parseDate(c.chat_expires_at);
              const isExpired = new Date() > expiresDate;

              return (
                <div key={c.id} className="glass-card p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold">{c.other_user?.name}</h4>
                    <p className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${isExpired ? 'text-red-400' : 'text-primary'}`}>
                      {isExpired ? 'Expired' : 'Active'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveChat(c)}
                    disabled={isExpired}
                    className="btn-primary py-1.5 px-4 text-xs shadow-none"
                  >
                    Open Chat
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const MatchFinder = ({ results, onConnect }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardRefs = useRef([]);

  const handleAction = (direction, userId, idx) => {
    const card = cardRefs.current[idx];
    if (!card) return;

    import('gsap').then(({ gsap }) => {
      gsap.to(card, {
        x: direction === 'right' ? 300 : -300,
        y: 50,
        rotation: direction === 'right' ? 15 : -15,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => {
          if (direction === 'right') onConnect(userId);
          setCurrentIndex(prev => prev + 1);
        }
      });
    });
  };

  if (currentIndex >= results.length) {
    return (
      <div className="text-center py-24 glass-panel rounded-2xl border-dashed h-[500px] flex flex-col items-center justify-center">
        <p className="text-5xl mb-4">🌟</p>
        <p className="text-gray-300 text-lg font-bold">You've seen all potential teammates!</p>
        <p className="text-gray-500 text-sm mt-2">Adjust filters to find more.</p>
        <button onClick={() => setCurrentIndex(0)} className="mt-6 btn-secondary text-xs px-6 py-2">Start Over</button>
      </div>
    );
  }

  return (
    <div className="relative h-[500px] w-full max-w-md mx-auto" style={{ perspective: '1000px' }}>
      {results.map((user, idx) => {
        if (idx < currentIndex) return null;
        if (idx > currentIndex + 2) return null; // Only render top 3 for performance

        const isTop = idx === currentIndex;
        const offset = idx - currentIndex;
        const scale = 1 - offset * 0.05;
        const translateY = offset * 20;
        const opacity = 1 - offset * 0.3;

        return (
          <div
            key={user.id}
            ref={el => cardRefs.current[idx] = el}
            className={`absolute top-0 left-0 w-full h-full glass-card flex flex-col transition-all duration-300 ease-out overflow-hidden`}
            style={{
              transform: `translateY(${translateY}px) scale(${scale})`,
              opacity,
              zIndex: 10 - offset,
              boxShadow: isTop ? '0 25px 50px -12px rgba(32,21,255,0.25)' : 'none'
            }}
          >
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide flex flex-col items-center text-center">
              {/* Profile Photo */}
              <div className="w-24 h-24 shrink-0 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-4xl shadow-xl mb-4 border-4 border-white/10">
                {user.name?.charAt(0).toUpperCase() || '?'}
              </div>
              
              {/* Name & Desired Role */}
              <h2 className="text-2xl font-bold text-white mb-2">{user.name}</h2>
              <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                {user.desired_roles?.length > 0 ? (
                  user.desired_roles.slice(0, 2).map(r => (
                    <span key={r} className="px-2.5 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-[10px] font-bold uppercase tracking-wider">{r}</span>
                  ))
                ) : (
                  <span className="px-2.5 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {user.career_goal ? user.career_goal.replace('_', ' ') : 'Open to roles'}
                  </span>
                )}
              </div>

              {/* College, Year, Location */}
              <div className="text-gray-400 text-xs mb-4 space-y-1">
                <p>{user.college || 'College not specified'} {user.year && `• Year ${user.year}`}</p>
                {(user.district || user.state) && (
                  <p className="flex items-center justify-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {user.district && `${user.district}, `}{user.state}
                  </p>
                )}
              </div>
              
              {user.bio && <p className="text-sm text-gray-300 mb-6 italic">"{user.bio}"</p>}

              {/* Attributes Chips Sections */}
              <div className="w-full space-y-4 text-left">
                {/* Skills */}
                {user.skills?.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {user.skills.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-xs text-gray-300">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Achievements */}
                {user.achievements?.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Achievements</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {user.achievements.map(a => (
                        <span key={a} className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 rounded-md text-xs">🏆 {a}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seeking */}
                {user.seeking?.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Seeking</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {user.seeking.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-md text-xs">🤝 {s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Passionate About */}
                {user.passionate_about?.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Passionate About</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {user.passionate_about.map(p => (
                        <span key={p} className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-md text-xs">❤️ {p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {isTop && (
              <div className="flex justify-center gap-4 mt-auto p-4 border-t border-white/5 bg-black/20">
                <button
                  onClick={() => handleAction('left', user.id, idx)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-red-400 font-bold text-sm hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  Dismiss
                </button>
                <button
                  onClick={() => handleAction('right', user.id, idx)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/20 border border-primary/40 text-primary font-bold text-sm hover:bg-primary/30 hover:text-white transition-all shadow-[0_0_15px_rgba(32,21,255,0.2)]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Connect
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const FindTeammates = () => {
  const [filters, setFilters] = useState({ skill: '', domain: '', experience: '' });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDiscover = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await api.get(`/networking/discover?${params}`);
      setResults(res.data);
    } catch (err) {
      console.error("Discover error", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDiscover();
  }, [fetchDiscover]);

  const handleConnect = async (receiverId) => {
    try {
      await api.post('/networking/connect', { receiver_id: receiverId });
      alert('Connection request sent!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error sending request');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Sidebar Filters */}
      <div className="w-full lg:w-1/4 glass-panel p-6 rounded-2xl h-fit">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <span>🎯</span> Advanced Filters
        </h3>
        
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Skill</label>
            <input 
              placeholder="e.g. React" 
              className="input-glass w-full"
              value={filters.skill}
              onChange={e => setFilters({...filters, skill: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Domain / Goal</label>
            <input 
              placeholder="e.g. Data Science" 
              className="input-glass w-full"
              value={filters.domain}
              onChange={e => setFilters({...filters, domain: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Experience Level</label>
            <select 
              className="input-glass w-full appearance-none"
              value={filters.experience}
              onChange={e => setFilters({...filters, experience: e.target.value})}
            >
              <option value="" className="bg-[#0a0a0a]">All</option>
              <option value="beginner" className="bg-[#0a0a0a]">Beginner</option>
              <option value="intermediate" className="bg-[#0a0a0a]">Intermediate</option>
              <option value="advanced" className="bg-[#0a0a0a]">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="w-full lg:w-3/4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-24 glass-panel rounded-2xl border-dashed">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-gray-400 text-sm">No teammates found matching your criteria.</p>
          </div>
        ) : (
          <MatchFinder results={results} onConnect={handleConnect} />
        )}
      </div>
    </div>
  );
};

const SuggestedMates = ({ myProfile }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        const res = await api.get('/networking/discover');
        let students = res.data;
        
        // Smart match score computation (Mock complex algorithm based on shared attributes)
        if (myProfile) {
          students = students.map(s => {
            let matchScore = 20; // Base score
            
            // Shared Skills
            const sharedSkills = s.skills?.filter(sk => myProfile.skills?.includes(sk)).length || 0;
            matchScore += sharedSkills * 8;
            
            // Shared Roles (or Career Goal fallback)
            if (s.desired_roles && myProfile.desired_roles) {
              const sharedRoles = s.desired_roles.filter(r => myProfile.desired_roles.includes(r)).length;
              matchScore += sharedRoles * 10;
            } else if (s.career_goal === myProfile.career_goal && s.career_goal) {
              matchScore += 15;
            }
            
            // Shared Seeking
            const sharedSeeking = s.seeking?.filter(se => myProfile.seeking?.includes(se)).length || 0;
            matchScore += sharedSeeking * 8;
            
            // Shared Passions
            const sharedPassions = s.passionate_about?.filter(p => myProfile.passionate_about?.includes(p)).length || 0;
            matchScore += sharedPassions * 8;
            
            // Academics & Experience
            if (s.college && s.college === myProfile.college) matchScore += 10;
            if (s.year && s.year === myProfile.year) matchScore += 5;
            if (s.experience_level && s.experience_level === myProfile.experience_level) matchScore += 5;

            return { ...s, matchScore: Math.min(matchScore, 99) };
          });
          students.sort((a, b) => b.matchScore - a.matchScore);
        }

        setResults(students);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggested();
  }, [myProfile]);

  const handleConnect = async (receiverId) => {
    try {
      await api.post('/networking/connect', { receiver_id: receiverId });
      alert('Connection request sent!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error sending request');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
        <span className="text-2xl">✨</span>
        <p className="text-sm text-primary font-medium">
          These teammates are recommended based on your skills, career goals, and experience level.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.slice(0, 9).map(user => (
          <div key={user.id} className="glass-card p-5 relative overflow-hidden flex flex-col">
            <div className="absolute top-2 right-2 flex flex-col items-center">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="24" cy="24" r="20" stroke="rgba(32,21,255,0.2)" strokeWidth="3" fill="none" />
                  <circle 
                    cx="24" 
                    cy="24" 
                    r="20" 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    fill="none" 
                    strokeDasharray="125.6" 
                    strokeDashoffset={125.6 - (125.6 * (user.matchScore || 85)) / 100} 
                    className="text-primary drop-shadow-[0_0_5px_rgba(32,21,255,0.8)] transition-all duration-1000"
                  />
                </svg>
                <span className="text-[10px] font-bold text-white z-10">{user.matchScore || 85}%</span>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold border border-white/20">
                {user.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <h4 className="text-white font-bold text-sm leading-tight">{user.name}</h4>
                <p className="text-primary text-[10px] font-bold uppercase tracking-widest mt-0.5">
                  {user.career_goal ? user.career_goal.replace('_', ' ') : 'Student'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {user.skills.slice(0, 3).map(s => (
                <span key={s} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-gray-300">
                  {s}
                </span>
              ))}
            </div>

            <button className="mt-auto w-full btn-secondary py-2 text-xs" onClick={() => handleConnect(user.id)}>
              Connect
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};


const Teams = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('my_teams');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [viewMembersTeam, setViewMembersTeam] = useState(null);
  const [discussTeam, setDiscussTeam] = useState(null);
  const [formData, setFormData] = useState({ name: '', join_code: '' });
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [leaving, setLeaving] = useState(null);
  const [myProfile, setMyProfile] = useState(null);

  const showT = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  const fetchTeams = useCallback(() => {
    api.get('/teams/my').then(res => setTeams(res.data)).finally(() => setLoading(false));
  }, []);

  const fetchProfile = useCallback(() => {
    api.get('/students/profile').then(res => setMyProfile(res.data)).catch(console.error);
  }, []);

  useEffect(() => { 
    fetchTeams(); 
    fetchProfile();
  }, [fetchTeams, fetchProfile]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teams', { name: formData.name });
      showT('Team created! Share the join code with teammates.', 'success');
      setShowCreate(false);
      setFormData({ name: '', join_code: '' });
      fetchTeams();
    } catch (err) {
      showT(err.response?.data?.message || 'Error creating team.', 'error');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teams/join', { join_code: formData.join_code });
      showT('Joined team successfully!', 'success');
      setShowJoin(false);
      setFormData({ name: '', join_code: '' });
      fetchTeams();
    } catch (err) {
      showT(err.response?.data?.message || 'Invalid join code.', 'error');
    }
  };

  const handleLeave = async (teamId, teamName) => {
    if (!window.confirm(`Are you sure you want to leave "${teamName}"?`)) return;
    setLeaving(teamId);
    try {
      await api.delete(`/teams/${teamId}/leave`);
      setTeams(prev => prev.filter(t => t.id !== teamId));
      showT('You have left the team.', 'success');
    } catch (err) {
      showT(err.response?.data?.message || 'Could not leave team.', 'error');
    } finally {
      setLeaving(null);
    }
  };

  const copyJoinCode = (code) => {
    navigator.clipboard.writeText(code);
    showT('Join code copied to clipboard!', 'success');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto text-white relative z-10">
      {toast.msg && (
        <div className={`fixed top-4 right-4 z-50 glass-panel px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold ${
          toast.type === 'success' ? 'text-green-400 border-green-500/30' : 'text-red-400 border-red-500/30'
        }`}>
          {toast.msg}
        </div>
      )}

      {viewMembersTeam && (
        <MembersModal team={viewMembersTeam} onClose={() => setViewMembersTeam(null)} />
      )}

      {discussTeam && (
        <DiscussionModal team={discussTeam} currentUser={currentUser} onClose={() => setDiscussTeam(null)} />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <span className="text-4xl">🤝</span> <span className="text-gradient">Teams & Networking</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Form squads, discover talent, and network with peers (24h Ephemeral Chats).</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => setShowJoin(true)} className="btn-secondary flex-1 md:flex-none">
            Join Team
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex-1 md:flex-none">
            + Create Team
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 mb-8 overflow-x-auto no-scrollbar relative z-10">
        {[
          { id: 'my_teams', label: 'My Teams', icon: '👥' },
          { id: 'connections', label: 'Connections', icon: '💬' },
          { id: 'find', label: 'Find Teammates', icon: '🔍' },
          { id: 'suggested', label: 'Suggested for You', icon: '✨' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 font-semibold text-sm transition-all whitespace-nowrap flex items-center gap-2 border-b-2 ${
              activeTab === tab.id 
                ? 'border-primary text-white bg-primary/5' 
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      <div className="relative z-10">
        {activeTab === 'my_teams' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.length === 0 ? (
              <div className="col-span-full text-center py-24 glass-card border-dashed">
                <p className="text-4xl mb-4">👥</p>
                <p className="text-gray-400 text-sm mb-4">You are not in any teams yet.</p>
                <button onClick={() => setShowJoin(true)} className="btn-primary text-sm inline-block">
                  Join your first team
                </button>
              </div>
            ) : teams.map(t => (
              <div key={t.id} className="glass-card p-6 flex flex-col group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-125" />

                <h2 className="text-xl font-bold group-hover:text-primary transition-colors mb-2 relative z-10">{t.name}</h2>
                {t.opportunity_title && (
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20 self-start mb-4 relative z-10">
                    {t.opportunity_title}
                  </span>
                )}

                <div className="mt-auto relative z-10">
                  <div
                    className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between mb-4 shadow-inner hover:bg-white/10 transition-all"
                    onClick={() => copyJoinCode(t.join_code)}
                    title="Click to copy join code"
                  >
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Join Code</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-primary font-bold tracking-widest bg-primary/10 px-2 py-1 rounded">{t.join_code}</span>
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-4">
                    <button
                      onClick={() => setViewMembersTeam(t)}
                      className="text-sm text-gray-300 font-semibold flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      {t.member_count} members
                    </button>
                    <button
                      onClick={() => handleLeave(t.id, t.name)}
                      disabled={leaving === t.id}
                      className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                    >
                      {leaving === t.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      )}
                      Leave
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => setDiscussTeam(t)}
                    className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    💬 Team Discussion
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'connections' && <ConnectionsView currentUser={currentUser} />}
        {activeTab === 'find' && <FindTeammates />}
        {activeTab === 'suggested' && <SuggestedMates myProfile={myProfile} />}
      </div>

      {/* Modals for Create/Join */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0" onClick={() => setShowCreate(false)} />
          <form onSubmit={handleCreate} className="glass-panel p-8 rounded-2xl w-full max-w-md shadow-2xl relative z-10 border-white/20">
            <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
              <span className="text-primary">✨</span> Create Team
            </h3>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Team Name</label>
            <input
              required
              value={formData.name}
              placeholder="e.g. Code Ninjas"
              className="input-glass w-full mb-8"
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            <div className="flex justify-end gap-3 border-t border-white/10 pt-6">
              <button type="button" onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white px-5 py-2 font-semibold text-sm transition-colors rounded-full hover:bg-white/5">Cancel</button>
              <button className="btn-primary">Create</button>
            </div>
          </form>
        </div>
      )}

      {showJoin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0" onClick={() => setShowJoin(false)} />
          <form onSubmit={handleJoin} className="glass-panel p-8 rounded-2xl w-full max-w-md shadow-2xl relative z-10 border-white/20">
            <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
              <span className="text-primary">🔗</span> Join Team
            </h3>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Team Join Code</label>
            <input
              required
              value={formData.join_code}
              placeholder="6-character Code (e.g. A1B2C3)"
              className="input-glass w-full font-mono uppercase tracking-widest mb-8"
              onChange={e => setFormData({ ...formData, join_code: e.target.value.toUpperCase() })}
            />
            <div className="flex justify-end gap-3 border-t border-white/10 pt-6">
              <button type="button" onClick={() => setShowJoin(false)} className="text-gray-400 hover:text-white px-5 py-2 font-semibold text-sm transition-colors rounded-full hover:bg-white/5">Cancel</button>
              <button className="btn-primary">Join Team</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default Teams;
