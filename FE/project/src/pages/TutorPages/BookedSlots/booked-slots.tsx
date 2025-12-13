import { useState, useEffect, useCallback } from 'react';
import api from '@/config/axiosConfig';
import CalendarView from './components/sections/calendar-view';
import UpcomingSessions from './components/sections/upcoming-sessions';
import { StandardPageHeading, StandardStatisticsCards } from '@/components/shared';
import {
  Calendar,
  Users,
  BookOpen,
  CalendarClock,
  CalendarCheck
} from 'lucide-react';

// Type definitions
export type SlotStatus = 'Available' | 'Booked' | 'Completed' | 'Cancelled' | 'Paid' | 'Rejected';

// Interface cho UserPackage từ API
export interface UserPackageInfo {
  userPackageID: number;
  tutorPackage: {
    packageid: number;
    name: string;
    description: string;
    requirement: string;
    objectives: string;
    max_slots: number;
    slot_content: Array<{ slot_number: number; content: string }>;
    is_active: boolean;
  } | null;
  slotsRemaining: number;
  isActive: boolean;
}

export interface BookedSlot {
  slotid: number;
  booking_planid: number;
  tutor_id: number;
  user_id: number;
  start_time: string;        // ISO 8601 format
  end_time: string;          // ISO 8601 format
  status: SlotStatus;
  original_status: string;   // Original status from API (Paid, Rejected, etc.)
  learner_name: string;
  meeting_url: string | null;
  payment_id: number | null;
  locked_at: string | null;
  expires_at: string | null;
  tutor_join: boolean | null;
  tutor_evidence: string | null;
  learner_join: boolean | null;
  learner_evidence: string | null;
  user_package: UserPackageInfo | null;
  user_package_id: number | null;
  tutor_package_id: number | null;
}

// API Response - supports both camelCase (local) and snake_case (production)
interface BookedSlotAPI {
  status: string;
  // snake_case (production)
  slotid?: number;
  booking_planid?: number;
  tutor_id?: number;
  user_id?: number;
  start_time?: string;
  end_time?: string;
  tutor_fullname?: string;
  meeting_url?: string | null;
  payment_id?: number | null;
  locked_at?: string | null;
  expires_at?: string | null;
  learner_join?: boolean | null;
  tutor_join?: boolean | null;
  learner_evidence?: string | null;
  tutor_evidence?: string | null;
  user_package?: any;
  user_package_id?: number | null;
  tutor_package_id?: number | null;
  // camelCase (local)
  slotID?: number;
  bookingPlanID?: number;
  tutorID?: number;
  userID?: number;
  startTime?: string;
  endTime?: string;
  tutorFullName?: string;
  meetingUrl?: string | null;
  paymentID?: number | null;
  lockedAt?: string | null;
  expiresAt?: string | null;
  learnerJoin?: boolean | null;
  tutorJoin?: boolean | null;
  learnerEvidence?: string | null;
  tutorEvidence?: string | null;
  userPackage?: any;
  userPackageId?: number | null;
  tutorPackageID?: number | null;
}

interface BookingStats {
  upcoming: number;
  completed: number;
  totalSlots: number;
  totalStudents: number;
}

