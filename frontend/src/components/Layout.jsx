import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ShellHeader from './ShellHeader';
import { useToast } from './ui/ToastProvider';
import { useSocket } from '../context/SocketContext';

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { addToast }  = useToast();
  const { socket }    = useSocket();

  /* Real-time connection request toast */
  useEffect(() => {
    if (!socket) return;
    const handleConnectionRequest = (conn) => {
      addToast({
        title: `🔔 New connection request from ${conn.sender_name || 'a student'}!`,
        type: 'success'
      });
    };
    socket.on('connection_request', handleConnectionRequest);
    return () => socket.off('connection_request', handleConnectionRequest);
  }, [socket, addToast]);

  return (
    <div className="flex h-screen overflow-hidden print:block print:h-auto print:overflow-visible">

      {/* Dark sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Right: header + scrollable content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Sticky shell header */}
        <ShellHeader onMobileMenuOpen={() => setMobileOpen(true)} />

        {/* Light content area */}
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden print:p-0 print:overflow-visible"
          style={{ background: '#f0f2ff' }}
        >
          {children}
        </main>

      </div>
    </div>
  );
};

export default Layout;