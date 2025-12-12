import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import HeroSection from "./components/sections/hero-section";
import FiltersSection from "./components/sections/filters-section";
import CoursesGrid from "./components/sections/courses-grid";
import Pagination from "./components/sections/pagination";
import api from "@/config/axiosConfig";
import type { Course } from "@/types/Course";

const LanguageCourses = () => {
    const { language } = useParams();

    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");

    // Filters
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedLevel, setSelectedLevel] = useState("All");
    const [selectedRating, setSelectedRating] = useState(0);
    const [priceSort, setPriceSort] = useState<"none" | "asc" | "desc">("none");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [currentLang, setCurrentLang] = useState<{ name: string; flag: string; image: string } | null>(null);

    const coursesPerPage = 8;

    /** Fetch Language Info from API */
    useEffect(() => {
        const fetchLanguageInfo = async () => {
            try {
                const res = await api.get('/languages/all');
                const languages = res.data.result || [];
                
                // Find matching language
                const matchedLang = languages.find((lang: any) => 
                    lang.nameEn?.toLowerCase() === language?.toLowerCase()
                );
                
                if (matchedLang) {
                    setCurrentLang({
                        name: matchedLang.nameVi || matchedLang.nameEn,
                        flag: matchedLang.flag || "🌐",
                        image: matchedLang.thumbnailUrl || "https://images.pexels.com/photos/267669/pexels-photo-267669.jpeg"
                    });
                }
            } catch (err) {
                console.error("Failed to fetch language info:", err);
            }
        };

        if (language) {
            fetchLanguageInfo();
        }
    }, [language]);

    /** 1) Fetch Courses */
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                const res = await api.get<{ result: Course[] }>("/courses/public/approved");
                setCourses(res.data.result ?? []);
            } catch (err) {
                console.error("Failed to fetch courses:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    /** 2) Fetch Categories */
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get("/categories");
                setCategories(res.data.map((c: any) => c.categoryName));
            } catch (err) {
                console.error("Failed to fetch categories:", err);
            }
        };

        fetchCategories();
    }, []);

    /** RESET FILTERS */
    const handleResetFilters = () => {
        setSelectedCategory("All");
        setSelectedLevel("All");
        setSelectedRating(0);
        setPriceSort("none");
        setCurrentPage(1);
    };

    /** FILTER & SORT LOGIC */
    const filteredCourses = (() => {
        let result = courses.filter((course) => {
            const matchesLanguage = language
                ? course.language?.trim().toLowerCase().includes(language.toLowerCase())
                : true;

            const matchesSearch =
                course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                course.tutorName.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory =
                selectedCategory === "All" || course.categoryName === selectedCategory;

            const matchesLevel =
                selectedLevel === "All" || course.level === selectedLevel;

            const matchesRating =
                selectedRating === 0 || course.avgRating >= selectedRating;

            const notPurchased = !course.isPurchased;

            return (
                matchesLanguage &&
                matchesSearch &&
                matchesCategory &&
                matchesLevel &&
                matchesRating &&
                notPurchased
            );
        });

        // Sort by price
        if (priceSort === "asc") {
            result = [...result].sort((a, b) => a.price - b.price);
        } else if (priceSort === "desc") {
            result = [...result].sort((a, b) => b.price - a.price);
        }

        return result;
    })()



    /** Pagination */
    const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
    const paginatedCourses = filteredCourses.slice(
        (currentPage - 1) * coursesPerPage,
        currentPage * coursesPerPage
    );

    /** Language not found */
    if (!currentLang) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <h2 className="text-2xl font-bold">Không tìm thấy ngôn ngữ</h2>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <HeroSection
                language={currentLang}
                onSearch={(val) => {
                    setSearchTerm(val);
                    setCurrentPage(1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }}
            />

            <FiltersSection
                selectedCategory={selectedCategory}
                categories={categories}
                selectedLevel={selectedLevel}
                selectedRating={selectedRating}
                courseCount={filteredCourses.length}
                priceSort={priceSort}
                onPriceSortChange={(sort) => {
                    setPriceSort(sort);
                    setCurrentPage(1);
                }}
                onCategoryChange={(value) => {
                    setSelectedCategory(value);
                    setCurrentPage(1);
                }}
                onLevelChange={(value) => {
                    setSelectedLevel(value);
                    setCurrentPage(1);
                }}
                onRatingChange={(value) => {
                    setSelectedRating(value);
                    setCurrentPage(1);
                }}
                onResetFilters={handleResetFilters}
            />

            <CoursesGrid courses={paginatedCourses} loading={loading} />

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }}
            />
        </div>
    );
};

export default LanguageCourses;
