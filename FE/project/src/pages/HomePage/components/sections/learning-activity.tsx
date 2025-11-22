import { motion } from 'framer-motion';
import { Calendar, Clock, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import api from '@/config/axiosConfig';
import { useNavigate } from 'react-router-dom';

interface BookingSlot {
    slotID: number;
    bookingPlanID: number;
    tutorID: number;
    userID: number;
    startTime: string;
    endTime: string;
    paymentID: number;
    status: string;
    lockedAt: string;
    expiresAt: string;
    userPackage: null;
}

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
                    const allSlots = slotsRes.data.result || [];
                    
                    // Filter slots that belong to current user and have status "Paid"
                    const userSlots = allSlots
                        .filter((b: any) => {
                            // Check if user_id matches (API returns user_id, not userID)
                            const slotUserId = b.user_id || b.userID;
                            return slotUserId === userId && b.status === 'Paid';
                        })
                        .sort((a: any, b: any) => {
                            // Sort by start time, newest first
                            const timeA = new Date(a.start_time || a.startTime).getTime();
                            const timeB = new Date(b.start_time || b.startTime).getTime();
                            return timeB - timeA;
                        })
                        .slice(0, 6)
                        .map((slot: any) => ({
                            slotID: slot.slotid || slot.slotID,
                            bookingPlanID: slot.booking_planid || slot.bookingPlanID,
                            tutorID: slot.tutor_id || slot.tutorID,
                            userID: slot.user_id || slot.userID,
                            startTime: slot.start_time || slot.startTime,
                            endTime: slot.end_time || slot.endTime,
                            paymentID: slot.payment_id || slot.paymentID,
                            status: slot.status,
                            lockedAt: slot.locked_at || slot.lockedAt,
                            expiresAt: slot.expires_at || slot.expiresAt,
                            userPackage: slot.user_package || slot.userPackage || null,
                        }));
                    
                    setBookings(userSlots);
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
                            <span>Your Booked Sessions</span>
                        </h2>
                        <p className="text-lg text-gray-600">
                            Keep track of your upcoming learning sessions
                        </p>
                    </div>

                    {bookings.length === 0 ? (
                        <Card className="p-12 text-center bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-blue-300">
                            <BookOpen className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Sessions Booked Yet</h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                Start your learning journey by booking a session with one of our expert tutors!
                            </p>
                            <Button 
                                onClick={() => navigate('/tutors')}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-3 text-lg"
                            >
                                Browse Tutors
                            </Button>
                        </Card>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {bookings.map((booking, index) => {
                                    const { date, time } = formatDateTime(booking.startTime);
                                    const endTime = formatDateTime(booking.endTime).time;
                                    const isExpired = isPast(booking.endTime);

                                    return (
                                        <motion.div
                                            key={booking.slotID}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.6, delay: index * 0.1 }}
                                        >
                                            <Card className={`p-6 border-l-4 hover:shadow-xl transition-all h-full ${
                                                isExpired 
                                                    ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-400' 
                                                    : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-500'
                                            }`}>
                                                <div className="flex flex-col h-full">
                                                    <div className="flex items-start space-x-4 flex-1">
                                                        <div className={`p-3 rounded-full shadow-md flex-shrink-0 ${
                                                            isExpired ? 'bg-gray-200' : 'bg-white'
                                                        }`}>
                                                            <Clock className={`w-6 h-6 ${
                                                                isExpired ? 'text-gray-500' : 'text-blue-600'
                                                            }`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${
                                                                    isExpired 
                                                                        ? 'bg-gray-300 text-gray-700' 
                                                                        : 'bg-blue-600 text-white'
                                                                }`}>
                                                                    {isExpired ? 'Past Session' : 'Upcoming'}
                                                                </span>
                                                            </div>
                                                            <h3 className="font-bold text-gray-900 mb-2 text-lg">
                                                                Session #{booking.slotID}
                                                            </h3>
                                                            <div className="space-y-1 text-sm text-gray-700">
                                                                <p className="flex items-center gap-2">
                                                                    <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                                    <span className="font-semibold">{date}</span>
                                                                </p>
                                                                <p className="flex items-center gap-2">
                                                                    <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                                    <span>{time} - {endTime}</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <Card className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center">
                                <h3 className="text-2xl font-bold mb-3">Ready for More Learning?</h3>
                                <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                                    Continue your progress by booking more sessions with our expert tutors. 
                                    Consistency is the key to mastering any language!
                                </p>
                                <div className="flex flex-wrap gap-4 justify-center">
                                    <Button 
                                        onClick={() => navigate('/tutors')}
                                        className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3 min-w-[200px]"
                                    >
                                        Book More Sessions
                                    </Button>
                                    <Button 
                                        onClick={() => navigate('/my-bookings')}
                                        className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-3 min-w-[200px]"
                                    >
                                        View All Bookings
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
