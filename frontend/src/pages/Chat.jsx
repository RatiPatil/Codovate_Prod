import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Send, Image as ImageIcon, Paperclip, Check, CheckCheck, Loader2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const Chat = () => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('new_message', ({ chatId, message }) => {
      if (activeChat && activeChat.id === chatId) {
        setMessages(prev => [...prev, message]);
        // Send read receipt
        socket.emit('read_message', { roomName: getRoomName(activeChat), messageId: message.id, userId: user.id });
      }
      
      // Update chat list last activity
      setChats(prev => prev.map(c => {
        if (c.id === chatId) {
          return { ...c, last_activity: new Date(), last_message: message.text };
        }
        return c;
      }));
    });

    socket.on('typing', ({ userName }) => {
      setTypingUsers(prev => ({ ...prev, [userName]: true }));
    });

    socket.on('stop_typing', () => {
      setTypingUsers({});
    });

    socket.on('message_read', ({ messageId, userId }) => {
      setMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          const reads = m.read_by || [];
          if (!reads.includes(userId)) return { ...m, read_by: [...reads, userId] };
        }
        return m;
      }));
    });

    return () => {
      socket.off('new_message');
      socket.off('typing');
      socket.off('stop_typing');
      socket.off('message_read');
    };
  }, [socket, activeChat, user]);

  const fetchChats = async () => {
    try {
      const res = await api.get('/chat/list');
      setChats(res.data);
    } catch (err) {
      toast.error('Failed to load chats');
    } finally {
      setLoadingChats(false);
    }
  };

  const getRoomName = (chat) => {
    if (chat.type === 'direct') return `chat_${chat.connection_id}`;
    if (chat.type === 'team') return `team_${chat.team_id}`;
    return null;
  };

  const handleSelectChat = async (chat) => {
    setActiveChat(chat);
    setLoadingMessages(true);
    setTypingUsers({});
    if (socket) {
      const roomName = getRoomName(chat);
      if (roomName) socket.emit('join_room', roomName);
    }
    
    try {
      const res = await api.get(`/chat/${chat.id}/messages`);
      setMessages(res.data);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const text = inputText;
    setInputText('');
    
    if (socket) socket.emit('stop_typing', { roomName: getRoomName(activeChat) });

    try {
      const res = await api.post(`/chat/${activeChat.id}/messages`, { text });
      // Message is appended via socket new_message event
      // If we are sender, we could optimistically append, but socket triggers for sender too
    } catch (err) {
      toast.error('Failed to send message');
      setInputText(text); // revert
    }
  };

  let typingTimeout = null;
  const handleTyping = (e) => {
    setInputText(e.target.value);
    if (!socket || !activeChat) return;

    socket.emit('typing', { roomName: getRoomName(activeChat), userName: user.name });
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit('stop_typing', { roomName: getRoomName(activeChat) });
    }, 2000);
  };

  const handleAttachment = () => {
    const mockUrl = prompt("Enter Image/File URL (Mock File Sharing):");
    if (mockUrl && activeChat) {
      api.post(`/chat/${activeChat.id}/messages`, { text: 'Shared a file 📎', attachments: [mockUrl] });
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] max-h-[800px] flex bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mx-auto w-full">
      {/* Left Pane - Chat List */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col bg-white">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Messages</h2>
          <input 
            type="text" 
            placeholder="Search conversations..." 
            className="w-full mt-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar p-2">
          {loadingChats ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>
          ) : chats.length === 0 ? (
            <p className="text-center text-slate-400 mt-8 text-sm">No conversations yet.</p>
          ) : (
            chats.map(chat => {
              const isDirect = chat.type === 'direct';
              const name = isDirect ? chat.peer.name : chat.name;
              const isOnline = isDirect && onlineUsers.includes(chat.peer.id);
              
              return (
                <button
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left mb-1 ${activeChat?.id === chat.id ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'}`}
                >
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isDirect ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {(isDirect ? chat.peer.avatar : chat.logo) ? (
                        <img src={isDirect ? chat.peer.avatar : chat.logo} className="w-full h-full rounded-full object-cover" alt="" />
                      ) : name?.charAt(0)}
                    </div>
                    {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-slate-900 font-bold text-sm truncate">{name}</h3>
                      <span className="text-[10px] text-slate-400">
                        {chat.last_activity ? new Date(chat.last_activity).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs truncate">
                      {chat.type === 'team' && <span className="font-bold text-indigo-600">Team • </span>}
                      {chat.last_message || 'Start chatting...'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane - Chat Window */}
      <div className="flex-1 flex flex-col relative bg-[#F8FAFC]">

        {activeChat ? (
          <>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  {activeChat.type === 'direct' ? activeChat.peer.name?.charAt(0) : activeChat.name?.charAt(0)}
                </div>
                <div>
                  <h2 className="text-slate-900 font-bold">{activeChat.type === 'direct' ? activeChat.peer.name : activeChat.name}</h2>
                  {activeChat.type === 'direct' && onlineUsers.includes(activeChat.peer.id) && (
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Online</p>
                  )}
                  {Object.keys(typingUsers).length > 0 && (
                    <p className="text-[10px] text-indigo-600 italic">typing...</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar relative z-10">
              {loadingMessages ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <p>No messages here yet.</p>
                  <p className="text-sm">Send a message to start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === user.id;
                  const showAvatar = idx === 0 || messages[idx - 1].sender_id !== msg.sender_id;
                  const isRead = msg.read_by && msg.read_by.length > 1;

                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                      {!isMe && showAvatar ? (
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0 mt-auto">
                          {msg.sender_name?.charAt(0)}
                        </div>
                      ) : (
                        !isMe && <div className="w-8 shrink-0" />
                      )}
                      
                      <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        {(!isMe && showAvatar && activeChat.type === 'team') && (
                          <span className="text-[10px] text-slate-400 ml-1 mb-1">{msg.sender_name}</span>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-br-sm shadow-sm' : 'bg-white text-slate-900 rounded-bl-sm border border-slate-200 shadow-sm'}`}>
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 grid gap-2">
                              {msg.attachments.map((url, i) => (
                                <img key={i} src={url} alt="attachment" className="rounded-lg max-w-full h-auto max-h-48 object-cover border border-slate-200" />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 px-1">
                          <span className="text-[9px] text-slate-400">
                            {new Date(msg.timestamp?.seconds ? msg.timestamp.seconds * 1000 : msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && (
                            isRead ? <CheckCheck size={12} className="text-indigo-600" /> : <Check size={12} className="text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-200 relative z-10">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <button type="button" onClick={handleAttachment} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                  <Paperclip size={20} />
                </button>
                <button type="button" onClick={handleAttachment} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                  <ImageIcon size={20} />
                </button>
                <input
                  type="text"
                  value={inputText}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button type="submit" disabled={!inputText.trim()} className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                  <Send size={16} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 z-10 relative">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
              <MessageSquare size={32} className="text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Your Messages</h3>
            <p className="text-sm text-center max-w-sm text-slate-500">
              Select a conversation to start chatting with your peers, team members, or mentors.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
