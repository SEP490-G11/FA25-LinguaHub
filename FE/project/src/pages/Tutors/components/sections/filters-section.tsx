import { motion } from "framer-motion";
import { Filter, Star, RotateCcw } from "lucide-react";

interface FiltersSectionProps {
  languages: string[];
  selectedLanguage: string;
  priceSort: "none" | "asc" | "desc";
  selectedRating: number;
  tutorCount: number;
  selectedDay: string;
  onLanguageChange: (value: string) => void;
  onPriceSortChange: (sort: "none" | "asc" | "desc") => void;
  onRatingChange: (rating: number) => void;
  onDayChange: (day: string) => void;
  onResetFilters: () => void;
}

const FiltersSection = ({
                          languages,
                          selectedLanguage,
                          priceSort,
                          selectedRating,
                          tutorCount,
                          selectedDay,
                          onLanguageChange,
                          onPriceSortChange,
                          onRatingChange,
                          onDayChange,
                          onResetFilters,
                        }: FiltersSectionProps) => {
  const daysOfWeek = ["All", "T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const dayLabels: Record<string, string> = {
    "All": "Tất cả",
    "T2": "Thứ 2",
    "T3": "Thứ 3",
    "T4": "Thứ 4",
    "T5": "Thứ 5",
    "T6": "Thứ 6",
    "T7": "Thứ 7",
    "CN": "Chủ nhật"
  };
  const priceSortOptions = [
    { value: "none", label: "Mặc định" },
    { value: "asc", label: "Giá: Thấp → Cao" },
    { value: "desc", label: "Giá: Cao → Thấp" },
  ];
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  return (
      <section className="py-4 bg-white border-b">
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <motion.div
              className="space-y-3"
              initial="initial"
              animate="animate"
              variants={fadeInUp}
          >
            {/* Single Row: All filters compact */}
            <div className="flex items-center justify-center gap-3 flex-nowrap overflow-x-auto">
              {/* FILTER LABEL */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Filter className="w-3.5 h-3.5 text-gray-600" />
                <span className="font-medium text-gray-700 text-xs">Bộ lọc:</span>
              </div>

              {/* === TEACHING LANGUAGE SELECT === */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <label className="text-xs font-medium text-gray-600">
                  Ngôn ngữ:
                </label>
                <select
                    value={selectedLanguage}
                    onChange={(e) => onLanguageChange(e.target.value)}
                    className="border-2 border-gray-400 rounded-md px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  {(languages ?? []).map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                  ))}
                </select>
              </div>

              {/* === DAY OF WEEK FILTER === */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <label className="text-xs font-medium text-gray-600">
                  Ngày dạy:
                </label>
                <select
                    value={selectedDay}
                    onChange={(e) => onDayChange(e.target.value)}
                    className="border-2 border-gray-400 rounded-md px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  {daysOfWeek.map((day) => (
                      <option key={day} value={day}>
                        {dayLabels[day]}
                      </option>
                  ))}
                </select>
              </div>

              {/* === PRICE SORT === */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <label className="text-xs font-medium text-gray-600">
                  Sắp xếp giá:
                </label>
                <select
                    value={priceSort}
                    onChange={(e) => onPriceSortChange(e.target.value as "none" | "asc" | "desc")}
                    className="border-2 border-gray-400 rounded-md px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  {priceSortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                  ))}
                </select>
              </div>

              {/* === RATING FILTER === */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <label className="text-xs font-medium text-gray-600">Đánh giá:</label>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = selectedRating >= star;
                    return (
                        <button
                            key={star}
                            type="button"
                            onClick={() =>
                                onRatingChange(selectedRating === star ? 0 : star)
                            }
                        >
                          <Star
                              className={`w-3.5 h-3.5 ${
                                  active
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                              }`}
                          />
                        </button>
                    );
                  })}
                </div>
              </div>

              {/* === RESET BUTTON === */}
              <button
                  onClick={onResetFilters}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors border border-gray-300"
              >
                <RotateCcw className="w-3 h-3" />
                Đặt lại
              </button>
            </div>

            {/* === TUTOR COUNT - Row 2 === */}
            <div className="text-center text-sm text-gray-900">
              Tìm thấy <span className="font-semibold">{tutorCount}</span> gia sư
            </div>
          </motion.div>
        </div>
      </section>
  );
};

export default FiltersSection;
