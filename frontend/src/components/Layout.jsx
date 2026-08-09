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
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#080A12] text-slate-900 dark:text-slate-100 font-sans print:block print:h-auto print:overflow-visible transition-colors duration-200">

      {/* Product Shell Sidebar (245px width) */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Right Column: Sticky Shell Header + Main Scrollable Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Sticky Shell Header (64px height) */}
        <ShellHeader onMobileMenuOpen={() => setMobileOpen(true)} />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 bg-[#F8FAFC] dark:bg-[#080A12] print:p-0 print:overflow-visible">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
};

export default Layout;