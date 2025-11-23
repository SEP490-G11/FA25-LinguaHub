import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/config/axiosConfig";
import TutorInfo from "./components/sections/tutor-info";
import CalendarSlots, { SelectedSlot, PackageItem } from "./components/sections/calendar-slots";
import BenefitsCommitment from "./components/sections/benefits-commitment";
import BookingSummary from "./components/sections/booking-summary";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useToast } from "@/components/ui/use-toast";

interface Tutor {
  tutorId: number;
  name: string;
  avatarUrl?: string | null;
  country?: string;
  phone?: string | null;
  bio?: string | null;
  experience?: string | null;
  specialization?: string | null;
  teachingLanguage?: string | null;
  rating?: number;
  pricePerHour: number; // Giá cho 1 slot 60 phút (1 giờ)
  courses?: unknown[];
}

interface RawPackage {
  packageid: number;
  tutor_id: number;
  name: string;
  description: string;
  requirement?: string;
  objectives?: string;
  max_slots: number;
  is_active: boolean;
  slot_content?: { slot_number: number; content: string }[];
  min_booking_price_per_hour: number;
}

const BookTutor = () => {
  const { tutorId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: userLoading } = useUserInfo();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const summaryRef = useRef<HTMLDivElement | null>(null);

  /** Format VND */
  const formatVND = (value: number) =>
      value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  /** ===================== FETCH TUTOR + PACKAGES ===================== */
  useEffect(() => {
    const loadTutorData = async () => {
      try {
        // Fetch tutor
        const tutorRes = await api.get(`/tutors/${tutorId}`);
        const raw = tutorRes.data;
        const normalizedTutor: Tutor = {
          tutorId: raw.tutorId || raw.id || Number(tutorId),
          name: raw.userName || raw.name || raw.fullName || "Unnamed Tutor",
          avatarUrl: raw.avatarURL || raw.avatarUrl || raw.image || null,
          country: raw.country || "Unknown",
          phone: raw.phone || null,
          bio: raw.bio || raw.description || null,
          experience: raw.experience || null,
          specialization: raw.specialization || null,
          teachingLanguage: raw.teachingLanguage || null,
          rating: raw.rating || 0,
          pricePerHour: raw.price_per_hours || raw.pricePerHour || raw.hourlyRate || 0,
        };
        setTutor(normalizedTutor);

        /** ---------------- FETCH PACKAGES ---------------- */
        const pkgRes = await api.get(`/tutor/${tutorId}/packages`);
        const rawPkgs: RawPackage[] = pkgRes.data?.packages || [];
        const normalizedPkgs: PackageItem[] = rawPkgs.map((p) => ({
          packageId: p.packageid,
          tutorId: p.tutor_id,
          name: p.name,
          description: p.description,
          requirement: p.requirement || null,
          objectives: p.objectives || null,
          maxSlot: p.max_slots,
          numberOfLessons: p.slot_content?.length || p.max_slots,
          discountPercent: 0,
          active: p.is_active,
          /** 🟦 EXTRA: FULL CONTENT FOR CalendarSlots */
          lessonContent: p.slot_content || [],
          minBookingPricePerHour: p.min_booking_price_per_hour,
        }));
        setPackages(normalizedPkgs);
      } catch (error) {
        console.error("Load tutor data error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadTutorData();
  }, [tutorId]);

  /** ===================== SELECT PACKAGE ===================== */
  const handleSelectPackage = (pkg: PackageItem | null) => {
    setSelectedPackage(pkg);
    setSelectedSlots([]); // Reset slots when switching package
  };

  /** ===================== BOOKING ===================== */
  const handleBooking = async () => {
    if (selectedSlots.length === 0) {
      toast({
        variant: "destructive",
        title: "No sessions selected",
        description: "You must select at least 1 session.",
      });
      return;
    }
    if (selectedPackage && selectedSlots.length !== selectedPackage.maxSlot) {
      toast({
        variant: "destructive",
        title: "Incomplete package selection",
        description: `You must select exactly ${selectedPackage.maxSlot} sessions for this package.`,
      });
      return;
    }
    if (!user) {
      navigate(`/sign-in?redirect=/tutor/${tutorId}`);
      return;
    }
    try {
      const formattedSlots = selectedSlots.map((slot) => {
        const [hour, minute] = slot.time.split(":");
        const startTime = `${slot.date}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
        
        // Calculate end time: add 60 minutes (1 hour)
        const startMinutes = Number(hour) * 60 + Number(minute);
        const endMinutes = startMinutes + 60;
        const endHour = Math.floor(endMinutes / 60);
        const endMinute = endMinutes % 60;
        
        const endTime = `${slot.date}T${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
        return { startTime, endTime };
      });
      const body = {
        userId: user.userID,
        targetId: selectedPackage ? selectedPackage.packageId : selectedSlots[0].bookingPlanId,
        paymentType: "Booking",
        slots: formattedSlots,
      };
      const res = await api.post("/api/payments/create", body);
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        toast({
          variant: "destructive",
          title: "Payment creation failed",
          description: "Cannot create payment. Please try again.",
        });
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: "Failed to create payment. Please try again later.",
      });
    }
  };

  if (loading || userLoading) return <div className="text-center py-10">Loading...</div>;

  /** ===================== PRICE ===================== */
  // Each slot is 60 minutes (1 hour), pricePerHour is the price for one 1-hour slot
  const totalPrice = tutor
      ? selectedPackage
          ? selectedPackage.maxSlot * tutor.pricePerHour
          : selectedSlots.length * tutor.pricePerHour
      : 0;

  /** ===================== RENDER ===================== */
  return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button
              onClick={() => navigate(-1)}
              className="mb-6 text-blue-600 hover:text-blue-700 flex items-center space-x-2"
          >
            <span>←</span>
            <span>Back</span>
          </button>
          <div className="space-y-8">
            <TutorInfo tutor={tutor!} />
            <CalendarSlots
                tutorId={String(tutorId)}
                selectedSlots={selectedSlots}
                onSlotsChange={setSelectedSlots}
                packages={packages}
                selectedPackage={selectedPackage}
                onSelectPackage={handleSelectPackage}
                mySlotsEndpoint="/booking-slots/my-slots"
                myInfoEndpoint="/users/myInfo"
            />
            <BenefitsCommitment />
            <div ref={summaryRef}>
              <BookingSummary
                  tutor={tutor!}
                  selectedSlots={selectedSlots}
                  selectedPackage={selectedPackage}
                  totalPrice={totalPrice}
                  onConfirmBooking={handleBooking}
              />
            </div>
          </div>
        </div>
        {/* Sticky Bar */}
        {(selectedPackage || selectedSlots.length > 0) && tutor && (
            <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t p-4 z-50">
              <div className="max-w-7xl mx-auto flex justify-between items-center px-4">
                <div>
                  <p className="font-semibold text-gray-800">
                    {selectedSlots.length} session(s) selected
                  </p>
                  {selectedPackage ? (
                      <p className="text-sm text-gray-600">
                        {selectedSlots.length}/{selectedPackage.maxSlot} sessions —{" "}
                        {selectedSlots.length < selectedPackage.maxSlot
                            ? `select ${
                                selectedPackage.maxSlot - selectedSlots.length
                            } more`
                            : "ready to confirm"}
                      </p>
                  ) : (
                      <p className="text-sm text-gray-600 italic">
                        Slot-only booking (no package selected)
                      </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-blue-600 text-lg">
                    {formatVND(totalPrice)}
                  </p>
                  <button
                      onClick={() =>
                          summaryRef.current?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700"
                  >
                    Review & Confirm
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default BookTutor;
