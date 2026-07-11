import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Search, Send, FileText, MoreVertical, Check, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const MentorChat = () => {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('new_query', (query) => {
        setChats(prev => [query, ...prev]);
      });
      socket.on('chat_update', (updatedChat) => {
        setChats(prev => prev.map(c => c.id === updatedChat.id ? { ...c, ...updatedChat } : c));
        if (activeChat?.id === updatedChat.id) {
          setActiveChat(prev => ({ ...prev, ...updatedChat }));
        }
      });
      socket.on('new_message', ({ chatId, message }) => {
        if (activeChat?.id === chatId) {
          setMessages(prev => [...prev, message]);
        }
      });
    }
    return () => {
      if (socket) {
        socket.off('new_query');
        socket.off('chat_update');
        socket.off('new_message');
      }
    };
  }, [socket, activeChat]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
    }
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChats = async () => {
    try {
      const res = await api.get('/mentor-interactions/chats');
      setChats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const res = await api.get(`/mentor-interactions/chats/${chatId}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    try {
      await api.post(`/mentor-interactions/chats/${activeChat.id}/messages`, {
        text: newMessage
      });
      setNewMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!activeChat) return;
    try {
      await api.put(`/mentor-interactions/chats/${activeChat.id}`, { status });
      // update locally or rely on socket
    } catch (err) {
      console.error(err);
    }
  };

  const filteredChats = chats.filter(c => 
    c.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#050510] text-gray-100 overflow-hidden">
      {/* Sidebar - Chat List */}
      <div className="w-1/3 border-r border-white/10 flex flex-col bg-[#0A0A1B]">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-bold mb-4">Student Queries</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search students or queries..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => setActiveChat(chat)}
              className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${
                activeChat?.id === chat.id ? 'bg-blue-500/10 border-l-4 border-l-blue-500' : 'hover:bg-white/5'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold">{chat.student_name}</span>
                <span className="text-xs text-gray-500">
                  {format(new Date(chat.created_at?.toDate ? chat.created_at.toDate() : chat.created_at), 'MMM d')}
                </span>
              </div>
              <p className="text-sm text-gray-400 truncate">{chat.title}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  chat.status === 'Closed' ? 'bg-gray-500/20 text-gray-400' :
                  chat.status === 'Answered' ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {chat.status}
                </span>
              </div>
            </div>
          ))}
          {filteredChats.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              No queries found.
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#050510]">
        {activeChat ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0A0A1B]">
              <div>
                <h3 className="font-bold text-lg">{activeChat.title}</h3>
                <p className="text-sm text-gray-400">Asked by {activeChat.student_name} • {activeChat.category}</p>
              </div>
              <div className="flex items-center gap-3">
                {activeChat.status !== 'Closed' && (
                  <button 
                    onClick={() => handleUpdateStatus(activeChat.status === 'Answered' ? 'In Progress' : 'Answered')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeChat.status === 'Answered' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                    }`}
                  >
                    <CheckCircle size={16} />
                    {activeChat.status === 'Answered' ? 'Answered' : 'Mark Answered'}
                  </button>
                )}
                {activeChat.status !== 'Closed' && (
                  <button 
                    onClick={() => handleUpdateStatus('Closed')}
                    className="px-4 py-1.5 bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 rounded-lg text-sm font-medium transition-colors"
                  >
                    Close
                  </button>
                )}
                <button className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Original Query Context */}
            <div className="p-4 bg-blue-500/5 border-b border-blue-500/10">
              <p className="text-sm text-gray-300">{activeChat.description}</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => {
                const isMine = msg.sender_id === user.id;
                return (
                  <div key={msg.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isMine ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 text-gray-200 rounded-tl-none'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      <div className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${
                        isMine ? 'text-blue-200' : 'text-gray-400'
                      }`}>
                        {format(new Date(msg.timestamp?.toDate ? msg.timestamp.toDate() : msg.timestamp), 'h:mm a')}
                        {isMine && <Check size={12} />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {activeChat.status !== 'Closed' ? (
              <div className="p-4 bg-[#0A0A1B] border-t border-white/10">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <button type="button" className="p-3 text-gray-400 hover:text-white bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <FileText size={20} />
                  </button>
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type your reply..." 
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500"
                  />
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-4 bg-red-500/10 border-t border-red-500/20 text-center text-red-400 text-sm font-medium">
                This query has been closed. You cannot send more messages.
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <MessageSquare size={64} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">Select a student query to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorChat;
/ /   E O F  
 