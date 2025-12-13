import { Calendar, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface BookingData {
  courseName: string;
  sessionDate: string;
  sessionTime: string;
  duration: number;
  notes: string;
}

interface BookingFormProps {
  bookingData: BookingData;
  onBookingDataChange: (data: BookingData) => void;
  tutorAvailability: string[];
}

const BookingForm = ({
                       bookingData,
                       onBookingDataChange,
                       tutorAvailability,
                     }: BookingFormProps) => {

  const handleChange = (field: keyof BookingData, value: any) => {
    onBookingDataChange({
      ...bookingData,
      [field]: value,
    });
  };

  const durations = [
    { value: 30, label: "30 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" },
  ];

  // Prevent selecting past dates
  const today = new Date();
  const minDate = today.toISOString().split("T")[0];

  return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Book Your Session</h2>

        <div className="space-y-6">

          {/* COURSE NAME */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course / Topic
            </label>
            <Input
                type="text"
                placeholder="e.g., IELTS Writing, English Conversation, Business English"
                value={bookingData.courseName}
                onChange={(e) => handleChange("courseName", e.target.value)}
            />
          </div>

          {/* DATE + TIME */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* DATE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Session Date
              </label>
              <Input
                  type="date"
                  value={bookingData.sessionDate}
                  min={minDate}
                  onChange={(e) => handleChange("sessionDate", e.target.value)}
              />
            </div>

            {/* TIME */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Session Time
              </label>
              <Input
                  type="time"
                  value={bookingData.sessionTime}
                  onChange={(e) => handleChange("sessionTime", e.target.value)}
              />
            </div>

          </div>

          {/* DURATION */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {durations.map((option) => (
                  <button
                      key={option.value}
                      type="button"
                      onClick={() => handleChange("duration", option.value)}
                      className={`p-3 rounded-lg border-2 text-sm transition-all ${
                          bookingData.duration === option.value
                              ? "border-blue-600 bg-blue-50 text-blue-600 font-semibold"
                              : "border-gray-300 hover:border-gray-400"
                      }`}
                  >
                    {option.label}
                  </button>
              ))}
            </div>
          </div>

          {/* TUTOR AVAILABILITY */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tutor Availability
            </label>

            <div className="flex flex-wrap gap-2">
              {tutorAvailability.length === 0 ? (
                  <p className="text-sm text-gray-500">The tutor has not set availability.</p>
              ) : (
                  tutorAvailability.map((slot) => (
                      <span
                          key={slot}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                      >
                  {slot}
                </span>
                  ))
              )}
            </div>
          </div>

          {/* NOTES */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <Textarea
                placeholder="Tell your tutor what you want to focus on (e.g., grammar, pronunciation, writing task)..."
                rows={4}
                value={bookingData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
            />
          </div>
        </div>
      </div>
  );
};

export default BookingForm;