const BookedSlots = () => {
  const [bookings, setBookings] = useState<BookedSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    try {
      // Fetch students first
      const studentsRes = await api.get('/api/tutors/booking-students');
      let studentMap: Record<number, string> = {};

      if (studentsRes.data.code === 0 && studentsRes.data.result) {
        studentsRes.data.result.forEach((student: any) => {
          // API returns userId (lowercase i), not userID
          studentMap[student.userId] = student.fullName;
        });
        console.log('Students map:', studentMap);
      }

      // Then fetch bookings with student names - supports both camelCase and snake_case
      const bookingsRes = await api.get('/booking-slots/my-slots');
      const apiSlots: BookedSlotAPI[] = bookingsRes.data.result || [];
      const mappedSlots: BookedSlot[] = apiSlots.map((b): BookedSlot => {
        const userId = b.user_id ?? b.userID ?? 0;
        return {
          slotid: b.slotid ?? b.slotID ?? 0,
          booking_planid: b.booking_planid ?? b.bookingPlanID ?? 0,
          tutor_id: b.tutor_id ?? b.tutorID ?? 0,
          user_id: userId,
          start_time: b.start_time ?? b.startTime ?? '',
          end_time: b.end_time ?? b.endTime ?? '',
          status: (b.status === 'Paid' || b.status === 'Rejected' ? 'Booked' : b.status) as SlotStatus,
          original_status: b.status, // Keep original status for business logic
          learner_name: studentMap[userId] || `User ${userId}`,
          meeting_url: b.meeting_url ?? b.meetingUrl ?? null,
          payment_id: b.payment_id ?? b.paymentID ?? null,
          locked_at: b.locked_at ?? b.lockedAt ?? null,
          expires_at: b.expires_at ?? b.expiresAt ?? null,
          tutor_join: b.tutor_join ?? b.tutorJoin ?? null,
          tutor_evidence: b.tutor_evidence ?? b.tutorEvidence ?? null,
          learner_join: b.learner_join ?? b.learnerJoin ?? null,
          learner_evidence: b.learner_evidence ?? b.learnerEvidence ?? null,
          user_package: b.user_package ?? b.userPackage ?? null,
          user_package_id: b.user_package_id ?? b.userPackageId ?? null,
          tutor_package_id: b.tutorPackageID ?? b.tutor_package_id ?? null,
        };
      });

      setBookings(mappedSlots);
      console.log('Mapped bookings with names:', mappedSlots);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }, []);

  // Fetch all data on mount and auto-refresh every 10 seconds
  useEffect(() => {
    fetchAllData();
    
    // Auto-refresh every 10 seconds
    const intervalId = setInterval(() => {
      fetchAllData();
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [fetchAllData]);

  const calculateStats = (): BookingStats => {
    const now = new Date();

    const upcomingSlots = bookings.filter((b) => {
      if (!b.end_time) return false;
      const endTime = new Date(b.end_time);
      return !isNaN(endTime.getTime()) && endTime >= now;
    });

    const completedSlots = bookings.filter((b) => {
      // Count slots where tutor has joined (tutor_join === true)
      return b.tutor_join === true;
    });

    // Count unique students (unique user_id)
    const uniqueStudents = new Set(bookings.map(b => b.user_id)).size;

    return {
      upcoming: upcomingSlots.length,
      completed: completedSlots.length,
      totalSlots: bookings.length,
      totalStudents: uniqueStudents,
    };
  };

  /* Statistics data using standardized format */
  const stats = calculateStats();

  const statsDataEntries = [
    {
      label: 'Tổng số học viên',
      value: stats.totalStudents,
      icon: Users,
      iconColor: '#3b82f6', // blue-500
      bgColor: '#eff6ff', // blue-50
    },
    {
      label: 'Ca dạy sắp tới',
      value: stats.upcoming,
      icon: CalendarClock,
      iconColor: '#eab308', // yellow-500
      bgColor: '#fefce8', // yellow-50
    },
    {
      label: 'Đã hoàn thành',
      value: stats.completed,
      icon: CalendarCheck,
      iconColor: '#22c55e', // green-500
      bgColor: '#f0fdf4', // green-50
    },
    {
      label: 'Tổng số ca dạy',
      value: stats.totalSlots,
      icon: BookOpen,
      iconColor: '#a855f7', // purple-500
      bgColor: '#faf5ff', // purple-50
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div>
        <StandardPageHeading
          title="Lịch đã đặt"
          description="Quản lý lịch dạy và theo dõi các ca học của bạn"
          icon={Calendar}
          gradientFrom="from-blue-600"
          gradientVia="via-blue-500"
          gradientTo="to-cyan-500"
          statistics={[]}
        />
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        {/* Statistics Section */}
        <section aria-label="Thống kê">
          <StandardStatisticsCards stats={statsDataEntries} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CalendarView
              onSelectDate={setSelectedDate}
              selectedDate={selectedDate}
              bookings={bookings}
            />
          </div>

          <div>
            <UpcomingSessions
              bookings={bookings}
              selectedDate={selectedDate}
              onRefresh={fetchAllData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookedSlots;
