import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/config/axiosConfig";

import { Users, BookOpen, Award, Globe } from "lucide-react";

function FloatingElements() {
  const [stats, setStats] = useState({
    totalLearners: 0,
    totalTutors: 0,
    totalCourses: 0,
    totalLanguages: 12,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Try to fetch courses (public endpoint)
        const coursesRes = await api.get("/courses/public/approved");
        const courses = coursesRes.data?.result || [];

        // Try to fetch users (may require auth, so we handle errors gracefully)
        let totalLearners = 1500; // Default fallback
        let totalTutors = 250; // Default fallback

        try {
          const usersRes = await api.get("/users");
          const users = usersRes.data?.result || [];
          totalLearners = users.filter((u: any) => u.role === "Learner").length || totalLearners;
          totalTutors = users.filter((u: any) => u.role === "Tutor").length || totalTutors;
        } catch (userErr) {
          // If users endpoint fails (e.g., not authenticated), use defaults
          console.log("Using default user stats");
        }

        setStats((prev) => ({
          ...prev,
          totalLearners,
          totalTutors,
          totalCourses: courses.length || 100, // Fallback to 100 if no courses
        }));
      } catch (err) {
        console.error("Failed to load stats:", err);
        // Set default values even if everything fails
        setStats({
          totalLearners: 1500,
          totalTutors: 250,
          totalCourses: 100,
          totalLanguages: 12,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M+";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K+";
    return num + "+";
  };

  const dynamicStats = [
    {
      icon: Users,
      number: formatNumber(stats.totalLearners),
      label: "Active Learners",
      description: "Learning languages on LinguaHub",
    },
    {
      icon: BookOpen,
      number: formatNumber(stats.totalTutors),
      label: "Professional Tutors",
      description: "From many countries",
    },
    {
      icon: Award,
      number: formatNumber(stats.totalCourses),
      label: "Approved Courses",
      description: "Verified for quality",
    },
    {
      icon: Globe,
      number: stats.totalLanguages + "",
      label: "Languages",
      description: "Available to learn",
    },
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const staggerContainer = {
    animate: {
      transition: { staggerChildren: 0.1 },
    },
  };

  // Always show the component, even while loading
  return (
      <section className="py-16 bg-gray-900">
        <div className="w-full px-8 lg:px-16">
          <motion.div
              className="text-center mb-12"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={fadeInUp}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Why Choose LinguaHub?
            </h2>
            <p className="text-lg text-gray-300">
              Join thousands of successful learners worldwide
            </p>
          </motion.div>

          <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
          >
            {dynamicStats.map((stat, index) => (
                <motion.div key={index} className="text-center" variants={fadeInUp}>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>

                  <div className="text-4xl font-bold text-white mb-2">
                    {stat.number}
                  </div>

                  <div className="text-xl font-semibold text-blue-400 mb-2">
                    {stat.label}
                  </div>

                  <div className="text-gray-400">{stat.description}</div>
                </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
  );
}

export default FloatingElements;
