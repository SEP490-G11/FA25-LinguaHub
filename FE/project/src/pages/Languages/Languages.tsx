import React from "react";
import HeroSection from "./components/sections/hero-section";
import LanguagesGrid from "./components/sections/languages-grid";
import Pagination from "./components/sections/pagination";
import CTASection from "./components/sections/cta-section";
import api from "@/config/axiosConfig";

interface Language {
  id: number;
  nameVi: string;
  nameEn: string;
  isActive: boolean;
  difficulty: string;
  certificates: string;
  thumbnailUrl: string;
}

const Languages = () => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [languages, setLanguages] = React.useState<Language[]>([]);
  const [loading, setLoading] = React.useState(true);

  const itemsPerPage = 8;

  React.useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await api.get<{ code: number; result: Language[] }>(
          "/languages/all"
        );
        setLanguages(response.data.result);
      } catch (error) {
        console.error("Error fetching languages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  /**  Filter chỉ khi Search / Enter */
  const filteredLanguages = searchTerm.trim()
      ? languages.filter((lang) =>
          lang.nameVi.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lang.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
      )
      : languages;

  /**  Pagination */
  const totalPages = Math.ceil(filteredLanguages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLanguages = filteredLanguages.slice(startIndex, startIndex + itemsPerPage);

  /**  Reset về page 1 khi search */
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  /**  Tự scroll về đầu trang khi đổi trang */
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg">Đang tải ngôn ngữ...</p>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <HeroSection setSearchTerm={setSearchTerm} />
        <LanguagesGrid languages={paginatedLanguages} />
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
        />
        <CTASection />
      </div>
  );
};

export default Languages;
