import { motion } from 'framer-motion';
import { Calendar, Clock, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import api from '@/config/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { BookingSlotAPI, transformBookingSlot } from '@/types/MyBooking';
import type { BookingSlot } from '@/types/MyBooking';

const LearningActivity = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<BookingSlot[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRes = await api.get('/users/myInfo');
                const userId = userRes.data.result?.userID;

                if (userId) {
                    const slotsRes = await api.get('/booking-slots/my-slots');
                    const apiSlots: BookingSlotAPI[] = slotsRes.data.result || [];
                    const now = new Date();
                    
                    // Transform and filter upcoming sessions
                    const mappedSlots: BookingSlot[] = apiSlots
                        .map(transformBookingSlot)
                        .filter((b) => {
                            // Only show upcoming sessions (not past)
                            const endTime = new Date(b.endTime);
                            return b.userID === userId && b.status === 'Paid' && endTime >= now;
                        })
                        .sort((a, b) => {
                            // Sort by start time, soonest first (ascending order)
                            const timeA = new Date(a.startTime).getTime();
                            const timeB = new Date(b.startTime).getTime();
                            return timeA - timeB;
                        })
                        .slice(0, 6);
                    
                    setBookings(mappedSlots);
                }
            } catch (error) {
                console.error('Failed to fetch bookings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return {
            date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const isPast = (endTime: string) => {
        return new Date(endTime) < new Date();
    };

    if (loading) {
        return (
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-gray-600">Loading your bookings...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="py-16 bg-gradient-to-b from-white to-blue-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center space-x-3">
                            <Calendar className="w-10 h-10 text-blue-600" />
                            <span>Các buổi học đã đặt</span>
                        </h2>
                        <p className="text-lg text-gray-600">
                            Theo dõi các buổi học sắp tới của bạn
                        </p>
                    </div>

                    {bookings.length === 0 ? (
                        <Card className="p-12 text-center bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-blue-300">
                            <BookOpen className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Chưa đặt buổi học nào</h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                Bắt đầu hành trình học tập của bạn bằng cách đặt buổi học với một trong những gia sư chuyên gia của chúng tôi!
                            </p>
                            <Button 
                                onClick={() => navigate('/tutors')}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-3 text-lg"
                            >
                                Duyệt gia sư
                            </Button>
                        </Card>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {bookings.map((booking, index) => {
                                    const { date, time } = formatDateTime(booking.startTime);
                                    const endTime = formatDateTime(booking.endTime).time;

                                    return (
                                        <motion.div
                                            key={booking.slotID}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.6, delay: index * 0.1 }}
                                        >
                                            <Card className="p-6 border-l-4 hover:shadow-xl transition-all min-h-[200px] flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 border-blue-500">
                                                <div className="flex items-start space-x-4">
                                                    <div className="p-3 rounded-full shadow-md flex-shrink-0 bg-white">
                                                        <Clock className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center mb-2">
                                                            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-600 text-white">
                                                                Sắp tới
                                                            </span>
                                                        </div>
                                                        <h3 className="font-bold text-gray-900 mb-3 text-base">
                                                            Buổi học #{booking.slotID}
                                                        </h3>
                                                        
                                                        {/* Tutor Info - Clickable */}
                                                        {booking.tutorFullName && (
                                                            <div className="mb-3 text-sm">
                                                                <span className="font-semibold text-gray-900">Gia sư: </span>
                                                                <button
                                                                    onClick={() => navigate(`/tutors/${booking.tutorID}`)}
                                                                    className="text-blue-600 font-medium hover:text-blue-700 hover:underline transition-colors"
                                                                >
                                                                    {booking.tutorFullName}
                                                                </button>
                                                            </div>
                                                        )}
                                                        
                                                        <div className="space-y-2 text-sm text-gray-700">
                                                            <p className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                                <span className="font-medium">{date}</span>
                                                            </p>
                                                            <p className="flex items-center gap-2">
                                                                <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                                <span>{time} - {endTime}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <Card className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center">
                                <h3 className="text-2xl font-bold mb-3">Sẵn sàng học thêm?</h3>
                                <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                                    Tiếp tục tiến bộ của bạn bằng cách đặt thêm buổi học với các gia sư chuyên gia của chúng tôi. 
                                    Kiên trì là chìa khóa để thành thạo bất kỳ ngôn ngữ nào!
                                </p>
                                <div className="flex flex-wrap gap-4 justify-center">
                                    <Button 
                                        onClick={() => navigate('/tutors')}
                                        className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 min-w-[200px]"
                                    >
                                        Đặt thêm buổi học
                                    </Button>
                                    <Button 
                                        onClick={() => navigate('/learner/bookings')}
                                        className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-3 min-w-[200px]"
                                    >
                                        Xem tất cả lịch đặt
                                    </Button>
                                </div>
                            </Card>
                        </>
                    )}
                </motion.div>
            </div>
        </section>
    );
};

export default LearningActivity;
