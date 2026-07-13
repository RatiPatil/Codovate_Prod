import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiV1 from '../api/v1/api';
import { useToast } from './ui/ToastProvider';

const GlobalNotifications = () => {
  const { socket, isConnected } = useSocket();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [startedApp, setStartedApp] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    // Check if the user has a "Started" application that they haven't completed
    apiV1.get('/applications/my')
      .then(res => {
        const started = res.data?.applications?.find(app => app.status === 'Started');
        if (started) {
          // Show popup if they started it > 5 minutes ago (for demo, just show it immediately if they return)
          setStartedApp(started);
        }
      }).catch(console.error);
  }, [user]);

  const handleUpdateStatus = async (status, statusCode) => {
    try {
      await apiV1.put(`/applications/${startedApp.id}/status/student`, {
        status: status,
        status_code: statusCode,
        description: `Confirmed from reminder popup`
      });
      setStartedApp(null);
      navigate('/applications');
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    // 1. Notify mentor when session is booked
    const handleNewBooking = (data) => {
      if (user.role === 'mentor' || user.role.includes('admin')) {
        addToast({
          type: 'info',
          title: 'New Session Booked',
          message: `A student has booked a session with you on ${new Date(data.scheduled_time).toLocaleString()}.`,
          duration: 8000
        });
      }
    };

    // 2. Notify student when booking is confirmed/updated
    const handleStudentBookingConfirmed = (data) => {
      addToast({
        type: 'success',
        title: 'Booking Confirmed!',
        message: `Your session with ${data.mentorName || 'your mentor'} has been confirmed.`,
        duration: 8000
      });
    };

    // 3. Notify mentor when a query is submitted
    const handleNewQuery = (data) => {
      if (user.role === 'mentor' || user.role.includes('admin')) {
        addToast({
          type: 'info',
          title: 'New Query Assigned',
          message: `You've been assigned a new ${data.priority || 'Medium'} priority query: "${data.title}".`,
          duration: 8000
        });
      }
    };

    // 4. Notify student when mentor replies
    const handleQueryUpdate = (data) => {
      if (data.status === 'Answered') {
        addToast({
          type: 'success',
          title: 'Query Answered!',
          message: `A mentor has replied to your query: "${data.title}".`,
          duration: 8000
        });
      } else if (data.status === 'In Progress') {
        addToast({
          type: 'info',
          title: 'Query In Progress',
          message: `A mentor has started looking into your query: "${data.title}".`,
          duration: 5000
        });
      }
    };

    socket.on('new_booking', handleNewBooking);
    socket.on('mentor_session_update', handleNewBooking); // Also catches session updates on mentor side
    socket.on('student_booking_confirmed', handleStudentBookingConfirmed);
    socket.on('new_query', handleNewQuery);
    socket.on('query_update', handleQueryUpdate);

    return () => {
      socket.off('new_booking', handleNewBooking);
      socket.off('mentor_session_update', handleNewBooking);
      socket.off('student_booking_confirmed', handleStudentBookingConfirmed);
      socket.off('new_query', handleNewQuery);
      socket.off('query_update', handleQueryUpdate);
    };
  }, [socket, isConnected, user, addToast]);

  // This component doesn't render anything, it just listens.
  return (
    <>
      {startedApp && (
        <div className="fixed bottom-4 right-4 z-[100] max-w-sm w-full glass-panel p-5 border border-primary/30 shadow-[0_0_20px_rgba(32,21,255,0.2)] rounded-2xl animate-fade-in-up">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-white">Application Reminder</h3>
            <button onClick={() => setStartedApp(null)} className="text-gray-500 hover:text-white">&times;</button>
          </div>
          <p className="text-sm text-gray-300 mb-4">
            Did you finish your application to <strong className="text-primary">{startedApp.company_name}</strong>? Update your status to track your progress!
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => handleUpdateStatus('Applied', 'APPLIED')}
              className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-primary-dark transition"
            >
              Yes, I Applied
            </button>
            <button 
              onClick={() => navigate('/applications')}
              className="flex-1 bg-white/5 border border-white/10 text-white text-xs font-bold py-2 rounded-lg hover:bg-white/10 transition"
            >
              Go to Tracker
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalNotifications;
