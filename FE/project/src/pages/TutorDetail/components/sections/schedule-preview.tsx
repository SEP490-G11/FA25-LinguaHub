import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import api from "@/config/axiosConfig";

interface BookingPlan {
  booking_planid: number;
  tutor_id: number;
  title: string;
  date: string;
  start_hours: string;
  end_hours: string;
  slot_duration: number;
  price_per_hours: number;
  is_open: boolean;
  is_active: boolean;
}

interface SchedulePreviewProps {
  tutorId: number;
}

const formatDateFixed = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const getMonday = (d: Date) => {
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
};

const SchedulePreview = ({ tutorId }: SchedulePreviewProps) => {
  const [planByDate, setPlanByDate] = useState<Record<string, BookingPlan[]>>({});
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const currentWeekStart = getMonday(today);
  
  const weekDates = Array.from({ length: 7 }).map((_, i) => {
    const src = currentWeekStart;
    return new Date(src.getFullYear(), src.getMonth(), src.getDate() + i);
  });

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const planMap: Record<string, BookingPlan[]> = {};
        weekDates.forEach((d) => (planMap[formatDateFixed(d)] = []));

        const res = await api.get(`/tutor/${tutorId}/booking-plan`, { skipAuth: true });
        const rawPlans: BookingPlan[] = res?.data?.plans || [];

        const dayMap: Record<string, number> = {
          T2: 0,
          T3: 1,
          T4: 2,
          T5: 3,
          T6: 4,
          T7: 5,
          CN: 6,
        };

        rawPlans.forEach((plan) => {
          if (!plan.is_open || !plan.is_active) return;
          const idx = dayMap[plan.title as keyof typeof dayMap];
          if (idx === undefined) return;

          const date = formatDateFixed(weekDates[idx]);
          plan.date = date;
          planMap[date].push(plan);
        });

        setPlanByDate(planMap);
      } catch (err) {
        console.error("Error fetching schedule:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [tutorId]);

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-md">
        <p className="text-center text-gray-500">Đang tải lịch dạy...</p>
      </div>
    );
  }

  // Tạo danh sách lịch dạy hàng tuần
  const weeklySchedule: { day: string; times: string[] }[] = [];
  const fullDayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
  
  weekDates.forEach((date, i) => {
    const dateStr = formatDateFixed(date);
    const plans = planByDate[dateStr] || [];
    
    if (plans.length > 0) {
      const times = plans.map(plan => 
        `${plan.start_hours.substring(0, 5)} - ${plan.end_hours.substring(0, 5)}`
      );
      weeklySchedule.push({
        day: fullDayNames[i],
        times: times
      });
    }
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
        <Calendar className="text-blue-600" /> Lịch dạy hàng tuần
      </h3>
      
      {weeklySchedule.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          Gia sư chưa có lịch dạy cố định
        </p>
      ) : (
        <div className="space-y-3">
          {weeklySchedule.map((schedule, idx) => (
            <div 
              key={idx}
              className="flex items-start gap-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg"
            >
              <div className="flex-shrink-0">
                <span className="inline-block bg-yellow-100 text-yellow-800 font-bold text-sm px-3 py-1 rounded">
                  {schedule.day}
                </span>
              </div>
              <div className="flex-1">
                {schedule.times.map((time, timeIdx) => (
                  <div 
                    key={timeIdx}
                    className="text-gray-800 font-medium"
                  >
                    🕐 {time}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-4 text-center">
        Nhấn "Đặt lịch" để xem chi tiết và chọn slot phù hợp
      </p>
    </div>
  );
};

export default SchedulePreview;
