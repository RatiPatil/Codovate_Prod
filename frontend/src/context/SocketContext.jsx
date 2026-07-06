import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext({ socket: null, isConnected: false, onlineUsers: [] });

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!token) return;

    const getSocketUrl = () => {
      if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
      if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL.replace('/api', '');
      return 'http://localhost:5000';
    };
    
    const socketUrl = getSocketUrl();
    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      if (user?.id) newSocket.emit('join', user.id);
      if (user?.role && user.role.includes('admin') || user?.role === 'mentor') {
        newSocket.emit('join_admin', { role: user.role, id: user.id });
      }
      newSocket.emit('join_global');
    });

    newSocket.on('online_users', (users) => setOnlineUsers(users));
    newSocket.on('user_online', (userId) => setOnlineUsers(prev => [...new Set([...prev, userId])]));
    newSocket.on('user_offline', (userId) => setOnlineUsers(prev => prev.filter(id => id !== userId)));

    newSocket.on('disconnect', () => setIsConnected(false));

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);