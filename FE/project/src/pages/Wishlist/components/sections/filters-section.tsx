import { motion } from "framer-motion";
import { Filter, Star, RotateCcw } from "lucide-react";


interface FiltersSectionProps {
  categories: string[];
  selectedCategory: string;
  selectedLevel: string;
  selectedRating: number;
  priceSort: "none" | "asc" | "desc";
  itemCount: number;
  onCategoryChange: (value: string) => void;
  onLevelChange: (value: string) => void;
  onRatingChange: (rating: number) => void;
  onPriceSortChange: (sort: "none" | "asc" | "desc") => void;
}

const FiltersSection = ({
  categories,
  selectedCategory,
  selectedLevel,
  selectedRating,
  priceSort,
  itemCount,
  onCategoryChange,
  onLevelChange,
  onRatingChange,
  onPriceSortChange,
}: FiltersSectionProps) => {
  const levelOptions = [
    { value: "Tất cả", label: "Tất cả cấp độ" },
    { value: "BEGINNER", label: "BEGINNER" },
    { value: "INTERMEDIATE", label: "INTERMEDIATE" },
    { value: "ADVANCED", label: "ADVANCED" },
  ];

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

  const handleReset = () => {
    onCategoryChange("Tất cả");
    onLevelChange("Tất cả");
    onRatingChange(0);
    onPriceSortChange("none");
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
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {/* FILTER LABEL */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-700 text-sm">Bộ lọc:</span>
            </div>

            {/* CATEGORY SELECT */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <label className="text-sm font-medium text-gray-600">
                Danh mục:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="border-2 border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[130px]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* LEVEL SELECT */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <label className="text-sm font-medium text-gray-600">
                Cấp độ:
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => onLevelChange(e.target.value)}
                className="border-2 border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[130px]"
              >
                {levelOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* RATING FILTER */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <label className="text-sm font-medium text-gray-600">
                Đánh giá:
              </label>
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
                        className={`w-4 h-4 ${
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

            {/* PRICE SORT */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <label className="text-sm font-medium text-gray-600">
                Sắp xếp:
              </label>
              <select
                value={priceSort}
                onChange={(e) =>
                  onPriceSortChange(e.target.value as "none" | "asc" | "desc")
                }
                className="border-2 border-gray-300 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[140px]"
              >
                {priceSortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* RESET BUTTON */}
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-gray-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Đặt lại
            </button>
          </div>

          {/* ITEM COUNT */}
          <div className="text-center text-sm text-gray-900">
            Tìm thấy <span className="font-semibold">{itemCount}</span> khóa học
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FiltersSection;
