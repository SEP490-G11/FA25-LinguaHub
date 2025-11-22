import { motion } from "framer-motion";
import { BookOpen, ChevronDown, ChevronRight, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";


interface CourseContentProps {
    course: {
        id: number;
        title: string;
        description: string;
        requirement: string;
        objectives?: string[];
        duration: number;
        price: number;
        language: string;
        thumbnailURL: string;
        categoryName: string;
        tutorName: string;

        section: {
            sectionID: number;
            title: string;
            description?: string;
            orderIndex: number;
            lessons: {
                lessonID: number;
                title: string;
                duration: number;
                lessonType: string;
                videoURL: string | null;
                content: string;
                orderIndex: number;
            }[];
        }[];
    };
    isPurchased: boolean | null;
}

const CourseContent = ({ course, isPurchased }: CourseContentProps) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [expandedSections, setExpandedSections] = useState<number[]>([]);

    const fadeInUp = {
        initial: { opacity: 0, y: 60 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 },
    };

    const toggleSection = (id: number) => {
        setExpandedSections((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    };

    const handleLessonClick = (lessonId: number) => {
        const token =
            localStorage.getItem("access_token") ||
            sessionStorage.getItem("access_token");

        if (!token) {
            toast({
                variant: "destructive",
                title: "Login required",
                description: "Please log in to access lessons.",
            });
            return;
        }

        if (!isPurchased) {
            toast({
                variant: "destructive",
                title: "Purchase required",
                description: "You must purchase the course before accessing lessons.",
            });
            return;
        }

        navigate(`/lesson/${lessonId}`, {
            state: { courseId: course.id }
        });


    };

    return (
        <div className="lg:col-span-2">

            {/*  OBJECTIVES SECTION */}
            <motion.div
                className="bg-white rounded-xl p-8 shadow-md mb-8"
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={fadeInUp}
            >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">What You'll Learn</h2>

                {course.objectives && course.objectives.length > 0 ? (
                    <ul className="space-y-3">
                        {course.objectives.map((obj, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                <span className="text-gray-700 leading-relaxed">{obj}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">This course has no objectives provided.</p>
                )}
            </motion.div>

            {/*  REQUIREMENTS SECTION */}
            <motion.div
                className="bg-white rounded-xl p-8 shadow-md mb-8"
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={fadeInUp}
            >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Requirements</h2>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {course.requirement}
                </p>
            </motion.div>

            {/*  COURSE CURRICULUM */}
            {course.section && (
                <motion.div
                    className="bg-white rounded-xl p-8 shadow-md mb-8"
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Curriculum</h2>

                    <div className="space-y-4">
                        {course.section.map((section) => {
                            const isExpanded = expandedSections.includes(section.sectionID);

                            return (
                                <div key={section.sectionID} className="border border-gray-200 rounded-lg">

                                    {/* Section Header */}
                                    <div
                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition gap-4"
                                        onClick={() => toggleSection(section.sectionID)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                {isExpanded ? (
                                                    <ChevronDown className="w-5 h-5 flex-shrink-0" />
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 flex-shrink-0" />
                                                )}
                                                <span className="truncate">{section.orderIndex}. {section.title}</span>
                                            </h3>

                                            {section.description && (
                                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                    {section.description}
                                                </p>
                                            )}
                                        </div>

                                        <span className="text-sm text-gray-500 whitespace-nowrap flex-shrink-0">
                                            {section.lessons.length} lessons
                                        </span>
                                    </div>

                                    {/* Lessons */}
                                    {isExpanded && (
                                        <motion.ul
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="border-t border-gray-200 p-4 space-y-2"
                                        >
                                            {section.lessons.map((lesson) => (
                                                <li
                                                    key={lesson.lessonID}
                                                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 cursor-pointer transition-colors"
                                                    onClick={() => handleLessonClick(lesson.lessonID)}
                                                >
                                                    <BookOpen className="w-4 h-4 text-blue-500" />
                                                    <span>{lesson.title}</span>
                                                    <span className="text-xs text-gray-400 ml-auto">
                                                        {lesson.duration} min
                                                    </span>
                                                </li>
                                            ))}
                                        </motion.ul>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default CourseContent;
