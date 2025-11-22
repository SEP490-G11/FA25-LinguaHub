import { motion } from "framer-motion";
import { Star, MapPin, Languages } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

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
}

interface TutorsGridProps {
  tutors: Tutor[];
  loading: boolean;
}

const TutorsGrid = ({ tutors, loading }: TutorsGridProps) => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  if (loading) {
    return (
        <section className="py-16 text-center">
          <p className="text-gray-500 text-lg">Loading tutors...</p>
        </section>
    );
  }

  if (!tutors || tutors.length === 0) {
    return (
        <section className="py-16 text-center">
          <p className="text-gray-500 text-lg">No tutors found.</p>
        </section>
    );
  }

  return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <motion.div
              key={tutors.map((t) => t.id).join("-")}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="initial"
              animate="animate"
              variants={staggerContainer}
          >
            {tutors.map((tutor) => {
              const tutorDetailPath = ROUTES.TUTOR_DETAIL.replace(
                  ":id",
                  tutor.id.toString()
              );

              return (
                  <motion.div
                      key={tutor.id}
                      variants={fadeInUp}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                  >
                    <Link
                        to={tutorDetailPath}
                        className="block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer flex flex-col h-full"
                    >
                      {/* IMAGE */}
                      <div className="relative w-full h-96 overflow-hidden rounded-t-xl bg-gray-100">
                        <img
                            src={tutor.image || 'https://via.placeholder.com/400x400'}
                            alt={tutor.name}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x400";
                            }}
                        />
                      </div>

                      {/* CARD BODY */}
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {tutor.name}
                          </h3>

                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400"/>
                            <span className="text-sm font-medium">
                          {tutor.rating}
                        </span>
                            <span className="text-sm text-gray-500">
                          ({tutor.reviews})
                        </span>
                          </div>
                        </div>

                        {/* COUNTRY + LANGUAGE */}
                        <div className="flex items-center gap-3 mb-3 text-gray-600 text-sm">
                          <MapPin className="w-4 h-4 text-gray-500"/>
                          <span>{tutor.country}</span>

                          <Languages className="w-4 h-4 text-gray-500 ml-3"/>
                          <span>{tutor.language}</span>
                        </div>

                        {/* DESCRIPTION - Fixed height with ellipsis */}
                        <p 
                          className="text-gray-600 mb-4 text-sm overflow-hidden"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            height: '4.5rem',
                            lineHeight: '1.5rem'
                          }}
                        >
                          {tutor.description || "No description available"}
                        </p>

                        {/* SPECIALTIES */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {tutor.specialties.map((specialty, index) => (
                              <span
                                  key={index}
                                  className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full"
                              >
                          {specialty}
                        </span>
                          ))}
                        </div>

                        {/* PRICE + CTA */}
                        <div className="flex items-center justify-between mt-auto pt-4 border-t">
                          <div className="flex items-center space-x-1">
                        <span className="text-2xl font-bold text-green-600">
                          {tutor.price?.toLocaleString()}₫
                        </span>
                            <span className="text-gray-500 text-sm">/slot</span>
                          </div>
                          <Link
                              to={tutorDetailPath}
                              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-semibold"
                          >
                            Book Trial
                          </Link>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>
  );
};

export default TutorsGrid;
