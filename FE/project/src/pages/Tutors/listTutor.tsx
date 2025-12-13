import { useState, useEffect, useMemo } from "react";
import HeroSection from "./components/sections/hero-section";
import FiltersSection from "./components/sections/filters-section";
import TutorsGrid from "./components/sections/tutors-grid";
import Pagination from "./components/sections/pagination";
import api from "@/config/axiosConfig";
import { useTutorSearch } from "@/hooks/useTutorSearch";

interface Tutor {
  id: number;
  name: string;
  language: string;
  country: string;
  rating: number;
  reviews: number;
  price: number;
  specialties: string[];
  image: string;
  description: string;
  availability: string;
}

interface BookingPlan {
  booking_planid: number;
  tutor_id: number;
  title: string;
  start_hours: string;
  end_hours: string;
  is_open: boolean;
  is_active: boolean;
}

const Tutors = () => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [languages, setLanguages] = useState<string[]>([]);
  const [priceSort, setPriceSort] = useState<"none" | "asc" | "desc">("none");
  const [selectedRating, setSelectedRating] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const tutorsPerPage = 6;
  
  // Schedule filters
  const [selectedDay, setSelectedDay] = useState<string>("All");
  const [tutorSchedules, setTutorSchedules] = useState<Record<number, BookingPlan[]>>({});

  /**  Fetch tutors from API */
  useEffect(() => {
    const fetchTutors = async () => {
      try {
        setLoading(true);
        const res = await api.get("/tutors/approved");
        const data = Array.isArray(res.data.result) ? res.data.result : res.data;

        // Fetch detailed info for each tutor to get bio
        const detailedTutors = await Promise.all(
          data.map(async (tutor: any) => {
            try {
              const detailRes = await api.get(`/tutors/${tutor.tutorId}`);
              const detail = detailRes.data;
              const reviewCount = detail.feedbacks ? detail.feedbacks.length : 0;
              
              return {
                id: tutor.tutorId,
                name: tutor.userName,
                language: (tutor.teachingLanguage ?? "Unknown").trim(),
                country: tutor.country ?? "Unknown",
                rating: tutor.rating ?? 5.0,
                reviews: reviewCount,
                price: tutor.pricePerHour ?? 0,
                specialties: tutor.specialization ? tutor.specialization.split(",").map((s: string) => s.trim()) : [],
                image:
                    tutor.avatarUrl ||
                    tutor.avatarURL ||
                    "https://placehold.co/300x200?text=No+Image",
                description: detail.bio || "No bio available.",
                availability: tutor.availability ?? "Available",
              };
            } catch  {
              // Fallback if detail fetch fails
              return {
                id: tutor.tutorId,
                name: tutor.userName,
                language: (tutor.teachingLanguage ?? "Unknown").trim(),
                country: tutor.country ?? "Unknown",
                rating: tutor.rating ?? 5.0,
                reviews: 0,
                price: tutor.pricePerHour ?? 0,
                specialties: tutor.specialization ? tutor.specialization.split(",").map((s: string) => s.trim()) : [],
                image:
                    tutor.avatarUrl ||
                    tutor.avatarURL ||
                    "https://placehold.co/300x200?text=No+Image",
                description: "No bio available.",
                availability: tutor.availability ?? "Available",
              };
            }
          })
        );

        setTutors(detailedTutors);
        
        // Fetch booking plans for all tutors
        const schedules: Record<number, BookingPlan[]> = {};
        await Promise.all(
          detailedTutors.map(async (tutor) => {
            try {
              const planRes = await api.get(`/tutor/${tutor.id}/booking-plan`, { skipAuth: true });
              const plans: BookingPlan[] = planRes?.data?.plans || [];
              schedules[tutor.id] = plans.filter(p => p.is_open && p.is_active);
            } catch  {
              schedules[tutor.id] = [];
            }
          })
        );
        setTutorSchedules(schedules);

      } catch (error) {
        console.error(" Failed to fetch tutors:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTutors();
  }, []);

  /**  Fetch languages from API */
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const res = await api.get("/languages/all", { skipAuth: true });
        const languageData = res.data.result || [];
        
        // Get only active languages and map to Vietnamese names
        const activeLangs = languageData
          .filter((lang: any) => lang.isActive)
          .map((lang: any) => lang.nameVi);
        
        setLanguages(["Tất cả", ...activeLangs]);
      } catch (error) {
        console.error("Failed to fetch languages:", error);
        // Fallback to default languages
        setLanguages(["Tất cả", "Tiếng Anh", "Tiếng Nhật", "Tiếng Hàn", "Tiếng Trung"]);
      }
    };
    
    fetchLanguages();
  }, []);

  // Initialize MiniSearch
  const { search } = useTutorSearch(tutors);

  /**  Compute filtered tutors using MiniSearch */
  const filteredTutors = useMemo(() => {
    // Step 1: Search with MiniSearch
    const searchResultIds = search(searchTerm);
    const searchFiltered = searchTerm.trim() === '' 
      ? tutors 
      : tutors.filter(t => searchResultIds.includes(t.id));

    // Step 2: Apply other filters
    let result = searchFiltered.filter((tutor) => {
      const tutorLang = (tutor.language || "Unknown").trim();
      
      // Map Vietnamese to English for comparison
      const viToEnMapping: Record<string, string> = {
        'tiếng anh': 'english',
        'tiếng nhật': 'japanese',
        'tiếng hàn': 'korean',
        'tiếng trung': 'chinese',
        'tiếng pháp': 'french',
        'tiếng đức': 'german',
        'tiếng tây ban nha': 'spanish',
        'tiếng ý': 'italian',
        'tiếng việt': 'vietnamese',
      };
      
      const selectedLangLower = selectedLanguage.trim().toLowerCase();
      const selectedLangEn = viToEnMapping[selectedLangLower] || selectedLangLower;
      
      // Check if tutor teaches the selected language (support multiple languages separated by comma)
      const tutorLanguages = tutorLang.split(',').map(lang => lang.trim().toLowerCase());
      const matchLanguage =
          selectedLangEn === "all" || 
          selectedLangEn === "tất cả" ||
          tutorLanguages.some(lang => {
            const langEn = viToEnMapping[lang] || lang;
            return langEn === selectedLangEn || lang.includes(selectedLangEn);
          });
      
      // Schedule filter
      let matchSchedule = true;
      if (selectedDay !== "All") {
        const plans = tutorSchedules[tutor.id] || [];
        const dayPlans = plans.filter(p => p.title === selectedDay);
        matchSchedule = dayPlans.length > 0;
      }

      const matchRating = selectedRating === 0 || tutor.rating >= selectedRating;

      return matchLanguage && matchRating && matchSchedule;
    });

    // Step 3: Sort by price
    if (priceSort === "asc") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (priceSort === "desc") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [tutors, selectedLanguage, searchTerm, priceSort, selectedRating, selectedDay, tutorSchedules, search]);

  /**  Reset page when filters change */
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLanguage, searchTerm, priceSort, selectedRating, selectedDay]);

  /** Reset all filters */
  const handleResetFilters = () => {
    setSelectedLanguage("All");
    setSelectedDay("All");
    setPriceSort("none");
    setSelectedRating(0);
    setCurrentPage(1);
  };

  /**  Pagination logic */
  const totalPages = Math.ceil(filteredTutors.length / tutorsPerPage);
  const paginatedTutors = filteredTutors.slice(
      (currentPage - 1) * tutorsPerPage,
      currentPage * tutorsPerPage
  );

  /**  Auto reset if page > total */
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages]);

  return (
      <div className="min-h-screen bg-gray-50">
        {/*  Hero Section */}
        <HeroSection
            onSearchChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
        />

        {/*  Filters */}
        <FiltersSection
            languages={languages}
            selectedLanguage={selectedLanguage}
            priceSort={priceSort}
            selectedRating={selectedRating}
            tutorCount={filteredTutors.length}
            selectedDay={selectedDay}
            onLanguageChange={(v) => {
              setSelectedLanguage(v);
              setCurrentPage(1);
            }}
            onPriceSortChange={(sort) => {
              setPriceSort(sort);
              setCurrentPage(1);
            }}
            onRatingChange={(rating) => {
              setSelectedRating(rating);
              setCurrentPage(1);
            }}
            onDayChange={(day) => {
              setSelectedDay(day);
              setCurrentPage(1);
            }}
            onResetFilters={handleResetFilters}
        />

        {/*  Tutors Grid */}
        <TutorsGrid tutors={paginatedTutors} loading={loading} />

        {/*  Pagination */}
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

export default Tutors;
