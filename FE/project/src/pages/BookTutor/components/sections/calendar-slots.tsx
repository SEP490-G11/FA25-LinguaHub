import { useState, useEffect } from "react";
import api from "@/config/axiosConfig";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Package,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

export interface PackageItem {
  packageId: number;
  tutorId: number;
  name: string;
  description: string;
  maxSlot: number;
  active: boolean;
  numberOfLessons: number;
  discountPercent: number;
  requirement?: string | null;
  objectives?: string | null;
  minBookingPricePerHour: number;
  lessonContent: { slot_number: number; content: string }[];
}

export interface BookingPlan {
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

export interface SelectedSlot {
  date: string;
  time: string;
  day: string;
  bookingPlanId: number;
}

type PlanByDate = Record<string, BookingPlan[]>;

interface CalendarSlotsProps {
  tutorId: string;
  selectedSlots: SelectedSlot[];
  onSlotsChange: React.Dispatch<React.SetStateAction<SelectedSlot[]>>;
  packages: PackageItem[];
  selectedPackage: PackageItem | null;
  onSelectPackage: (p: PackageItem | null) => void;
  mySlotsEndpoint?: string;
  myInfoEndpoint?: string;
}

const formatDateFixed = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Convert time string "HH:MM" to minutes since midnight
const timeToMinutes = (time: string): number => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};

const getMonday = (d: Date) => {
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
};

const formatVND = (price: number) => price.toLocaleString('vi-VN') + ' ₫';

