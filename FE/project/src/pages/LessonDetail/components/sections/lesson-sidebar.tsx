import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle, ChevronDown, PlayCircle, ClipboardCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/config/axiosConfig";
interface LessonProgress {
  lessonId: number;
  lessonTitle: string;
  isDone: boolean;
  duration: number | null;
  lessonType?: string;
}

interface SectionProgress {
  sectionId: number;
  sectionTitle: string;
  progress: number;
  lessons: LessonProgress[];
}

interface CourseProgressResponse {
  courseID: number;
  sectionProgress: SectionProgress[];
}

interface LocalLesson {
  lessonID: number;
  title: string;
  isDone: boolean;
  duration: number | null;
  lessonType?: string;
}

interface LocalSection {
  sectionID: number;
  title: string;
  progress: number;
  lessons: LocalLesson[];
}

interface LocalCourse {
  id: number;
  section: LocalSection[];
}

interface LessonSidebarProps {
  lesson: {
    id: number;
    week: number;
    isDone?: boolean;
  };
  course?: { id: number } | null;
}

const LessonSidebar = ({ course, lesson }: LessonSidebarProps) => {
  const navigate = useNavigate();

  const [openSections, setOpenSections] = useState<Record<number, boolean>>({});
  const [localCourse, setLocalCourse] = useState<LocalCourse | null>(null);

  const loadCourseProgress = async () => {
    if (!course?.id) return;

    const res = await api.get<{ result: CourseProgressResponse }>(
        `/student/courses/${course.id}`
    );

    const data = res.data.result;

    const mapped: LocalCourse = {
      id: data.courseID,
      section: data.sectionProgress.map((sec) => ({
        sectionID: sec.sectionId,
        title: sec.sectionTitle,
        progress: sec.progress,
        lessons: sec.lessons.map((ls) => ({
          lessonID: ls.lessonId,
          title: ls.lessonTitle,
          isDone: ls.isDone,
          duration: ls.duration ?? null,
          lessonType: ls.lessonType,
        })),
      })),
    };

    setLocalCourse(mapped);
  };

  useEffect(() => {
    loadCourseProgress();
  }, [course?.id]);
  useEffect(() => {
    if (!lesson?.id || !localCourse) return;

    setLocalCourse((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        section: prev.section.map((sec) => ({
          ...sec,
          lessons: sec.lessons.map((ls) =>
              ls.lessonID === lesson.id ? { ...ls, isDone: lesson.isDone ?? false } : ls
          ),
        })),
      };
    });
  }, [lesson?.isDone]);
  useEffect(() => {
    const interval = setInterval(() => loadCourseProgress(), 3000);
    return () => clearInterval(interval);
  }, [course?.id]);

  if (!localCourse) return null;
  const enhancedSections = localCourse.section.map((sec) => {
    const total = sec.lessons.length;
    const done = sec.lessons.filter((l) => l.isDone).length;
    const progress = total ? Math.round((done / total) * 100) : 0;

    return {
      ...sec,
      completedLessons: done,
      totalLessons: total,
      progress,
    };
  });

  let courseDone = 0;
  let courseTotal = 0;

  enhancedSections.forEach((sec) => {
    courseDone += sec.completedLessons;
    courseTotal += sec.totalLessons;
  });

  const courseProgress =
      courseTotal > 0 ? Math.round((courseDone / courseTotal) * 100) : 0;

  const formatDuration = (min?: number | null) =>
      min ? `${min} min` : "";

  const toggleSection = (id: number) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  return (
      <div className="lg:col-span-1">
        <Card className="mb-6 overflow-hidden shadow-md border-0 bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pb-8 shadow-md">
            <CardTitle className="tracking-wide">Tiến độ của bạn</CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Tiến độ khóa học</span>
                  <span className="font-bold text-2xl text-blue-600">{courseProgress}%</span>
                </div>

                <Progress value={courseProgress} className="w-full h-3 rounded-md" />

                <span className="text-gray-600 text-sm block">
                {courseDone} / {courseTotal} bài học đã hoàn thành
              </span>
              </div>
            </motion.div>
          </CardContent>
        </Card>

        {/* COURSE CONTENT */}
        <Card className="overflow-hidden border shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold tracking-wide">
              Nội dung khóa học
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {enhancedSections.map((sec, index) => {
                const isOpen = openSections[sec.sectionID];

                return (
                    <div key={sec.sectionID} className="pb-4 border-b last:border-b-0">
                      <button
                          onClick={() => toggleSection(sec.sectionID)}
                          className="w-full flex justify-between items-start py-2 transition hover:bg-gray-50 rounded-md px-2"
                      >
                        <div className="flex flex-col items-start flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-800 text-left w-full">
                            {index + 1}. {sec.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {sec.totalLessons} bài học
                          </p>
                          <p className="text-xs text-blue-600 font-medium">
                            {sec.progress}% đã hoàn thành
                          </p>
                        </div>

                        <ChevronDown
                            className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ml-2 ${
                                isOpen ? "rotate-180" : ""
                            }`}
                        />
                      </button>

                      {isOpen && (
                          <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-1 mt-3 pl-2 pr-2"
                          >
                            {sec.lessons.map((ls) => (
                                <button
                                    key={ls.lessonID}
                                    onClick={() =>
                                        navigate(`/lesson/${ls.lessonID}`, {
                                          state: { courseId: localCourse.id },
                                        })
                                    }
                                    className="w-full flex justify-between items-center py-2 px-2 rounded-lg transition hover:bg-gray-100"
                                >
                                  <div className="flex items-start gap-3">
                                    {ls.isDone ? (
                                        <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                                    ) : (
                                        <>
                                          {ls.lessonType?.toLowerCase() === 'video' ? (
                                            <PlayCircle className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                                          ) : ls.lessonType?.toLowerCase() === 'quiz' ? (
                                            <ClipboardCheck className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
                                          ) : (
                                            <BookOpen className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                                          )}
                                        </>
                                    )}

                                    <span
                                        className={`text-sm text-left ${
                                            ls.isDone
                                                ? "text-green-700 font-medium"
                                                : "text-gray-800"
                                        }`}
                                    >
                              {ls.title}
                            </span>
                                  </div>

                                  {ls.duration && (
                                      <span className="text-xs text-gray-500 whitespace-nowrap">
                              {formatDuration(ls.duration)}
                            </span>
                                  )}
                                </button>
                            ))}
                          </motion.div>
                      )}
                    </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

export default LessonSidebar;
