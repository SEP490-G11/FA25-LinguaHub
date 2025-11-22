import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ROUTES } from '@/constants/routes.ts';

const HeroBanner = () => {
  const images = [
    "https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg?auto=compress&cs=tinysrgb&w=1600",
    "https://848603edf5.vws.vegacdn.vn/UploadImages%2Fhaiphong%2Fttgdtxhaiphong%2F2023_2%2Fday-hoc-tich-cuc-1_212202310.jpg?w=900",
    "https://images.pexels.com/photos/1181342/pexels-photo-1181342.jpeg?auto=compress&cs=tinysrgb&w=1600",
    "https://images.pexels.com/photos/545068/pexels-photo-545068.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ];

  const [currentImage, setCurrentImage] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [images.length]);

  const fadeVariants = {
    initial: { opacity: 0, scale: 1.05 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  return (
      <section className="relative overflow-hidden h-[500px] md:h-[600px] bg-gradient-to-r from-blue-600 to-purple-700 flex items-center justify-center">
        {/* Ảnh nền chạy tự động */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
                key={currentImage}
                src={images[currentImage]}
                alt="Language learning banner"
                variants={fadeVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 1 }}
                className="absolute w-full h-full object-cover opacity-70"
            />
          </AnimatePresence>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 to-purple-900/50" />
        <div className="relative z-10 text-center text-white px-6">
          <motion.h1
              className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
          >
            Learn Languages, <br /> Connect the World 🌍
          </motion.h1>

          <motion.p
              className="text-lg md:text-2xl text-blue-100 max-w-2xl mx-auto mb-10"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
          >
            Empower your future with global communication — start learning with
            native speakers today!
          </motion.p>

          <motion.div
              className="flex justify-center gap-6 flex-wrap"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link
                to={ROUTES.LANGUAGES}
                className="bg-yellow-400 text-blue-900 font-semibold px-6 py-3 rounded-full shadow-md hover:bg-yellow-500 hover:scale-105 transform transition-all duration-300"
            >
              Start Learning with Courses
            </Link>

            <Link
                to={ROUTES.TUTORS}
                className="bg-white/90 text-blue-700 font-semibold px-6 py-3 rounded-full shadow-md hover:bg-white hover:scale-105 transform transition-all duration-300"
            >
              Find Your Tutor
            </Link>
          </motion.div>
        </div>
        <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-2 z-20">
          {images.map((_, index) => (
              <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentImage
                          ? "bg-yellow-400 scale-110"
                          : "bg-white/50 hover:bg-white/80"
                  }`}
              />
          ))}
        </div>
      </section>
  );
};

export default HeroBanner;
