import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useState } from "react";

interface HeroSectionProps {
  setSearchTerm: (value: string) => void;  // ✅ chỉ cần giá trị search mở filter
}

const HeroSection = ({ setSearchTerm }: HeroSectionProps) => {
  const [localSearch, setLocalSearch] = useState(""); // ✅ giữ input tạm thời trong component

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const handleSearch = () => {
    const value = localSearch.trim();
    setSearchTerm(value);

    if (!value) {
      setSearchTerm(""); 
    }
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
            <h1 className="text-5xl font-bold mb-4">Chọn hành trình ngôn ngữ của bạn</h1>
            <p className="text-xl text-blue-100 mb-10">
              Khám phá các chương trình ngôn ngữ toàn diện được thiết kế để giúp bạn đạt chứng chỉ
            </p>

            {/* 🔎 Search Bar */}
            <div className="max-w-3xl mx-auto mb-10">
              <div className="flex items-center bg-white rounded-full shadow-xl overflow-hidden">
                <input
                    type="text"
                    value={localSearch}
                    placeholder="Tìm kiếm ngôn ngữ..."
                    onChange={(e) => setLocalSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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

            {/* Static Numbers */}
            <div className="flex justify-center space-x-8 text-center">
              <div>
                <div className="text-3xl font-bold">50+</div>
                <div className="text-blue-200">Ngôn ngữ</div>
              </div>
              <div>
                <div className="text-3xl font-bold">5000+</div>
                <div className="text-blue-200">Gia sư bản ngữ</div>
              </div>
              <div>
                <div className="text-3xl font-bold">100K+</div>
                <div className="text-blue-200">Học viên</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
  );
};

export default HeroSection;
