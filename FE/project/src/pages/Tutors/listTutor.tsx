import { useState, useEffect, useMemo } from "react";
import HeroSection from "./components/sections/hero-section";
import FiltersSection from "./components/sections/filters-section";
import TutorsGrid from "./components/sections/tutors-grid";
import Pagination from "./components/sections/pagination";
import api from "@/config/axiosConfig";

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

const Tutors = () => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [languages, setLanguages] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [maxPrice, setMaxPrice] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const tutorsPerPage = 6;

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
              
              return {
                id: tutor.tutorId,
                name: tutor.userName,
                language: (tutor.teachingLanguage ?? "Unknown").trim(),
                country: tutor.country ?? "Unknown",
                rating: tutor.rating ?? 5.0,
                reviews: tutor.reviews ?? 0,
                price: tutor.pricePerHour ?? 0,
                specialties: tutor.specialization ? tutor.specialization.split(",").map((s: string) => s.trim()) : [],
                image:
                    tutor.avatarUrl ||
                    tutor.avatarURL ||
                    "https://placehold.co/300x200?text=No+Image",
                description: detail.bio || "No bio available.",
                availability: tutor.availability ?? "Available",
              };
            } catch (err) {
              // Fallback if detail fetch fails
              return {
                id: tutor.tutorId,
                name: tutor.userName,
                language: (tutor.teachingLanguage ?? "Unknown").trim(),
                country: tutor.country ?? "Unknown",
                rating: tutor.rating ?? 5.0,
                reviews: tutor.reviews ?? 0,
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


      } catch (error) {
        console.error(" Failed to fetch tutors:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTutors();
  }, []);

  /**  Update filter options when tutors fetched */
  useEffect(() => {
    if (tutors.length > 0) {
      const langs = Array.from(
          new Set(
              tutors.map((t) =>
                  (t.language || "Unknown").trim().replace(/\s+/g, " ")
              )
          )
      );
      setLanguages(["All", ...langs]);

      const max = Math.max(...tutors.map((t) => t.price), 0);
      setMaxPrice(max);
      setPriceRange([0, max]);
    }
  }, [tutors]);

  /**  Compute filtered tutors (always correct order) */
  const filteredTutors = useMemo(() => {
    const selectedLang = selectedLanguage.trim().toLowerCase();

    return tutors.filter((tutor) => {
      const tutorLang = (tutor.language || "Unknown").trim().toLowerCase();

      const matchLanguage =
          selectedLang === "all" || tutorLang === selectedLang;

      const matchSearch =
          tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tutor.specialties.join(",").toLowerCase().includes(searchTerm.toLowerCase());

      const matchPrice =
          tutor.price >= priceRange[0] && tutor.price <= priceRange[1];

      const matchRating = selectedRating === 0 || tutor.rating >= selectedRating;

      return matchLanguage && matchSearch && matchPrice && matchRating;
    });
  }, [tutors, selectedLanguage, searchTerm, priceRange, selectedRating]);

  /**  Reset page when filters change */
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLanguage, searchTerm, priceRange, selectedRating]);

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
            priceRange={priceRange}
            maxPrice={maxPrice}
            selectedRating={selectedRating}
            tutorCount={filteredTutors.length}
            onLanguageChange={(v) => {
              setSelectedLanguage(v);
              setCurrentPage(1);
              setPriceRange([0, maxPrice]);
            }}
            onPriceRangeChange={(range) => {
              setPriceRange(range);
              setCurrentPage(1);
            }}
            onRatingChange={(rating) => {
              setSelectedRating(rating);
              setCurrentPage(1);
            }}
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