const CalendarSlots = ({
                         tutorId,
                         selectedSlots,
                         onSlotsChange,
                         packages,
                         selectedPackage,
                         onSelectPackage,
                       }: CalendarSlotsProps) => {
  // ===== Packages =====
  const activePackages = packages.filter((p) => p.active === true);
  const ITEMS_PER_PAGE = 3;
  const totalPages = Math.max(1, Math.ceil(activePackages.length / ITEMS_PER_PAGE));
  const [page, setPage] = useState(0);
  const pagePackages = activePackages.slice(page * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  // ===== Calendar range (4 weeks from current Monday) =====
  const today = new Date();
  const firstAllowedWeek = getMonday(today);
  const fourthAllowedWeek = new Date(firstAllowedWeek);
  fourthAllowedWeek.setDate(fourthAllowedWeek.getDate() + 21);

  const [currentWeekStart, setCurrentWeekStart] = useState(firstAllowedWeek);
  const canGoPrev = currentWeekStart.getTime() !== firstAllowedWeek.getTime();
  const canGoNext = currentWeekStart.getTime() !== fourthAllowedWeek.getTime();

  const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  // Generate time slots: 30-minute intervals from 0:00 to 23:30 (48 slots total)
  const timeSlots = Array.from({ length: 48 }).map((_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  });
  
  const weekDates = Array.from({ length: 7 }).map((_, i) => {
    const src = currentWeekStart;
    return new Date(src.getFullYear(), src.getMonth(), src.getDate() + i);
  });

  // ===== Data states =====
  const [planByDate, setPlanByDate] = useState<PlanByDate>({});
  const [userId, setUserId] = useState<number | null>(null);

  // Slots booked by me (key -> true)
  const [bookedByMeMap, setBookedByMeMap] = useState<Record<string, boolean>>({});
  // Slots booked by others (key -> true). Fill from backend if available.
  const [bookedByOthersMap, setBookedByOthersMap] = useState<Record<string, boolean>>({});
  // Slots that are locked (key -> true)
  const [lockedSlotsMap, setLockedSlotsMap] = useState<Record<string, boolean>>({});

  // ===== Modal state for package detail =====
  const [selectedDetailPackage, setSelectedDetailPackage] = useState<PackageItem | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  
  // ===== Last update timestamp for visual feedback =====
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // ===== Fetch current user info =====
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/users/myInfo");
        if (!mounted) return;
        setUserId(res?.data?.result?.userID ?? null);
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);


  // ===== Fetch booked slots with polling =====
  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    let intervalId: NodeJS.Timeout;

    const fetchBookedSlots = async () => {
      try {
        const res = await api.get("/booking-slots/my-slots");
        const slots: { 
          status: string;
          slotid: number;
          booking_planid: number;
          tutor_id: number;
          user_id: number;
          start_time: string;
          end_time: string;
          payment_id: number;
          locked_at: string;
          expires_at: string;
          learner_name: string | null;
          meeting_url: string | null;
        }[] = res?.data?.result || [];

        const mine: Record<string, boolean> = {};
        const others: Record<string, boolean> = {};
        const locked: Record<string, boolean> = {};

        slots.forEach((s) => {
          const date = s.start_time.substring(0, 10);
          const hour = s.start_time.substring(11, 13);
          const key = `${date}T${hour}:00_plan_${s.booking_planid}`;

          if (s.status === "Locked") {
            // Slot đang bị khóa (chưa thanh toán)
            locked[key] = true;
          } else if (s.status === "Paid") {
            // Slot đã thanh toán
            if (s.user_id === userId) {
              mine[key] = true;
            } else {
              others[key] = true;
            }
          }
        });

        if (!mounted) return;
        setBookedByMeMap(mine);
        setBookedByOthersMap(others);
        setLockedSlotsMap(locked);
        setLastUpdate(new Date());
      } catch (err) {
        console.error("Error fetching booked slots:", err);
      }
    };

    // Fetch immediately
    fetchBookedSlots();

    // Poll every 10 seconds to update slot status
    intervalId = setInterval(fetchBookedSlots, 10000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [userId]);


  useEffect(() => {
    let mounted = true;

    (async () => {
      const planMap: PlanByDate = {};
      weekDates.forEach((d) => (planMap[formatDateFixed(d)] = []));

      try {
        const res = await api.get(`/tutor/${tutorId}/booking-plan`);
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
      } catch (err) {
        console.error("Error fetching booking plans:", err);
      }

      if (!mounted) return;
      setPlanByDate(planMap);
    })();

    return () => {
      mounted = false;
    };
  }, [currentWeekStart, tutorId]);

  // ===== Business rules =====
  const isSlotLimitReached = !!selectedPackage && selectedSlots.length >= selectedPackage.maxSlot;

  const getStatus = (
      plan: BookingPlan,
      timeSlot: string
  ): "Available" | "Selected" | "Booked" | "Your Slot" | "Locked" | null => {
    const slotMinutes = timeToMinutes(timeSlot);
    const startMinutes = timeToMinutes(plan.start_hours);
    const endMinutes = timeToMinutes(plan.end_hours);
    
    // Check if this time slot falls within the plan's time range
    if (!(slotMinutes >= startMinutes && slotMinutes < endMinutes)) return null;

    const slotKey = `${plan.date}T${timeSlot}_plan_${plan.booking_planid}`;

    // Check locked slots first
    if (lockedSlotsMap[slotKey]) return "Locked";
    
    // Check if it's my slot
    if (bookedByMeMap[slotKey]) return "Your Slot";
    
    // Check if booked by others
    if (bookedByOthersMap[slotKey]) return "Booked"; 

    const exists = selectedSlots.some(
        (s) => s.bookingPlanId === plan.booking_planid && s.time === timeSlot && s.date === plan.date
    );

    if (exists) return "Selected";
    if (isSlotLimitReached) return "Booked";

    return "Available";
  };

  // ===== Handle open detail modal =====
  const handleOpenDetail = (pkg: PackageItem) => {
    setSelectedDetailPackage(pkg);
    setOpenDetail(true);
  };

  // ===== Render =====
  return (
      <div className="bg-blue-50/50 p-6 rounded-xl shadow-md border border-blue-100">
        {/* PACKAGE SELECTOR */}
        <h2 className="text-xl font-bold mb-5 flex items-center gap-2 text-blue-900">
          <Package className="w-5 h-5 text-blue-600" /> Select a Learning Package
        </h2>

        {activePackages.length === 0 ? (
            <p className="text-gray-500 italic">No active packages available</p>
        ) : (
            <div className="relative w-full">
              <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="absolute -left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white shadow hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {pagePackages.map((pkg) => {
                  const active = selectedPackage?.packageId === pkg.packageId;
                  return (
                      <div
                          key={pkg.packageId}
                          className={`p-6 rounded-2xl border shadow-md transition ${
                              active
                                  ? "border-blue-600 bg-blue-100"
                                  : "border-gray-200 bg-white hover:bg-blue-50"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-yellow-500" />
                            <h3 className="font-bold">{pkg.name}</h3>
                          </div>

                          <Button
                              className="bg-blue-600 text-white hover:bg-blue-700"
                              size="sm"
                              onClick={() => handleOpenDetail(pkg)}
                          >
                            Detail
                          </Button>
                        </div>

                        <p className="text-sm text-gray-600 mt-2 mb-4">
                          {pkg.requirement || "No requirement"}
                        </p>

                        <div className="space-y-2 text-sm text-gray-700">
                          <p>
                            <b>Objectives:</b> {pkg.objectives || "No objectives provided"}
                          </p>
                          <p>
                            <b>Max Sessions:</b> {pkg.maxSlot}
                          </p>
                        </div>

                        <Button
                            className="w-full mt-4"
                            onClick={() => onSelectPackage(active ? null : pkg)}
                        >
                          {active ? "Unselect" : "Select"}
                        </Button>
                      </div>
                  );
                })}
              </div>

              <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="absolute -right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white shadow hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronRight />
              </button>
            </div>
        )}

        {/* WEEK NAV */}
        <div className="flex justify-between items-center my-8 px-1">
          <Button
              variant="outline"
              disabled={!canGoPrev}
              onClick={() => {
                const d = new Date(currentWeekStart);
                d.setDate(d.getDate() - 7);
                setCurrentWeekStart(d);
              }}
          >
            <ChevronLeft /> Previous
          </Button>

          <div className="text-lg font-semibold text-blue-900">
            Week of {formatDateFixed(currentWeekStart)}
          </div>

          <Button
              variant="outline"
              disabled={!canGoNext}
              onClick={() => {
                const d = new Date(currentWeekStart);
                d.setDate(d.getDate() + 7);
                setCurrentWeekStart(d);
              }}
          >
            Next <ChevronRight />
          </Button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-blue-900">
            <Calendar className="text-blue-600" /> Select Time Slots
          </h2>
          {lastUpdate && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Updated {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* TABLE */}
        <div className="relative overflow-auto rounded-lg border border-blue-200 bg-white shadow max-h-[600px]">
          <table className="w-full border-collapse relative">
            <thead className="sticky top-0 z-30">
            <tr className="bg-blue-100 text-blue-900">
              <th className="border p-2 sticky left-0 bg-blue-100 z-40 min-w-[70px]">Time</th>
              {weekDates.map((d, i) => (
                  <th key={i} className="border p-2 text-center min-w-[100px] bg-blue-100">
                    <div className="font-semibold">{weekdayLabels[i]}</div>
                    <div className="text-xs">{formatDateFixed(d)}</div>
                  </th>
              ))}
            </tr>
            </thead>

            <tbody>
            {timeSlots.map((timeSlot) => (
                <tr key={timeSlot}>
                  <td className="border p-1 bg-blue-50 font-medium text-xs sticky left-0 z-20 whitespace-nowrap">{timeSlot}</td>

                  {weekDates.map((date, col) => {
                    const dateStr = formatDateFixed(date);
                    const plans = planByDate[dateStr] || [];

                    const now = new Date();
                    const todayDate = new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        now.getDate()
                    );
                    const thisDay = new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate()
                    );

                    const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
                    const currentMinutes = now.getHours() * 60 + now.getMinutes();
                    const slotMinutes = slotHour * 60 + slotMinute;

                    if (
                        thisDay < todayDate ||
                        (thisDay.getTime() === todayDate.getTime() && slotMinutes <= currentMinutes)
                    ) {
                      return (
                          <td
                              key={col}
                              className="border p-1 text-center text-gray-300 bg-gray-50"
                          >
                            —
                          </td>
                      );
                    }

                    if (plans.length === 0) {
                      return (
                          <td
                              key={col}
                              className="border p-1 text-center text-gray-300"
                          >
                            —
                          </td>
                      );
                    }

                    return (
                        <td key={col} className="border p-1 text-center">
                          {plans.map((p) => {
                            const status = getStatus(p, timeSlot);
                            if (!status) return null;

                            const styleMap: Record<string, string> = {
                              Available:
                                  "bg-green-500/20 text-green-900 border-green-400 hover:bg-green-500/30",
                              Selected:
                                  "bg-blue-500/30 text-blue-900 border-blue-500",
                              Booked:
                                  "bg-red-400/20 text-red-700 border-red-300 cursor-not-allowed",
                              "Your Slot":
                                  "bg-yellow-500/30 text-yellow-900 border-yellow-500 cursor-not-allowed",
                              Locked:
                                  "bg-orange-400/20 text-orange-700 border-orange-300 cursor-not-allowed",
                            };

                            return (
                                <button
                                    key={p.booking_planid}
                                    disabled={status === "Booked" || status === "Your Slot" || status === "Locked"}
                                    onClick={() => {
                                      if (status === "Booked" || status === "Your Slot" || status === "Locked")
                                        return;

                                      onSlotsChange((prev) => {
                                        if (status === "Selected") {
                                          return prev.filter(
                                              (x) =>
                                                  !(
                                                      x.bookingPlanId === p.booking_planid &&
                                                      x.time === timeSlot &&
                                                      x.date === p.date
                                                  )
                                          );
                                        }

                                        if (isSlotLimitReached) return prev;

                                        return [
                                          ...prev,
                                          {
                                            date: p.date,
                                            time: timeSlot,
                                            day: weekdayLabels[col],
                                            bookingPlanId: p.booking_planid,
                                          },
                                        ];
                                      });
                                    }}
                                    className={`w-full h-8 rounded text-[10px] border transition ${styleMap[status!]}`}
                                    title={`${timeSlot} - ${status}`}
                                >
                                  {status === "Available" ? "✓" : status === "Selected" ? "✓" : status.substring(0, 1)}
                                </button>
                            );
                          })}
                        </td>
                    );
                  })}
                </tr>
            ))}
            </tbody>
          </table>
        </div>

        {selectedPackage && (
            <div className="mt-6 p-4 bg-blue-100 border border-blue-300 rounded-xl text-sm text-blue-900 shadow-sm">
              <b>{selectedPackage.name}</b> — Selected{" "}
              <b>{selectedSlots.length}</b>/<b>{selectedPackage.maxSlot}</b> slots
            </div>
        )}

        {/* Package Detail Modal */}
        <Dialog open={openDetail} onOpenChange={setOpenDetail}>
          <DialogContent className="sm:max-w-[600px] bg-white rounded-xl shadow-lg border border-blue-200 p-6">
            <DialogHeader className="relative">
              <DialogTitle className="text-2xl font-bold text-blue-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                {selectedDetailPackage?.name}
              </DialogTitle>
              <DialogClose className="absolute right-0 top-0 text-gray-500 hover:text-gray-700">
                {/*<X className="w-6 h-6" />*/}
              </DialogClose>
            </DialogHeader>
            <div className="mt-4 space-y-4 text-gray-700">
              <p className="text-sm">
                <b>Description:</b> {selectedDetailPackage?.description || "No description provided"}
              </p>
              <p className="text-sm">
                <b>Requirement:</b> {selectedDetailPackage?.requirement || "No requirement"}
              </p>
              <p className="text-sm">
                <b>Objectives:</b> {selectedDetailPackage?.objectives || "No objectives provided"}
              </p>
              <p className="text-sm">
                <b>Number of Lessons:</b> {selectedDetailPackage?.numberOfLessons}
              </p>
              <p className="text-sm">
                <b>Max Slots:</b> {selectedDetailPackage?.maxSlot}
              </p>
              {selectedDetailPackage?.discountPercent !== 0 && (
                  <p className="text-sm">
                    <b>Discount Percent:</b> {selectedDetailPackage?.discountPercent}%
                  </p>
              )}
              <p className="text-sm">
                <b>Min Booking Price per Hour:</b> {formatVND(selectedDetailPackage?.minBookingPricePerHour || 0)}
              </p>
              <div className="text-sm">
                <b>Lesson Content:</b>
                {selectedDetailPackage?.lessonContent?.length ? (
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      {selectedDetailPackage.lessonContent.map((lesson) => (
                          <li key={lesson.slot_number}>
                            Slot {lesson.slot_number}: {lesson.content}
                          </li>
                      ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 italic">No lesson content available</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default CalendarSlots;