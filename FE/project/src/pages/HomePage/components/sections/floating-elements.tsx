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
        // Fetch courses (public endpoint)
        const coursesRes = await api.get("/courses/public/approved");
        const courses = Array.isArray(coursesRes.data?.result) ? coursesRes.data.result : [];

        // Fetch tutors (correct endpoint)
        const tutorsRes = await api.get("/tutors/approved");
        const tutors = Array.isArray(tutorsRes.data?.result) 
          ? tutorsRes.data.result 
          : Array.isArray(tutorsRes.data) 
            ? tutorsRes.data 
            : [];

        // Fetch languages (correct endpoint)
        const languagesRes = await api.get("/languages/all");
        const languages = Array.isArray(languagesRes.data?.result) ? languagesRes.data.result : [];

        setStats({
          totalLearners: 1500,
          totalTutors: tutors.length > 0 ? tutors.length : 250,
          totalCourses: courses.length > 0 ? courses.length : 100,
          totalLanguages: languages.length > 0 ? languages.length : 12,
        });
      } catch (err) {
        console.error("Failed to load stats:", err);
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
      icon: Award,
      number: formatNumber(stats.totalCourses),
      label: "Khóa học chất lượng",
      description: "Được xác minh và phê duyệt",
    },
    {
      icon: BookOpen,
      number: formatNumber(stats.totalTutors),
      label: "Gia sư chuyên nghiệp",
      description: "Đến từ nhiều quốc gia",
    },
    {
      icon: Globe,
      number: stats.totalLanguages + "",
      label: "Ngôn ngữ phổ biến",
      description: "Sẵn sàng để bạn khám phá",
    },
    {
      icon: Users,
      number: "24/7",
      label: "Hỗ trợ học tập",
      description: "Luôn sẵn sàng đồng hành cùng bạn",
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
              Tại sao chọn LinguaHub?
            </h2>
            <p className="text-lg text-gray-300">
              Tham gia cùng hàng nghìn học viên thành công trên toàn thế giới
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
