import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LessonHeaderProps {
  lesson: {
    id: number;
    title: string;
    week: number;
    duration: number;
  };
  courseId: number | string;
  courseTitle: string;
}

const LessonHeader = ({ lesson, courseId, courseTitle }: LessonHeaderProps) => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  // Format duration: 15 → "15 min" | 75 → "1h 15m"
  const formatDuration = (minutes: number) => {
    if (!minutes) return "0 min";
    if (minutes < 60) return `${minutes} min`;

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    return `${h}h ${m}m`;
  };

  return (
      <section className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>

        <div className="max-w-7xl mx-auto px-8 lg:px-16 relative z-10">
          <motion.div initial="initial" animate="animate" variants={fadeInUp}>

            {/* Breadcrumb + Back Button */}
            <div className="flex items-center space-x-4 mb-6 text-white">
              <Button
                  variant="ghost"
                  asChild
                  className="text-white hover:bg-white/20 border border-white/30"
              >
                <Link to={`/courses/${courseId}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại khóa học
                </Link>
              </Button>

              <span className="opacity-70">|</span>

              <span className="truncate max-w-[180px] md:max-w-xs opacity-90">
              {courseTitle}
            </span>

              <span className="opacity-70">|</span>

              <span className="opacity-90">Bài {lesson.week}</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {lesson.title}
            </h1>

            {/* Lesson Meta */}
            <div className="flex flex-wrap items-center gap-4">

              {/* Duration */}
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white">
                <Clock className="w-5 h-5" />
                <span className="font-medium">{formatDuration(lesson.duration)}</span>
              </div>

              {/* Week Info */}
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white">
                <BookOpen className="w-5 h-5" />
                <span className="font-medium">Tuần {lesson.week}</span>
              </div>
            </div>

          </motion.div>
        </div>
      </section>
  );
};

export default LessonHeader;
