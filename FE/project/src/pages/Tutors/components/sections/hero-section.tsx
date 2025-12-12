import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

interface HeroSectionProps {
  onSearchChange: (value: string) => void;
}

const HeroSection = ({ onSearchChange }: HeroSectionProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const handleSearch = () => {
    onSearchChange(searchTerm.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 py-20">
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <motion.div
              className="text-center text-white"
              initial="initial"
              animate="animate"
              variants={fadeInUp}
          >
            <h1 className="text-5xl font-bold mb-4">
              Tìm gia sư ngôn ngữ hoàn hảo của bạn
            </h1>
            <p className="text-xl text-blue-100 mb-10">
              Kết nối với giáo viên bản ngữ được chứng nhận từ khắp nơi trên thế giới
            </p>

            {/*  SEARCH INPUT */}
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center bg-white rounded-full shadow-xl overflow-hidden">
                <input
                    type="text"
                    placeholder="Tìm kiếm gia sư phù hợp cho bạn"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 px-6 py-4 text-gray-900 text-base focus:outline-none"
                />
                <button
                    onClick={handleSearch}
                    className="bg-orange-500 text-white px-10 py-4 hover:bg-orange-600 transition-colors flex items-center justify-center"
                >
                  <Search className="w-6 h-6" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
  );
};

export default HeroSection;
