import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  CalendarDays,
  User,
  Package,
} from 'lucide-react';
import { StandardPageHeading, StandardFilters, StandardStatisticsCards } from '@/components/shared';

// Import API functions
import { studentsApi } from './students-api';

// Import utility functions
import {
  filterStudents,
  calculateCourseStats,
  calculateBookingStats,
} from './utils';

// Import types
import {
  CourseStudent,
  BookingStudent,
  CourseStudentDetail,
} from './types';

// Import components
import {
  CourseStudentsTable,
  BookingStudentsTable,
  CourseStudentDetailModal,
  BookingStudentDetailModal,
} from './components';

export default function TutorStudents() {
  const { toast } = useToast();

  // Course Students State
  const [courseStudents, setCourseStudents] = useState<CourseStudent[]>([]);
  const [courseStudentsLoading, setCourseStudentsLoading] = useState(false);

  // Booking Students State
  const [bookingStudents, setBookingStudents] = useState<BookingStudent[]>([]);
  const [bookingStudentsLoading, setBookingStudentsLoading] = useState(false);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Detail Modals State
  const [selectedCourseStudentDetail, setSelectedCourseStudentDetail] =
    useState<CourseStudentDetail | null>(null);
  const [courseDetailLoading, setCourseDetailLoading] = useState(false);
  const [showCourseDetailModal, setShowCourseDetailModal] = useState(false);

  const [selectedBookingStudent, setSelectedBookingStudent] =
    useState<BookingStudent | null>(null);
  const [showBookingDetailModal, setShowBookingDetailModal] = useState(false);

  // Refs for focus management
  const courseDetailButtonRef = useRef<HTMLButtonElement | null>(null);
  const bookingDetailButtonRef = useRef<HTMLButtonElement | null>(null);

  // Fetch course students on mount
  useEffect(() => {
    const fetchCourseStudents = async () => {
      setCourseStudentsLoading(true);
      try {
        const data = await studentsApi.getCourseStudents();
        setCourseStudents(data);
      } catch (error) {
        console.error('Error fetching course students:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể tải danh sách học viên khóa học',
          variant: 'destructive',
        });
      } finally {
        setCourseStudentsLoading(false);
      }
    };

    fetchCourseStudents();
  }, [toast]);

  // Fetch booking students on mount
  useEffect(() => {
    const fetchBookingStudents = async () => {
      setBookingStudentsLoading(true);
      try {
        const data = await studentsApi.getBookingStudents();
        setBookingStudents(data);
      } catch (error) {
        console.error('Error fetching booking students:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể tải danh sách học viên 1-1',
          variant: 'destructive',
        });
      } finally {
        setBookingStudentsLoading(false);
      }
    };

    fetchBookingStudents();
  }, [toast]);

  // Filter students based on debounced search query
  const filteredCourseStudents = useMemo(
    () => filterStudents(courseStudents, debouncedSearchQuery),
    [courseStudents, debouncedSearchQuery]
  );

  const filteredBookingStudents = useMemo(
    () => filterStudents(bookingStudents, debouncedSearchQuery),
    [bookingStudents, debouncedSearchQuery]
  );

  // Calculate statistics
  const courseStats = useMemo(
    () => calculateCourseStats(courseStudents),
    [courseStudents]
  );

  const bookingStats = useMemo(
    () => calculateBookingStats(bookingStudents),
    [bookingStudents]
  );

  // Handle course student detail view
  const handleViewCourseDetails = useCallback(
    async (studentId: number, buttonRef?: HTMLButtonElement) => {
      if (buttonRef) {
        courseDetailButtonRef.current = buttonRef;
      }
      setCourseDetailLoading(true);
      setShowCourseDetailModal(true);
      try {
        const detail = await studentsApi.getCourseStudentDetail(studentId);
        setSelectedCourseStudentDetail(detail);
      } catch (error) {
        console.error('Error fetching course student detail:', error);
        toast({
          title: 'Lỗi',
          description: 'Không thể tải thông tin chi tiết học viên',
          variant: 'destructive',
        });
        setShowCourseDetailModal(false);
      } finally {
        setCourseDetailLoading(false);
      }
    },
    [toast]
  );

  // Handle booking student detail view
  const handleViewBookingDetails = useCallback((studentId: number, buttonRef?: HTMLButtonElement) => {
    if (buttonRef) {
      bookingDetailButtonRef.current = buttonRef;
    }
    const student = bookingStudents.find((s) => s.userId === studentId);
    if (student) {
      setSelectedBookingStudent(student);
      setShowBookingDetailModal(true);
    }
  }, [bookingStudents]);

  // Handle modal close
  const handleCloseCourseDetailModal = useCallback(() => {
    setShowCourseDetailModal(false);
    setSelectedCourseStudentDetail(null);
    // Return focus to the button that opened the modal
    setTimeout(() => {
      courseDetailButtonRef.current?.focus();
    }, 100);
  }, []);

  const handleCloseBookingDetailModal = useCallback(() => {
    setShowBookingDetailModal(false);
    setSelectedBookingStudent(null);
    // Return focus to the button that opened the modal
    setTimeout(() => {
      bookingDetailButtonRef.current?.focus();
    }, 100);
  }, []);

  // Statistics data for course students
  const courseStatsData = [
    {
      label: 'Tổng học viên',
      value: courseStats.totalStudents,
      icon: Users,
      iconColor: '#16a34a', // green-600
    },
    {
      label: 'Đang hoạt động',
      value: courseStats.activeStudents,
      icon: TrendingUp,
      iconColor: '#16a34a', // green-600
    },
    {
      label: 'Tổng ghi danh',
      value: courseStats.totalEnrollments,
      icon: BookOpen,
      iconColor: '#16a34a', // green-600
    },
    {
      label: 'Tiến độ TB',
      value: `${courseStats.averageProgress}%`,
      icon: Award,
      iconColor: '#16a34a', // green-600
    },
  ];

  // Statistics data for booking students
  const bookingStatsData = [
    {
      label: 'Tổng học viên',
      value: bookingStats.totalStudents,
      icon: User,
      iconColor: '#7c3aed', // violet-600
    },
    {
      label: 'Tổng buổi đã đặt',
      value: bookingStats.totalPaidSlots,
      icon: Package,
      iconColor: '#7c3aed', // violet-600
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div>
        <StandardPageHeading
          title="Quản lý học viên"
          description="Theo dõi học viên khóa học và lịch 1-1"
          icon={Users}
          gradientFrom="from-blue-600"
          gradientVia="via-purple-600"
          gradientTo="to-purple-600"
        />

        <div className="bg-white border-t border-gray-100">
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <StandardFilters
              filters={[
                {
                  id: 'search',
                  type: 'search',
                  placeholder: 'Tìm kiếm học viên...',
                  value: searchQuery,
                  onChange: setSearchQuery,
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2" role="tablist">
            <TabsTrigger
              value="courses"
              className="flex items-center gap-2"
              aria-label="Tab học viên khóa học"
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              Học viên khóa học
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              className="flex items-center gap-2"
              aria-label="Tab học viên 1-1"
            >
              <CalendarDays className="w-4 h-4" aria-hidden="true" />
              Học viên 1-1
            </TabsTrigger>
          </TabsList>

          {/* Course Students Tab */}
          <TabsContent value="courses" className="space-y-6">
            <StandardStatisticsCards stats={courseStatsData} variant="default" />
            <Card>
              <CardContent className="p-6">
                <CourseStudentsTable
                  students={filteredCourseStudents}
                  onViewDetail={handleViewCourseDetails}
                  loading={courseStudentsLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Booking Students Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <StandardStatisticsCards stats={bookingStatsData} variant="default" />
            <Card>
              <CardContent className="p-6">
                <BookingStudentsTable
                  students={filteredBookingStudents}
                  onViewDetail={handleViewBookingDetails}
                  loading={bookingStudentsLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Course Student Detail Modal */}
      <CourseStudentDetailModal
        open={showCourseDetailModal}
        studentDetail={selectedCourseStudentDetail}
        loading={courseDetailLoading}
        onClose={handleCloseCourseDetailModal}
      />

      {/* Booking Student Detail Modal */}
      <BookingStudentDetailModal
        open={showBookingDetailModal}
        student={selectedBookingStudent}
        onClose={handleCloseBookingDetailModal}
      />
    </div>
  );
}
