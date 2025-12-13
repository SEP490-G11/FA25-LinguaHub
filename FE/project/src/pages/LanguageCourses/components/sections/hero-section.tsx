import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {ROUTES} from "@/constants/routes.ts";

interface HeroSectionProps {
  language: {
    name: string;
    flag: string;
    image: string;
  };
  onSearch: (keyword: string) => void;
}

const HeroSection = ({ language, onSearch }: HeroSectionProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const handleSearchClick = () => {
    if (!searchTerm.trim()) {
      onSearch("");
      return;
    }
    onSearch(searchTerm);
  };


  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchClick();
    }
  };

  return (
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-700 overflow-hidden py-20">
        {/* Background image */}
        <img
            src={language.image}
            alt={language.name}
            className="absolute inset-0 w-full h-full object-cover opacity-20"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-8 lg:px-16">
          <motion.div
              className="text-white"
              initial="initial"
              animate="animate"
              variants={fadeInUp}
          >
            {/* Back button */}
            <div className="mb-6">
              <Button variant="ghost" asChild className="text-white hover:bg-white/20">
                <Link to={ROUTES.LANGUAGES}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại Ngôn ngữ
                </Link>
              </Button>
            </div>

            {/* Title + flag */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <span className="text-6xl">{language.flag}</span>
                <div>
                  <h1 className="text-5xl font-bold">Khóa học {language.name}</h1>
                  <p className="text-xl text-blue-100">Học với giáo viên bản ngữ</p>
                </div>
              </div>

              {/* SEARCH BAR */}
              <div className="max-w-3xl mx-auto mt-10">
                <div className="flex items-center bg-white rounded-full shadow-xl overflow-hidden">
                  <input
                      type="text"
                      placeholder="Tìm kiếm khóa học hoặc giáo viên..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleEnter}
                      className="flex-1 px-6 py-4 text-gray-900 text-base focus:outline-none"
                  />

                  <button
                      onClick={handleSearchClick}
                      className="bg-orange-500 text-white px-10 py-4 hover:bg-orange-600 transition-colors flex items-center justify-center"
                  >
                    <Search className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
  );
};

export default HeroSection;
