import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Search } from "lucide-react";

interface HeroSectionProps {
  itemCount: number;
  onSearchChange: (value: string) => void;
}

const HeroSection = ({ itemCount, onSearchChange }: HeroSectionProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const handleSearch = () => {
    onSearchChange(searchTerm.trim());
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-700 py-16">
      <div className="max-w-7xl mx-auto px-8 lg:px-16">
        <motion.div
          className="text-center text-white"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <h1 className="text-4xl font-bold mb-4">Danh sách yêu thích</h1>
          <p className="text-xl text-blue-100 mb-8">
            Tất cả các khóa học yêu thích của bạn ở một nơi
          </p>

          {/* Tổng số khóa học */}
          <div className="flex items-center justify-center space-x-2 mb-10">
            <Heart className="w-6 h-6 fill-red-400 text-red-400" />
            <span className="text-lg">
              {itemCount === 0
                ? "Chưa có khóa học nào được lưu"
                : `${itemCount} khóa học đã lưu`}
            </span>
          </div>

          {/* Thanh tìm kiếm */}
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center bg-white rounded-full shadow-xl overflow-hidden">
              <input
                type="text"
                placeholder="Tìm kiếm khóa học đã lưu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleEnter}
                className="flex-1 px-6 py-4 text-gray-900 text-base focus:outline-none"
              />
              <button
                onClick={handleSearch}
                className="bg-yellow-400 text-blue-900 px-8 py-4 hover:bg-yellow-500 transition-colors flex items-center justify-center font-semibold"
              >
                <Search className="w-5 h-5 mr-2" />
                Tìm kiếm
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
