import { useState, useEffect, useCallback } from 'react';
import api from '@/config/axiosConfig.ts';
import HeroSection from './components/sections/hero-section';
import CalendarView from './components/sections/calendar-view';
import UpcomingSessions from './components/sections/upcoming-sessions';
import type {
  BookingSlot,
  BookingSlotAPI,
  BookingStats,
} from '@/types/MyBooking';
import { transformBookingSlot } from '@/types/MyBooking';

const MyBookings = () => {
  const [bookings, setBookings] = useState<BookingSlot[]>([]);
  const [userID, setUserID] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Fetch user ID
  useEffect(() => {
    api.get('/users/myInfo').then((res) => {
      setUserID(res.data.result?.userID);
    });
  }, []);

  // Fetch bookings function
  const fetchBookings = useCallback(() => {
    if (!userID) return;
    api.get('/booking-slots/my-slots').then((res) => {
      const apiSlots: BookingSlotAPI[] = res.data.result || [];
      // Transform API response - supports both camelCase and snake_case
      const mappedSlots: BookingSlot[] = apiSlots.map(transformBookingSlot);
      setBookings(mappedSlots);
    });
  }, [userID]);

  // Fetch bookings on mount and auto-refresh every 10 seconds
  useEffect(() => {
    fetchBookings();
    
    // Auto-refresh every 10 seconds
    const intervalId = setInterval(() => {
      fetchBookings();
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [fetchBookings]);

  const calculateStats = (): BookingStats => {
    const now = new Date();

    // Slot bị hủy bởi tutor: Rejected + không có learnerEvidence
    const cancelledSlots = bookings.filter((b) => {
      return b.status === 'Rejected' && !b.learnerEvidence;
    });

    // Slot sắp tới: endTime >= now VÀ status !== 'Rejected'
    const upcomingSlots = bookings.filter((b) => {
      const endTime = new Date(b.endTime);
      return endTime >= now && b.status !== 'Rejected';
    });

    // Slot đã qua: endTime < now (không quan tâm status)
    const expiredSlots = bookings.filter((b) => {
      const endTime = new Date(b.endTime);
      return endTime < now;
    });

    // Tổng giờ tính tất cả các slot
    const totalHours = bookings.reduce((acc, b) => {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);

    return {
      upcoming: upcomingSlots.length,
      expired: expiredSlots.length,
      cancelled: cancelledSlots.length,
      totalSlots: bookings.length,
      totalHours: Math.round(totalHours),
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <HeroSection stats={calculateStats()} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CalendarView
              onSelectDate={setSelectedDate}
              selectedDate={selectedDate}
              bookings={bookings}
              userID={userID}
            />
          </div>

          <div>
            <UpcomingSessions
              bookings={bookings}
              selectedDate={selectedDate}
              userID={userID}
              onRefresh={fetchBookings}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBookings;
