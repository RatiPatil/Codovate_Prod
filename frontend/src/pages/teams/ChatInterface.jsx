import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { showAlert } from '../../utils/uiUtils';
import { formatTime } from '../../utils/dateUtils';

const ChatInterface = ({ initialChatId, onChatSelect }) => {
  const { currentUser } = useAuth();
  const { socket, isConnected } = useSocket();
  const [chatsList, setChatsList] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch list of chats
  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      setLoadingChats(true);
      const res = await api.get('/chat/list');
      setChatsList(res.data);
      
      if (initialChatId) {
        const found = res.data.find(c => c.id === initialChatId);
        if (found) {
          setActiveChat(found);
          onChatSelect?.(found.id);
        }
      } else if (res.data.length > 0 && !activeChat) {
        setActiveChat(res.data[0]);
        onChatSelect?.(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
      showAlert('Failed to load chats');
    } finally {
      setLoadingChats(false);
    }
  };

  // Fetch messages when activeChat changes
  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        const res = await api.get(`/chat/${activeChat.id}/messages`);
        setMessages(res.data);
      } catch (err) {
        console.error(err);
        showAlert('Failed to load messages');
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeChat]);

  // Socket listener for new messages
  useEffect(() => {
    if (!socket || !isConnected) return;

    // We join all rooms for our chats so we can receive real-time updates
    chatsList.forEach(chat => {
      if (chat.type === 'team') {
        socket.emit('join_team', chat.team_id); // legacy/fallback
        socket.emit('join_room', `team_${chat.team_id}`);
      } else if (chat.type === 'direct') {
        socket.emit('join_room', `chat_${chat.connection_id}`);
      }
    });

    const handleNewMessage = (data) => {
      const { chatId, message } = data;
      
      // If we are currently viewing this chat, append the message
      if (activeChat && activeChat.id === chatId) {
        setMessages(prev => {
          // avoid duplicates if we sent it and optimistic UI already added it
          if (prev.find(m => m.id === message.id || (m.isSending && m.text === message.text))) {
            return prev;
          }
          return [...prev, message];
        });
      }

      // Update the chats list last activity
      setChatsList(prev => {
        const idx = prev.findIndex(c => c.id === chatId);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = { ...updated[idx], last_activity: message.timestamp };
        // Sort again
        return updated.sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime());
      });
    };

    socket.on('new_message', handleNewMessage);
    
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, isConnected, chatsList, activeChat]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const tempId = `temp_${Date.now()}`;
    const newMsg = {
      id: tempId,
      sender_id: currentUser.id,
      sender_name: currentUser.name || 'You',
      text: inputText,
      timestamp: new Date().toISOString(),
      isSending: true
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    try {
      const res = await api.post(`/chat/${activeChat.id}/messages`, { text: newMsg.text });
      setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
    } catch (err) {
      console.error(err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      showAlert('Failed to send message');
    }
  };

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    onChatSelect?.(chat.id);
  };

  const renderChatAvatar = (chat) => {
    if (chat.type === 'team') {
      return chat.logo ? (
        <img loading="lazy" decoding="async" src={chat.logo} alt={chat.name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-sm font-bold text-gray-300">{chat.name?.charAt(0)}</span>
      );
    } else {
      return chat.peer?.avatar ? (
        <img loading="lazy" decoding="async" src={chat.peer.avatar} alt={chat.peer.name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-sm font-bold text-gray-300">{chat.peer?.name?.charAt(0)}</span>
      );
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#0a0a0c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
      
      {/* Sidebar - Chat List */}
      <div className={`md:w-80 border-r border-white/10 bg-[#0f0f11] flex flex-col h-full absolute md:relative z-20 w-full transition-transform duration-300 ${!activeChat ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#121215]">
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            <span>💬</span> Messages
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loadingChats ? (
            <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : chatsList.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No active chats. Connect with peers or join teams to start chatting!
            </div>
          ) : (
            chatsList.map(chat => {
              const isActive = activeChat?.id === chat.id;
              const displayName = chat.type === 'team' ? chat.name : chat.peer?.name;
              const typeIcon = chat.type === 'team' ? '💼' : '👤';
              
              return (
                <button
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={`w-full p-4 flex items-center gap-3 transition-colors text-left border-b border-white/5 ${
                    isActive ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-white/5'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden shrink-0 border ${
                    isActive ? 'border-primary/50' : 'border-white/10 bg-black/40'
                  }`}>
                    {renderChatAvatar(chat)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className={`font-semibold text-sm truncate ${isActive ? 'text-primary' : 'text-gray-200'}`}>
                        {displayName}
                      </h3>
                    </div>
                    <p className={`text-xs flex items-center gap-1.5 ${isActive ? 'text-primary/70' : 'text-gray-500'}`}>
                      <span>{typeIcon}</span> {chat.type === 'team' ? 'Team Chat' : 'Direct Message'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-[#0a0a0c] relative z-10 w-full">
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 hidden md:flex">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-4xl mb-4 text-gray-600">
              💬
            </div>
            <h3 className="text-xl font-bold text-gray-300 mb-2">Your Messages</h3>
            <p className="text-gray-500 max-w-sm">Select a conversation from the sidebar to view messages or start a new chat.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 bg-[#121215] flex items-center gap-4">
              <button 
                onClick={() => setActiveChat(null)}
                className="md:hidden text-gray-400 hover:text-white p-2 -ml-2"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              
              <div className="w-10 h-10 rounded-full border border-white/10 bg-black/40 flex items-center justify-center overflow-hidden shrink-0">
                {renderChatAvatar(activeChat)}
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">
                  {activeChat.type === 'team' ? activeChat.name : activeChat.peer?.name}
                </h3>
                <p className="text-xs text-primary font-medium">
                  {activeChat.type === 'team' ? 'Team Channel' : 'Direct Conversation'}
                </p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin bg-gradient-to-b from-[#0a0a0c] to-[#0f0f11]">
              {loadingMessages ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-50">
                  <span className="text-4xl mb-3">👋</span>
                  <p className="text-gray-400 text-sm">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = msg.sender_id === currentUser?.id;
                  const showHeader = idx === 0 || messages[idx-1].sender_id !== msg.sender_id;
                  
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      {showHeader && activeChat.type === 'team' && !isMine && (
                        <span className="text-xs text-gray-500 font-medium ml-1 mb-1">{msg.sender_name}</span>
                      )}
                      
                      <div className="flex items-end gap-2 max-w-[85%] lg:max-w-[70%]">
                        <div className={`px-4 py-2.5 rounded-2xl relative group ${
                          isMine 
                            ? 'bg-primary text-white rounded-br-sm shadow-md shadow-primary/20' 
                            : 'bg-white/10 text-gray-200 rounded-bl-sm border border-white/5'
                        } ${msg.isSending ? 'opacity-70' : ''}`}>
                          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{msg.text}</p>
                          
                          <div className={`text-[10px] mt-1.5 flex items-center gap-1 opacity-70 ${isMine ? 'justify-end text-primary-100' : 'text-gray-400'}`}>
                            {msg.timestamp ? (
                              <span>{typeof msg.timestamp === 'string' ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : formatTime(msg.timestamp)}</span>
                            ) : null}
                            {isMine && !msg.isSending && (
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/10 bg-[#121215]">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Message ${activeChat.type === 'team' ? activeChat.name : activeChat.peer?.name}...`}
                  className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors text-[15px]"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary text-white px-5 rounded-xl transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
