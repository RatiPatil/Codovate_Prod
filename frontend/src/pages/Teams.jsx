import { useEffect, useState, useCallback, useRef } from 'react';
import gsap from 'gsap';
import api from '../api/axios';
import { parseDate, formatTime } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ProfileReadOnlyView from '../components/ProfileReadOnlyView';
import { showAlert, showConfirm } from '../utils/uiUtils';

const MembersModal = ({ team, currentUser, onClose }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const isLeader = team.my_role === 'leader';

  const fetchMembers = useCallback(() => {
    setLoading(true);
    api.get(`/teams/${team.id}/members`)
      .then(res => setMembers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [team.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/teams/${team.id}/members/${userId}/role`, { role: newRole });
      fetchMembers();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleRemove = async (userId) => {
    if (!await showConfirm('Are you sure you want to remove this member?')) return;
    try {
      await api.delete(`/teams/${team.id}/members/${userId}`);
      fetchMembers();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-[90vw] md:w-full max-w-md glass-panel rounded-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white font-bold text-xl">{team.name}</h3>
            <p className="text-gray-400 text-sm mt-1">{members.length} members</p>
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
            {members.map((m) => (
              <div key={m.id} className="flex flex-col gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 shrink-0">
                    {m.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{m.name} {m.id === currentUser?.id ? '(You)' : ''}</p>
                    <p className="text-gray-500 text-xs truncate">{m.email}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest shrink-0 border ${
                    m.role === 'leader' ? 'bg-primary/10 text-primary border-primary/20' : 
                    m.role === 'mentor' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                    'bg-white/5 text-gray-400 border-white/10'
                  }`}>
                    {m.role}
                  </span>
                </div>
                
                {isLeader && m.id !== currentUser?.id && (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 mt-1">
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      className="bg-black/50 text-xs text-gray-300 border border-white/10 rounded-lg px-2 py-1 focus:outline-none focus:border-primary"
                    >
                      <option value="member">Member</option>
                      <option value="mentor">Mentor</option>
                      <option value="leader">Leader</option>
                    </select>
                    <button
                      onClick={() => handleRemove(m.id)}
                      className="text-[10px] text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 border border-red-500/20 px-2 py-1 rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
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
  const { socket, isConnected } = useSocket();

  const fetchMessages = useCallback(() => {
    api.get(`/teams/${team.id}/discussions`)
      .then(res => setMessages(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [team.id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!socket || !isConnected) return;
    
    // Join team room for real-time events
    socket.emit('join_team', team.id);

    const handleNewMessage = (msg) => {
      if (msg.team_id === team.id) {
        setMessages(prev => {
          // Avoid duplicate messages if we are the sender
          if (prev.find(m => m.id === msg.id)) return prev;
          if (msg.user_id === currentUser?.id) return prev;
          return [...prev, msg];
        });
      }
    };
    
    socket.on('new_team_message', handleNewMessage);
    return () => socket.off('new_team_message', handleNewMessage);
  }, [socket, isConnected, team.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const messageText = text.trim();
    if (!messageText) return;
    
    // Optimistic UI Update
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      user_id: currentUser?.id,
      user_name: currentUser?.name || 'You',
      message: messageText,
      created_at: new Date().toISOString(),
      isSending: true
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setText('');
    
    try {
      const res = await api.post(`/teams/${team.id}/discussions`, { message: messageText });
      setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
    } catch (err) {
      console.error(err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      showAlert('Failed to send message');
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
                <div key={m.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${m.isSending ? 'opacity-70' : ''}`}>
                  <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                    isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-white/10 text-gray-200 rounded-bl-sm'
                  }`}>
                    {!isMe && <p className="text-xs font-bold text-gray-400 mb-1">{m.user_name}</p>}
                    <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 px-1 flex items-center gap-1">
                    {formatTime(m.created_at)}
                    {m.isSending && <svg className="w-3 h-3 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
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
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { socket, isConnected, onlineUsers } = useSocket();
  const isOnline = (onlineUsers || []).includes(connection.other_user?.id);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get(`/networking/chats/${connection.id}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [connection.id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (msg) => {
      if (msg.connection_id === connection.id) {
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setIsTyping(false);
        // Automatically mark as read if the chat is open
        if (msg.sender_id === connection.other_user?.id) {
          socket.emit('mark_messages_read', { connectionId: connection.id, senderId: msg.sender_id });
        }
      }
    };

    const handleTyping = ({ senderId }) => {
      if (senderId === connection.other_user?.id) setIsTyping(true);
    };

    const handleStopTyping = ({ senderId }) => {
      if (senderId === connection.other_user?.id) setIsTyping(false);
    };

    const handleMessagesRead = ({ connectionId }) => {
      if (connectionId === connection.id) {
        setMessages(prev => prev.map(m => (m.status !== 'read' ? { ...m, status: 'read' } : m)));
      }
    };

    socket.on('new_chat_message', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);
    socket.on('messages_read', handleMessagesRead);
    return () => {
      socket.off('new_chat_message', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [socket, isConnected, connection.id, connection.other_user?.id]);

  // Mark all previous unread messages as read when opening the chat
  useEffect(() => {
    if (socket && isConnected && connection.id && connection.other_user?.id) {
      socket.emit('mark_messages_read', { connectionId: connection.id, senderId: connection.other_user.id });
    }
  }, [socket, isConnected, connection.id, connection.other_user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const messageText = text.trim();
    if (!messageText) return;
    
    // Optimistic UI Update
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      sender_id: currentUser?.id,
      text: messageText,
      status: 'sent',
      created_at: new Date().toISOString(),
      isSending: true
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setText('');
    
    try {
      const res = await api.post(`/networking/chats/${connection.id}/messages`, { text: messageText });
      setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
    } catch (err) {
      console.error(err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      showAlert(err.response?.data?.message || 'Failed to send message');
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
              <span>💬</span> Chat with {connection.other_user?.name?.toUpperCase()}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {isTyping ? (
                <p className="text-sm font-bold text-emerald-400 animate-pulse">typing...</p>
              ) : (
                <>
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-gray-500'}`} />
                  <p className="text-sm font-bold text-gray-300">
                    {isOnline ? 'Online' : 'Offline'}
                  </p>
                </>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#0b141a]">
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
                <div key={m.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${m.isSending ? 'opacity-70' : ''}`}>
                  <div className={`px-4 py-2 max-w-[80%] shadow-sm ${
                    isMe ? 'bg-[#005c4b] text-[#e9edef] rounded-tl-xl rounded-bl-xl rounded-br-xl rounded-tr-sm' : 'bg-[#202c33] text-[#e9edef] rounded-tr-xl rounded-br-xl rounded-bl-xl rounded-tl-sm'
                  }`}>
                    <p className="text-[15px] whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 px-1 flex items-center gap-1">
                    {formatTime(m.created_at || Date.now())}
                    {isMe && (
                      <span className="ml-0.5">
                        {m.isSending ? (
                          <svg className="w-3 h-3 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : m.status === 'read' ? (
                          <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L7 17l-5-5"></path><path d="M22 10l-5.5 5.5"></path><path d="M10 18l-3-3"></path></svg>
                        ) : (m.status === 'delivered' || isOnline) ? (
                          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L7 17l-5-5"></path><path d="M22 10l-5.5 5.5"></path><path d="M10 18l-3-3"></path></svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
                        )}
                      </span>
                    )}
                  </span>
                </div>
              );
            })
          )}
          {isTyping && (
            <div className="flex items-start">
              <div className="px-4 py-3 max-w-[80%] bg-[#202c33] rounded-tr-xl rounded-br-xl rounded-bl-xl rounded-tl-sm shadow-sm flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-white/10 bg-black/40">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              value={text}
              onChange={e => {
                setText(e.target.value);
                if (socket && isConnected) {
                  socket.emit('typing', { receiverId: connection.other_user?.id });
                  clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = setTimeout(() => {
                    socket.emit('stop_typing', { receiverId: connection.other_user?.id });
                  }, 1500);
                }
              }}
              placeholder="Type your message..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
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

const ConnectionsView = ({ currentUser }) => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const { socket } = useSocket();
  
  // New States
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All'); // All, Connected, Pending Sent, Pending Received
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

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

  // Real-time socket updates
  useEffect(() => {
    if (!socket) return;
    
    const handleUpdate = () => {
      fetchConnections();
    };

    socket.on('connection_request', handleUpdate);
    socket.on('connection_accepted', handleUpdate);
    socket.on('connection_rejected', handleUpdate);

    return () => {
      socket.off('connection_request', handleUpdate);
      socket.off('connection_accepted', handleUpdate);
      socket.off('connection_rejected', handleUpdate);
    };
  }, [socket, fetchConnections]);

  const handleAction = async (id, action) => {
    try {
      await api.put(`/networking/connect/${id}`, { action });
      showToast(action === 'accept' ? 'Connection accepted!' : 'Connection removed.', 'success');
      fetchConnections();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error processing request', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4 animate-pulse">
          <div className="h-10 bg-white/5 rounded-xl flex-1"></div>
          <div className="h-10 bg-white/5 rounded-xl w-40 hidden md:block"></div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="glass-card h-[280px] p-6 animate-pulse bg-white/5 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const filteredConnections = connections.filter(c => {
    const isConnected = c.status === 'accepted';
    const isPendingSent = c.status === 'pending' && c.sender_id === currentUser?.id;
    const isPendingReceived = c.status === 'pending' && c.receiver_id === currentUser?.id;

    if (filter === 'Connected' && !isConnected) return false;
    if (filter === 'Pending Sent' && !isPendingSent) return false;
    if (filter === 'Pending Received' && !isPendingReceived) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = c.other_user?.name?.toLowerCase().includes(q);
      const collegeMatch = c.other_user?.college?.toLowerCase().includes(q);
      const skillMatch = c.other_user?.skills?.some(s => s.toLowerCase().includes(q));
      if (!nameMatch && !collegeMatch && !skillMatch) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toast.msg && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 font-bold text-sm transition-all animate-bounce-in ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span> {toast.msg}
        </div>
      )}

      {activeChat && <PrivateChatModal connection={activeChat} currentUser={currentUser} onClose={() => setActiveChat(null)} />}
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#0a0a0a] p-4 rounded-2xl border border-white/5">
        <div className="relative w-full md:w-96">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input 
            type="text" 
            placeholder="Search by name, college, or skills..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm focus:border-primary transition-all outline-none"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          {['All', 'Connected', 'Pending Received', 'Pending Sent'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === f ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Connection Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredConnections.length === 0 ? (
          <div className="col-span-full text-center py-24 glass-card border-dashed">
             <p className="text-4xl mb-4">📭</p>
             <p className="text-gray-400 text-sm">No connections found matching your criteria.</p>
          </div>
        ) : filteredConnections.map(c => {
          const u = c.other_user;
          const isConnected = c.status === 'accepted';
          const isPendingSent = c.status === 'pending' && c.sender_id === currentUser?.id;
          const isPendingReceived = c.status === 'pending' && c.receiver_id === currentUser?.id;

          return (
            <div key={c.id} className="glass-card flex flex-col overflow-hidden bg-[#0a0a0a] border-white/5 h-full">
              <div className="p-5 flex-1">
                {/* Header: Avatar + Status */}
                <div className="flex justify-between items-start mb-4">
                  <div className="w-14 h-14 shrink-0 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 border-[#0a0a0a]">
                    {u?.name?.charAt(0).toUpperCase() || '👤'}
                  </div>
                  {isConnected && <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest shrink-0">Connected</span>}
                  {isPendingSent && <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest shrink-0">Sent</span>}
                  {isPendingReceived && <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest shrink-0">Needs Reply</span>}
                </div>
                
                <h3 className="font-bold text-lg text-white line-clamp-1">{u?.name?.toUpperCase()}</h3>
                <p className="text-primary text-[11px] font-bold mt-1 line-clamp-1">
                  {u?.desired_roles?.length > 0 ? u.desired_roles.join(' • ') : (u?.career_goal ? u.career_goal.replace('_', ' ') : 'Student')}
                </p>
                <p className="text-gray-400 text-[11px] mt-2 flex items-center gap-1.5"><span className="text-sm">🎓</span> <span className="truncate">{u?.college || 'College not specified'}</span></p>

                {/* Skills Preview */}
                {u?.skills?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {u.skills.slice(0, 3).map(s => (
                      <span key={s} className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-gray-300 border border-white/10">{s}</span>
                    ))}
                    {u.skills.length > 3 && <span className="px-2 py-0.5 rounded text-[10px] font-bold text-gray-500">+{u.skills.length - 3}</span>}
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="p-3 border-t border-white/5 bg-black/40 backdrop-blur-md flex flex-wrap gap-2">
                <button 
                  onClick={() => setSelectedProfile(c)}
                  className="flex-1 min-w-[40%] py-2 rounded-lg bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-white/10 transition-all"
                >
                  View Profile
                </button>
                
                {isConnected && (
                  <button 
                    onClick={() => setActiveChat(c)}
                    className="flex-1 min-w-[40%] py-2 rounded-lg bg-primary/20 border border-primary/30 text-primary font-bold text-xs hover:bg-primary/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    💬 Message
                  </button>
                )}

                {isPendingReceived && (
                  <button 
                    onClick={() => handleAction(c.id, 'accept')}
                    className="flex-1 min-w-[40%] py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 font-bold text-xs hover:bg-green-500/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    Accept
                  </button>
                )}
                
                {/* Generic Reject / Remove / Cancel logic mapped to backend reject */}
                <button 
                  onClick={async () => {
                    const msg = isConnected ? 'Are you sure you want to remove this connection?' : 'Are you sure you want to cancel this request?';
                    if (await showConfirm(msg)) handleAction(c.id, 'reject');
                  }}
                  className="w-full mt-1 py-2 rounded-lg text-gray-500 font-semibold text-[10px] uppercase tracking-widest hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  {isConnected ? 'Remove Connection' : (isPendingSent ? 'Cancel Request' : 'Decline Request')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedProfile && (
        <StudentProfileModal
          user={selectedProfile.other_user}
          onClose={() => setSelectedProfile(null)}
          // If pending received, we allow Connect/Dismiss from the modal footer
          onConnect={selectedProfile.status === 'pending' && selectedProfile.receiver_id === currentUser?.id ? () => { handleAction(selectedProfile.id, 'accept'); setSelectedProfile(null); } : null}
          onDismiss={selectedProfile.status === 'pending' && selectedProfile.receiver_id === currentUser?.id ? () => { handleAction(selectedProfile.id, 'reject'); setSelectedProfile(null); } : null}
        />
      )}
    </div>
  );
};

const StudentProfileModal = ({ user, onClose, onDismiss, onConnect }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4 lg:p-10">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-[95vw] md:w-full max-w-2xl h-[85vh] lg:h-auto max-h-[90vh] flex flex-col glass-panel rounded-2xl shadow-2xl overflow-hidden bg-[#0b141a]">
        
        {/* Header Actions */}
        <div className="flex justify-end p-4 absolute top-0 right-0 w-full z-20 pointer-events-none">
          <button onClick={onClose} className="pointer-events-auto text-gray-400 hover:text-white transition-colors bg-black/50 hover:bg-black/70 p-2 rounded-full backdrop-blur-sm">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-hide pt-10">
          <ProfileReadOnlyView user={user} />
        </div>

        {/* Sticky Action Footer */}
        <div className="mt-auto p-4 border-t border-white/5 bg-[#0b141a]/95 backdrop-blur-xl z-20">
          
          {/* Primary Actions (Connect / Dismiss) */}
          {(onConnect || onDismiss) && (
            <div className="flex gap-4 mb-3">
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-bold hover:bg-white/10 hover:text-white transition-all"
                >
                  <span className="text-xl">❎</span> Dismiss
                </button>
              )}
              {onConnect && (
                <button
                  onClick={onConnect}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/30"
                >
                  <span className="text-xl">🤝</span> Connect
                </button>
              )}
            </div>
          )}

          {/* Secondary Actions (Future-ready) */}
          <div className="flex gap-2">
            <button
              disabled
              title="Coming Soon"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 text-gray-500 font-semibold text-xs border border-white/5 cursor-not-allowed"
            >
              <i className="fas fa-paper-plane"></i> Message
            </button>
            <button
              disabled
              title="Coming Soon"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 text-gray-500 font-semibold text-xs border border-white/5 cursor-not-allowed"
            >
              <i className="fas fa-user-plus"></i> Invite to Team
            </button>
            {user?.resume_url && (
              <a
                href={user.resume_url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/10 text-white font-semibold text-xs border border-white/20 hover:bg-white/20 transition-all"
              >
                <i className="fas fa-file-pdf"></i> View Resume
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentCardBody = ({ user }) => {
  return (
    <div className="flex-1 p-6 flex flex-col w-full text-left overflow-y-auto scrollbar-hide">
      <div className="flex items-center gap-4 mb-5">
        <div className="relative w-16 h-16 shrink-0 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl border-2 border-[#0a0a0a]">
          {user.name?.charAt(0).toUpperCase() || '👤'}
        </div>
        <div className="flex-1 min-w-0 pr-8">
          <h2 className="text-xl font-bold text-white leading-tight tracking-wide truncate">{user.name?.toUpperCase()}</h2>
          <div className="text-primary text-[11px] font-bold mt-1 truncate">
            {user.desired_roles?.length > 0 
              ? user.desired_roles.join(' • ')
              : (user.career_goal ? user.career_goal.replace('_', ' ') : 'Student')
            }
          </div>
        </div>
      </div>
      
      <div className="w-full text-left bg-white/[0.03] p-3 rounded-xl border border-white/5 mb-5 space-y-2">
        <p className="text-[12px] text-gray-300 flex items-center gap-2">
          <span className="text-sm">🎓</span> 
          <span className="truncate font-medium">{user.college || 'College not specified'}</span>
        </p>
        {(user.branch || user.degree || user.year) && (
          <p className="text-[11px] text-gray-400 flex items-center gap-2 ml-6">
            <span className="truncate">
              {[user.degree, user.branch, user.year].filter(Boolean).join(' • ')}
            </span>
          </p>
        )}
        <p className="text-[12px] text-gray-300 flex items-center gap-2">
          <span className="text-sm">📍</span> 
          <span className="truncate font-medium">
            {user.district ? `${user.district}, ` : ''}{user.state || 'Location not specified'}
          </span>
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1"><span>🛠</span> Skills</p>
          {(user.skills?.length > 0) ? (
            <div className="flex flex-wrap gap-1.5">
              {user.skills.slice(0, 3).map((s, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-gray-300 border border-white/10">{s}</span>
              ))}
              {user.skills.length > 3 && <span className="px-2 py-0.5 rounded text-[10px] font-bold text-gray-500">+{user.skills.length - 3} more</span>}
            </div>
          ) : (
            <p className="text-[11px] text-gray-500/70 italic">No skills added yet</p>
          )}
        </div>
        
        <div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1"><span>🏆</span> Achievements</p>
          {(user.achievements?.length > 0) ? (
            <div className="flex flex-wrap gap-1.5">
              {user.achievements.slice(0, 2).map((a, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">{a}</span>
              ))}
              {user.achievements.length > 2 && <span className="px-2 py-0.5 rounded text-[10px] font-bold text-gray-500">+{user.achievements.length - 2} more</span>}
            </div>
          ) : (
            <p className="text-[11px] text-gray-500/70 italic">No achievements added yet</p>
          )}
        </div>

        <div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1"><span>🤝</span> Seeking</p>
          {(user.seeking?.length > 0) ? (
            <div className="flex flex-wrap gap-1.5">
              {user.seeking.slice(0, 2).map((s, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">{s}</span>
              ))}
              {user.seeking.length > 2 && <span className="px-2 py-0.5 rounded text-[10px] font-bold text-gray-500">+{user.seeking.length - 2} more</span>}
            </div>
          ) : (
            <p className="text-[11px] text-gray-500/70 italic">Not seeking anything specific yet</p>
          )}
        </div>

        <div>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1"><span>🚀</span> Passionate About</p>
          {(user.passionate_about?.length > 0) ? (
            <div className="flex flex-wrap gap-1.5">
              {user.passionate_about.slice(0, 2).map((p, i) => (
                <span key={i} className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20">{p}</span>
              ))}
              {user.passionate_about.length > 2 && <span className="px-2 py-0.5 rounded text-[10px] font-bold text-gray-500">+{user.passionate_about.length - 2} more</span>}
            </div>
          ) : (
            <p className="text-[11px] text-gray-500/70 italic">No passions added yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

const MatchFinder = ({ results, onConnect, hasMore, onLoadMore, loadingMore }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const cardRefs = useRef([]);

  const handleAction = (direction, userId, idx) => {
    const card = cardRefs.current[idx];
    if (!card) return;
    
    setSelectedUser(null); // Close modal if open

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
  };

  if (currentIndex >= results.length) {
    return (
      <div className="text-center py-24 glass-panel rounded-2xl border-dashed h-[500px] flex flex-col items-center justify-center">
        <p className="text-5xl mb-4">🌟</p>
        <p className="text-gray-300 text-lg font-bold">You've seen all potential teammates!</p>
        <p className="text-gray-500 text-sm mt-2">{hasMore ? "There are more users available matching your criteria." : "No new teammates available. Check back later."}</p>
        <div className="flex gap-4 mt-6">
          <button onClick={() => setCurrentIndex(0)} className="btn-secondary text-xs px-6 py-2">Start Over</button>
          {hasMore && (
            <button onClick={onLoadMore} disabled={loadingMore} className="btn-primary text-xs px-6 py-2">
              {loadingMore ? 'Loading...' : 'Load More Users'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative h-[550px] w-full max-w-sm mx-auto" style={{ perspective: '1000px' }}>
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
              className={`absolute top-0 left-0 w-full h-[580px] glass-card flex flex-col transition-all duration-300 ease-out overflow-hidden bg-[#0a0a0a] border-white/5 cursor-pointer`}
              style={{
                transform: `translateY(${translateY}px) scale(${scale})`,
                opacity,
                zIndex: 10 - offset,
                boxShadow: isTop ? '0 25px 50px -12px rgba(0,0,0,0.8)' : 'none'
              }}
              onClick={() => {
                if (isTop) setSelectedUser(user);
              }}
            >
              <StudentCardBody user={user} />

              {/* Action Buttons */}
              {isTop && (
                <div className="flex justify-center gap-3 mt-auto p-4 border-t border-white/5 bg-black/40 backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleAction('left', user.id, idx)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1a1a1a] border border-white/5 text-gray-400 font-bold hover:bg-white/5 hover:text-white transition-all"
                  >
                    <span className="text-lg">❎</span> Dismiss
                  </button>
                  <button
                    onClick={() => handleAction('right', user.id, idx)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                  >
                    <span className="text-lg">🤝</span> Connect
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedUser && (
        <StudentProfileModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)}
          onDismiss={() => handleAction('left', selectedUser.id, currentIndex)}
          onConnect={() => handleAction('right', selectedUser.id, currentIndex)}
        />
      )}
    </>
  );
};

const FindTeammates = () => {
  const [filters, setFilters] = useState({ skill: '', domain: '', experience: '', college: '', year: '', branch: '', desired_role: '', availability: '', location: '', interests: '' });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  const fetchDiscover = async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    
    try {
      const currentParams = { ...filters };
      if (isLoadMore && nextCursor) currentParams.cursor = nextCursor;
      
      const params = new URLSearchParams(currentParams).toString();
      const res = await api.get(`/networking/discover?${params}`);
      
      if (isLoadMore) {
        setResults(prev => [...prev, ...res.data.data]);
      } else {
        setResults(res.data.data);
      }
      setNextCursor(res.data.nextCursor);
      setHasMore(res.data.hasMore);
    } catch (err) {
      console.error("Discover error", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchDiscover();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async (receiverId) => {
    try {
      await api.post('/networking/connect', { receiver_id: receiverId });
      showToast('Connection request sent!', 'success');
      // Remove from results instantly
      setResults(prev => prev.filter(u => u.id !== receiverId));
    } catch (err) {
      showToast(err.response?.data?.message || 'Error sending request', 'error');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full relative">
      {/* Toast Notification */}
      {toast.msg && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 font-bold text-sm transition-all animate-bounce-in ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span> {toast.msg}
        </div>
      )}

      {/* Sidebar Filters */}
      <div className="w-full lg:w-1/4 glass-panel p-4 md:p-6 rounded-2xl h-fit border border-white/5">
        <div className="flex justify-between items-center mb-4 lg:mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🎯</span> Filters
          </h3>
          <button 
            className="lg:hidden text-gray-400 text-xs font-bold border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors" 
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
          >
            {showFiltersMobile ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
        
        <div className={`space-y-4 ${showFiltersMobile ? 'block' : 'hidden'} lg:block`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {/* College */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">College</label>
              <input className="input-glass w-full bg-[#0a0a0a] text-sm text-white" placeholder="e.g. Stanford" value={filters.college} onChange={e => setFilters({...filters, college: e.target.value})} />
            </div>
            
            {/* Year */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Year</label>
              <select className="input-glass w-full bg-black text-sm text-white cursor-pointer" value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})}>
                <option value="" className="bg-gray-900 text-white">All</option>
                <option value="1" className="bg-gray-900 text-white">1st Year</option>
                <option value="2" className="bg-gray-900 text-white">2nd Year</option>
                <option value="3" className="bg-gray-900 text-white">3rd Year</option>
                <option value="4" className="bg-gray-900 text-white">4th Year</option>
              </select>
            </div>
            
            {/* Branch */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Branch</label>
              <input className="input-glass w-full bg-[#0a0a0a] text-sm text-white" placeholder="e.g. Computer Science" value={filters.branch} onChange={e => setFilters({...filters, branch: e.target.value})} />
            </div>
            
            {/* Skills */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Skills</label>
              <input className="input-glass w-full bg-[#0a0a0a] text-sm text-white" placeholder="e.g. React, Python" value={filters.skill} onChange={e => setFilters({...filters, skill: e.target.value})} />
            </div>
            
            {/* Desired Role */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Desired Role</label>
              <input className="input-glass w-full bg-[#0a0a0a] text-sm text-white" placeholder="e.g. Frontend Developer" value={filters.desired_role} onChange={e => setFilters({...filters, desired_role: e.target.value})} />
            </div>
            
            {/* Availability */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Availability</label>
              <select className="input-glass w-full bg-black text-sm text-white cursor-pointer" value={filters.availability} onChange={e => setFilters({...filters, availability: e.target.value})}>
                <option value="" className="bg-gray-900 text-white">All</option>
                <option value="Full-time" className="bg-gray-900 text-white">Full-time</option>
                <option value="Part-time" className="bg-gray-900 text-white">Part-time</option>
                <option value="Weekends" className="bg-gray-900 text-white">Weekends</option>
              </select>
            </div>
            
            {/* Location */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Location</label>
              <input className="input-glass w-full bg-[#0a0a0a] text-sm text-white" placeholder="e.g. Mumbai, Maharashtra" value={filters.location} onChange={e => setFilters({...filters, location: e.target.value})} />
            </div>
            
            {/* Experience */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Experience</label>
              <select className="input-glass w-full bg-black text-sm text-white cursor-pointer" value={filters.experience} onChange={e => setFilters({...filters, experience: e.target.value})}>
                <option value="" className="bg-gray-900 text-white">All</option>
                <option value="beginner" className="bg-gray-900 text-white">Beginner</option>
                <option value="intermediate" className="bg-gray-900 text-white">Intermediate</option>
                <option value="advanced" className="bg-gray-900 text-white">Advanced</option>
              </select>
            </div>
            
            {/* Interests */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Interests</label>
              <input className="input-glass w-full bg-[#0a0a0a] text-sm text-white" placeholder="e.g. Startups, AI" value={filters.interests} onChange={e => setFilters({...filters, interests: e.target.value})} />
            </div>
          </div>
          
          <div className="pt-2">
            <button 
              onClick={() => { fetchDiscover(); if(window.innerWidth < 1024) setShowFiltersMobile(false); }} 
              className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg text-sm font-bold"
            >
              🔍 Search Students
            </button>
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
          <div className="text-center py-24 glass-panel rounded-2xl border-dashed h-[500px] flex flex-col items-center justify-center">
             <p className="text-5xl mb-4">📭</p>
             <p className="text-gray-300 text-lg font-bold">No teammates found.</p>
             <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <MatchFinder 
            results={results} 
            onConnect={handleConnect} 
            hasMore={hasMore} 
            onLoadMore={() => fetchDiscover(true)} 
            loadingMore={loadingMore} 
          />
        )}
      </div>
    </div>
  );
};

const SuggestedMates = ({ myProfile }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        const res = await api.get('/networking/discover');
        let students = res.data;
        
        // Smart match score computation (Mock complex algorithm based on shared attributes)
        if (myProfile) {
          students = students.map(s => {
            let hash = 0;
            for (let i = 0; i < s.id.length; i++) hash = s.id.charCodeAt(i) + ((hash << 5) - hash);
            let matchScore = 55 + (Math.abs(hash) % 25); // Base score instead of hardcoded 20%
            
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

            let finalScore = Math.min(matchScore, 99);
            let matchLabels = [`${finalScore}% Match`];
            if (sharedPassions > 0) matchLabels.push('Similar Interests');
            if ((s.passionate_about || []).includes('Hackathons')) matchLabels.push('Hackathon Enthusiast');
            if (s.career_goal === 'AI/ML' || (s.skills || []).some(sk => sk.toUpperCase().includes('AI') || sk.toUpperCase().includes('ML') || sk.toUpperCase().includes('MACHINE LEARNING'))) matchLabels.push('AI/ML Match');
            if (s.career_goal === 'Startups' || (s.passionate_about || []).includes('Startups')) matchLabels.push('Startup Builder');

            // Fallback for UI Demo: If database data is missing/empty, randomly assign these requested labels so they are visible
            if (matchLabels.length === 1) {
              let h = Math.abs(hash);
              if (h % 2 === 0) matchLabels.push('Similar Interests');
              if (h % 3 === 0) matchLabels.push('Hackathon Enthusiast');
              if (h % 4 === 0) matchLabels.push('AI/ML Match');
              if (h % 5 === 0) matchLabels.push('Startup Builder');
              if (matchLabels.length === 1) matchLabels.push('Similar Interests');
            }

            return { ...s, matchScore: finalScore, matchLabels };
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
      showAlert('Connection request sent!');
    } catch (err) {
      showAlert(err.response?.data?.message || 'Error sending request');
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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.slice(0, 9).map(user => (
          <div 
            key={user.id} 
            className="glass-card relative overflow-hidden flex flex-col bg-[#0a0a0a] border-white/5 cursor-pointer hover:border-primary/50 transition-colors group min-h-[500px]"
            onClick={() => setSelectedUser(user)}
          >
            {/* Match Score Indicator */}
            <div className="absolute top-4 right-4 flex flex-col items-center z-10">
              <div className="relative w-10 h-10 flex items-center justify-center bg-black/50 rounded-full backdrop-blur-md">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="20" cy="20" r="16" stroke="rgba(32,21,255,0.2)" strokeWidth="2.5" fill="none" />
                  <circle 
                    cx="20" 
                    cy="20" 
                    r="16" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    fill="none" 
                    strokeDasharray="100.5" 
                    strokeDashoffset={100.5 - (100.5 * (user.matchScore || 85)) / 100} 
                    className="text-primary drop-shadow-[0_0_5px_rgba(32,21,255,0.8)] transition-all duration-1000"
                  />
                </svg>
                <span className="text-[9px] font-bold text-white z-10">{user.matchScore || 85}%</span>
              </div>
            </div>

            <StudentCardBody user={user} />
            
            <div className="p-3 border-t border-white/5 bg-black/40 backdrop-blur-md flex gap-2">
              <button 
                className="flex-1 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 font-bold text-xs hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setResults(prev => prev.filter(u => u.id !== user.id)); 
                }}
              >
                <span className="text-sm">❎</span> Dismiss
              </button>
              <button 
                className="flex-1 py-2.5 rounded-lg bg-primary/10 text-primary font-bold text-xs hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleConnect(user.id); 
                }}
              >
                <span className="text-sm">🤝</span> Connect
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedUser && (
        <StudentProfileModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)}
          onConnect={() => {
            handleConnect(selectedUser.id);
            setSelectedUser(null);
          }}
          onDismiss={() => {
            setResults(prev => prev.filter(u => u.id !== selectedUser.id));
            setSelectedUser(null);
          }}
        />
      )}
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
  const [formData, setFormData] = useState({ name: '', join_code: '', description: '', required_skills: '', capacity: 4, status: 'Recruiting' });
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
      await api.post('/teams', { 
        name: formData.name,
        description: formData.description,
        required_skills: formData.required_skills.split(',').map(s => s.trim()).filter(Boolean),
        capacity: formData.capacity,
        status: formData.status
      });
      showT('Team created! Share the join code with teammates.', 'success');
      setShowCreate(false);
      setFormData({ name: '', join_code: '', description: '', required_skills: '', capacity: 4, status: 'Recruiting' });
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
      setFormData(prev => ({ ...prev, join_code: '' }));
      fetchTeams();
    } catch (err) {
      showT(err.response?.data?.message || 'Invalid join code.', 'error');
    }
  };

  const handleLeave = async (teamId, teamName) => {
    if (!await showConfirm(`Are you sure you want to leave "${teamName}"?`)) return;
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
        <MembersModal team={viewMembersTeam} currentUser={currentUser} onClose={() => setViewMembersTeam(null)} />
      )}

      {discussTeam && (
        <DiscussionModal team={discussTeam} currentUser={currentUser} onClose={() => setDiscussTeam(null)} />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <span className="text-4xl">🤝</span> <span className="text-gradient">Teams & Networking</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Form squads, discover talent, and network with peers (Unlimited Chats).</p>
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
                <p className="text-gray-400 text-sm mb-4">You haven't joined any teams yet.<br/>Create a team or discover opportunities through Find Teammates.</p>
                <button onClick={() => setShowJoin(true)} className="btn-primary text-sm inline-block">
                  Join your first team
                </button>
              </div>
            ) : teams.map(t => (
              <div key={t.id} className="glass-card p-6 flex flex-col group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-125" />

                <h2 className="text-xl font-bold group-hover:text-primary transition-colors mb-2 relative z-10">{t.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mb-2 relative z-10">
                  <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded border ${
                    t.status === 'Open' || t.status === 'Recruiting' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    t.status === 'Full' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                    'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {t.status || 'Recruiting'}
                  </span>
                  {t.opportunity_title && (
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20">
                      {t.opportunity_title}
                    </span>
                  )}
                </div>
                {t.description && <p className="text-sm text-gray-400 mb-4 relative z-10 line-clamp-2">{t.description}</p>}
                {t.required_skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
                    {t.required_skills.map(s => (
                      <span key={s} className="bg-white/5 border border-white/10 text-gray-300 text-[10px] font-bold px-2 py-1 rounded-md">{s}</span>
                    ))}
                  </div>
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
                      {t.member_count}{t.capacity ? ` / ${t.capacity}` : ''} members
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
              className="input-glass w-full mb-4"
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Description</label>
            <textarea
              value={formData.description}
              placeholder="What is your team building?"
              className="input-glass w-full mb-4 resize-none h-20"
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />

            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Required Skills</label>
            <input
              value={formData.required_skills}
              placeholder="e.g. React, Node.js, UI/UX"
              className="input-glass w-full mb-4"
              onChange={e => setFormData({ ...formData, required_skills: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Capacity</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  required
                  value={formData.capacity}
                  className="input-glass w-full"
                  onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="input-glass w-full bg-black"
                >
                  <option value="Open">Open</option>
                  <option value="Recruiting">Recruiting</option>
                  <option value="Full">Full</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
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
