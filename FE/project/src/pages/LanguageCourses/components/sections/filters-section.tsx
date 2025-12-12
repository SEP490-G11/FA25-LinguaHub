import { Filter, RotateCcw, Star } from "lucide-react";

interface FiltersSectionProps {
    selectedCategory: string;
    categories: string[];
    selectedLevel: string;
    selectedRating: number;
    courseCount: number;
    priceSort: "none" | "asc" | "desc";

    onPriceSortChange: (sort: "none" | "asc" | "desc") => void;
    onCategoryChange: (value: string) => void;
    onLevelChange: (value: string) => void;
    onRatingChange: (value: number) => void;
    onResetFilters: () => void;
}

const FiltersSection = ({
                            selectedCategory,
                            categories,
                            selectedLevel,
                            selectedRating,
                            courseCount,
                            priceSort,
                            onPriceSortChange,
                            onCategoryChange,
                            onLevelChange,
                            onRatingChange,
                            onResetFilters,
                        }: FiltersSectionProps) => {
    const priceSortOptions = [
        { value: "none", label: "Mặc định" },
        { value: "asc", label: "Giá: Thấp → Cao" },
        { value: "desc", label: "Giá: Cao → Thấp" },
    ];
    return (
        <section className="py-6 bg-white border-b">
            <div className="max-w-7xl mx-auto px-8 lg:px-16">

                {/* ========================== */}
                {/* HÀNG 1 — FILTERS + RESET */}
                {/* ========================== */}

                <div
                    className="
                        flex flex-wrap lg:flex-nowrap
                        items-center gap-8
                    "
                >
                    {/* FILTER LABEL */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Filter className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-700">Bộ lọc:</span>
                    </div>

                    {/* CATEGORY */}
                    <div className="flex items-center gap-2 shrink-0">
                        <label className="text-sm font-medium text-gray-600">Danh mục:</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => onCategoryChange(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
                        >
                            <option value="All">Tất cả danh mục</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* LEVEL */}
                    <div className="flex items-center gap-2 shrink-0">
                        <label className="text-sm font-medium text-gray-600">Cấp độ:</label>

                        <select
                            value={selectedLevel}
                            onChange={(e) => onLevelChange(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
                        >
                            <option value="All">Tất cả cấp độ</option>
                            <option value="BEGINNER">Cơ bản</option>
                            <option value="INTERMEDIATE">Trung cấp</option>
                            <option value="ADVANCED">Nâng cao</option>
                        </select>
                    </div>

                    {/* ⭐ RATING */}
                    <div className="flex items-center gap-2 shrink-0">
                        <label className="text-sm font-medium text-gray-600">Đánh giá:</label>

                        <div className="flex items-center gap-1">
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
                                            className={`w-6 h-6 ${
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
                    <div className="flex items-center gap-2 shrink-0">
                        <label className="text-sm font-medium text-gray-600">Sắp xếp giá:</label>
                        <select
                            value={priceSort}
                            onChange={(e) => onPriceSortChange(e.target.value as "none" | "asc" | "desc")}
                            className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
                        >
                            {priceSortOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* RESET (KHÔNG BAO GIỜ RỚT DÒNG) */}
                    <div className="ml-auto shrink-0">
                        <button
                            onClick={onResetFilters}
                            className="flex items-center gap-1 text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Đặt lại
                        </button>
                    </div>
                </div>

                {/* ========================== */}
                {/* HÀNG 2 — COURSE COUNT (CENTER) */}
                {/* ========================== */}
                <div className="flex justify-center mt-4">
                    <div className="text-sm text-gray-600 font-medium">
                        Tìm thấy {courseCount} khóa học
                    </div>
                </div>

            </div>
        </section>
    );
};

export default FiltersSection;
