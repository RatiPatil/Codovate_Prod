import React, { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useToast } from './ui/ToastProvider';
import { useAuth } from '../context/AuthContext';

const GlobalNotifications = () => {
  const { socket, isConnected } = useSocket();
  const { addToast } = useToast();
  const { user } = useAuth();

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
  return null;
};

export default GlobalNotifications;
