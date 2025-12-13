import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen,
  FileText,
  Video,
  Link as LinkIcon,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { CourseDetail, Lesson } from '../types';

// Component to display quiz questions from lesson data
function QuizQuestionDisplay({ lesson }: { lesson: Lesson }) {
  const questions = lesson.quizQuestions || [];

  if (questions.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm italic">
        Chưa có câu hỏi nào
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {questions.map((question, qIndex) => (
        <div
          key={question.questionID}
          className="flex items-center justify-between p-3 bg-white rounded border border-gray-200"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-700 flex-shrink-0">
              {qIndex + 1}.
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {question.questionText}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-500">
                  Điểm: {question.score}
                </span>
                <span className="text-xs text-gray-500">
                  {question.options.length} lựa chọn
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface CourseContentSectionProps {
  course: CourseDetail;
}

export function CourseContentSection({ course }: CourseContentSectionProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set([0]) // Mở section đầu tiên mặc định
  );
  const [expandedLessons, setExpandedLessons] = useState<Map<string, boolean>>(
    new Map()
  );

  const toggleSection = (index: number) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedSections(newSet);
  };

  const toggleLesson = (sectionIndex: number, lessonIndex: number) => {
    const key = `${sectionIndex}-${lessonIndex}`;
    const newMap = new Map(expandedLessons);
    if (newMap.has(key)) {
      newMap.delete(key);
    } else {
      newMap.set(key, true);
    }
    setExpandedLessons(newMap);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        Nội dung khóa học ({course.section?.length || 0} chương)
      </h3>

      <div className="space-y-3">
        {course.section?.map((section, sectionIndex) => (
          <div
            key={section.sectionID}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* Section Header - Clickable */}
            <div
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors"
              onClick={() => toggleSection(sectionIndex)}
            >
              {expandedSections.has(sectionIndex) ? (
                <ChevronUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-blue-600 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-lg">
                  Chương {sectionIndex + 1}: {section.title}
                </h4>
                {section.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {section.description}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {section.lessons?.length || 0} bài học
                </p>
              </div>
            </div>

            {/* Section Content - Collapsible */}
            {expandedSections.has(sectionIndex) && (
              <div className="divide-y divide-gray-200">
                {section.lessons?.map((lesson, lessonIndex) => (
                  <div key={lesson.lessonID} className="bg-white">
                    {/* Lesson Header - Clickable */}
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleLesson(sectionIndex, lessonIndex)}
                    >
                      {expandedLessons.get(`${sectionIndex}-${lessonIndex}`) ? (
                        <ChevronUp className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      )}
                      {lesson.lessonType === 'Video' ? (
                        <Video className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      ) : lesson.lessonType === 'Quiz' ? (
                        <HelpCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">
                          Bài {lessonIndex + 1}: {lesson.title}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {lesson.duration} phút
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {lesson.lessonType}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Lesson Details - Collapsible */}
                    {expandedLessons.get(`${sectionIndex}-${lessonIndex}`) && (
                      <div className="px-4 pb-4 space-y-4 bg-gray-50 border-t border-gray-200">
                        {/* Quiz Questions - Only for Quiz lessons */}
                        {lesson.lessonType === 'Quiz' ? (
                          <div className="pt-4">
                            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                              Câu hỏi
                            </p>
                            <QuizQuestionDisplay lesson={lesson} />
                          </div>
                        ) : (
                          <>
                            {/* Lesson Content */}
                            {lesson.content && (
                              <div className="pt-4">
                                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                                  Nội dung bài học
                                </p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {lesson.content}
                                </p>
                              </div>
                            )}

                            {/* Video URL */}
                            {lesson.videoURL && (
                              <div>
                                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                                  Video
                                </p>
                                <a
                                  href={lesson.videoURL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline bg-white p-3 rounded-lg border border-blue-200"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  <span className="flex-1 truncate">{lesson.videoURL}</span>
                                </a>
                              </div>
                            )}

                            {/* Resources */}
                            {lesson.resources && lesson.resources.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                                  Tài liệu ({lesson.resources.length})
                                </p>
                                <div className="space-y-2">
                                  {lesson.resources.map((resource) => (
                                    <div
                                      key={resource.resourceID}
                                      className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                                    >
                                      <FileText className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 mb-1">
                                          {resource.resourceTitle}
                                        </p>
                                        <a
                                          href={resource.resourceURL}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 truncate"
                                        >
                                          <LinkIcon className="w-3 h-3 flex-shrink-0" />
                                          <span className="truncate">{resource.resourceURL}</span>
                                        </a>
                                      </div>
                                      <Badge variant="outline" className="text-xs flex-shrink-0">
                                        {resource.resourceType}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* No content message */}
                            {!lesson.content && !lesson.videoURL && (!lesson.resources || lesson.resources.length === 0) && (
                              <div className="pt-4 text-center">
                                <p className="text-sm text-gray-500 italic">
                                  Bài học chưa có nội dung chi tiết
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Empty state */}
        {(!course.section || course.section.length === 0) && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Khóa học chưa có nội dung</p>
          </div>
        )}
      </div>
    </div>
  );
}
