import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  FileText,
  GripVertical,
  CheckCircle2,
  Loader2,
  Plus,
} from 'lucide-react';
import { getYouTubeUrlErrorMessage, getResourceUrlErrorMessage } from '@/utils/url-validation';
import {
  LocalQuestionDialog,
  ImportQuizQuestionsExcel,
} from '@/components/shared/QuizManagement';
import { FileUploadField } from '@/components/shared/FileUploadField';

interface SectionData {
  id?: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  lessons: LessonData[];
}

interface LessonData {
  id?: string;
  title: string;
  duration: number;
  lessonType?: 'Video' | 'Reading' | 'Quiz';
  videoURL?: string;
  content?: string;
  orderIndex: number;
  resources?: LessonResourceData[];
  questions?: QuizQuestionData[];
  questionCount?: number;
}

interface LessonResourceData {
  id?: string;
  resourceType: 'PDF' | 'ExternalLink';
  resourceTitle: string;
  resourceURL: string;
}

interface QuizQuestionData {
  questionText: string;
  orderIndex: number;
  explanation: string;
  score: number;
  options: QuizOptionData[];
}

interface QuizOptionData {
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
}

interface CourseStructureProps {
  sections: SectionData[];
  onSectionsChange: (sections: SectionData[]) => void;
  onSave: (sections: SectionData[]) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

interface SectionFormData {
  title: string;
  description: string;
}

interface LessonFormData {
  title: string;
  duration: number;
  lessonType: 'Video' | 'Reading' | 'Quiz';
  videoURL: string;
  content: string;
}

interface ResourceFormData {
  resourceType: 'PDF' | 'ExternalLink';
  resourceTitle: string;
  resourceURL: string;
}

export default function CourseStructure({
  sections: initialSections,
  onSectionsChange,
  onSave,
  onBack,
  isSubmitting,
}: CourseStructureProps) {
  const [sections, setSections] = useState<SectionData[]>(initialSections);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set([0])
  );
  const [expandedLessons, setExpandedLessons] = useState<Map<string, boolean>>(
    new Map()
  );

  // Sync sections with parent component whenever they change
  useEffect(() => {
    onSectionsChange(sections);
  }, [sections, onSectionsChange]);

  // Update local state when initialSections prop changes
  useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);

  // Create section state
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [newSectionData, setNewSectionData] = useState<SectionFormData>({
    title: '',
    description: '',
  });

  // Edit section state
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [editingSectionData, setEditingSectionData] = useState<SectionFormData | null>(null);

  // Create lesson state
  const [isCreatingLesson, setIsCreatingLesson] = useState<number | null>(null);
  const [newLessonData, setNewLessonData] = useState<LessonFormData>({
    title: '',
    duration: 0,
    lessonType: 'Video',
    videoURL: '',
    content: '',
  });

  // Edit lesson state
  const [editingLessonKey, setEditingLessonKey] = useState<string | null>(null);
  const [editingLessonData, setEditingLessonData] = useState<LessonFormData | null>(null);

  // Create resource state
  const [isCreatingResource, setIsCreatingResource] = useState<string | null>(null);
  const [standaloneResourceData, setStandaloneResourceData] = useState<ResourceFormData>({
    resourceType: 'PDF',
    resourceTitle: '',
    resourceURL: '',
  });

  // Edit resource state
  const [editingResourceKey, setEditingResourceKey] = useState<string | null>(null);
  const [editingResourceData, setEditingResourceData] = useState<ResourceFormData | null>(null);

  // Validation errors
  const [videoUrlError, setVideoUrlError] = useState<string>('');
  const [editVideoUrlError, setEditVideoUrlError] = useState<string>('');
  const [resourceUrlError, setResourceUrlError] = useState<string>('');
  const [editResourceUrlError, setEditResourceUrlError] = useState<string>('');

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'section' | 'lesson' | 'resource' | 'question';
    sectionIndex: number;
    lessonIndex?: number;
    resourceIndex?: number;
    questionIndex?: number;
  } | null>(null);

  // Validation alert state
  const [validationAlert, setValidationAlert] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // Quiz question management state
  const [isCreatingQuestion, setIsCreatingQuestion] = useState<string | null>(null);
  const [editingQuestionKey, setEditingQuestionKey] = useState<string | null>(null);
  const [editingQuestionData, setEditingQuestionData] = useState<QuizQuestionData | null>(null);

  // Toggle section expand
  const toggleSection = (index: number) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedSections(newSet);
  };

  // Toggle lesson expand
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

  // Create section
  const createSection = () => {
    if (!newSectionData.title.trim()) return;

    const newSection: SectionData = {
      title: newSectionData.title,
      description: newSectionData.description,
      orderIndex: sections.length,
      lessons: [],
    };

    setSections([...sections, newSection]);
    setIsCreatingSection(false);
    setNewSectionData({ title: '', description: '' });
    setExpandedSections(new Set([...expandedSections, sections.length]));
  };

  // Edit section
  const openEditSection = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    setEditingSectionIndex(sectionIndex);
    setEditingSectionData({
      title: section.title,
      description: section.description || '',
    });
  };

  const saveSection = () => {
    if (editingSectionIndex === null || !editingSectionData?.title.trim()) return;

    const newSections = [...sections];
    newSections[editingSectionIndex] = {
      ...newSections[editingSectionIndex],
      title: editingSectionData.title,
      description: editingSectionData.description,
    };
    setSections(newSections);
    setEditingSectionIndex(null);
    setEditingSectionData(null);
  };

  // Delete section
  const deleteSection = (sectionIndex: number) => {
    const newSections = sections.filter((_, i) => i !== sectionIndex);
    setSections(newSections.map((s, i) => ({ ...s, orderIndex: i })));
  };

  // Create lesson
  const createLesson = () => {
    if (isCreatingLesson === null || !newLessonData.title.trim() || newLessonData.duration <= 0) return;

    const newLesson: LessonData = {
      title: newLessonData.title,
      duration: newLessonData.duration,
      lessonType: newLessonData.lessonType,
      videoURL: newLessonData.videoURL,
      content: newLessonData.content,
      orderIndex: sections[isCreatingLesson].lessons.length,
      resources: [],
    };

    const newSections = [...sections];
    newSections[isCreatingLesson].lessons = [
      ...newSections[isCreatingLesson].lessons,
      newLesson,
    ];
    setSections(newSections);
    setIsCreatingLesson(null);
    setNewLessonData({
      title: '',
      duration: 0,
      lessonType: 'Video',
      videoURL: '',
      content: '',
    });
    setVideoUrlError('');
  };

  // Edit lesson
  const openEditLesson = (sectionIndex: number, lessonIndex: number) => {
    const lesson = sections[sectionIndex].lessons[lessonIndex];
    setEditingLessonKey(`${sectionIndex}-${lessonIndex}`);
    setEditingLessonData({
      title: lesson.title,
      duration: lesson.duration,
      lessonType: lesson.lessonType || 'Video',
      videoURL: lesson.videoURL || '',
      content: lesson.content || '',
    });

    if (lesson.lessonType === 'Video') {
      setEditVideoUrlError(getYouTubeUrlErrorMessage(lesson.videoURL || '', true));
    } else {
      setEditVideoUrlError('');
    }
  };

  const saveLesson = () => {
    if (!editingLessonKey || !editingLessonData?.title.trim() || editingLessonData.duration <= 0) return;

    const [sectionIndex, lessonIndex] = editingLessonKey.split('-').map(Number);
    const newSections = [...sections];
    newSections[sectionIndex].lessons[lessonIndex] = {
      ...newSections[sectionIndex].lessons[lessonIndex],
      ...editingLessonData,
    };
    setSections(newSections);
    setEditingLessonKey(null);
    setEditingLessonData(null);
    setEditVideoUrlError('');
  };

  // Delete lesson
  const deleteLesson = (sectionIndex: number, lessonIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].lessons = newSections[sectionIndex].lessons
      .filter((_, i) => i !== lessonIndex)
      .map((l, i) => ({ ...l, orderIndex: i }));
    setSections(newSections);
  };

  // Create resource
  const createResource = () => {
    if (!isCreatingResource || !standaloneResourceData.resourceTitle.trim()) return;

    const [sectionIndex, lessonIndex] = isCreatingResource.split('-').map(Number);
    const newResource: LessonResourceData = {
      resourceType: standaloneResourceData.resourceType,
      resourceTitle: standaloneResourceData.resourceTitle,
      resourceURL: standaloneResourceData.resourceURL,
    };

    const newSections = [...sections];
    newSections[sectionIndex].lessons[lessonIndex].resources = [
      ...(newSections[sectionIndex].lessons[lessonIndex].resources || []),
      newResource,
    ];
    setSections(newSections);
    setIsCreatingResource(null);
    setStandaloneResourceData({
      resourceType: 'PDF',
      resourceTitle: '',
      resourceURL: '',
    });
    setResourceUrlError('');
  };

  // Edit resource
  const openEditResource = (sectionIndex: number, lessonIndex: number, resourceIndex: number) => {
    const resource = sections[sectionIndex].lessons[lessonIndex].resources![resourceIndex];
    setEditingResourceKey(`${sectionIndex}-${lessonIndex}-${resourceIndex}`);
    setEditingResourceData({
      resourceType: resource.resourceType,
      resourceTitle: resource.resourceTitle,
      resourceURL: resource.resourceURL,
    });
    setEditResourceUrlError(getResourceUrlErrorMessage(resource.resourceURL, true));
  };

  const saveResource = () => {
    if (!editingResourceKey || !editingResourceData?.resourceTitle.trim()) return;

    const [sectionIndex, lessonIndex, resourceIndex] = editingResourceKey.split('-').map(Number);
    const newSections = [...sections];
    newSections[sectionIndex].lessons[lessonIndex].resources![resourceIndex] = {
      ...newSections[sectionIndex].lessons[lessonIndex].resources![resourceIndex],
      ...editingResourceData,
    };
    setSections(newSections);
    setEditingResourceKey(null);
    setEditingResourceData(null);
    setEditResourceUrlError('');
  };

  // Delete resource
  const deleteResource = (sectionIndex: number, lessonIndex: number, resourceIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].lessons[lessonIndex].resources =
      newSections[sectionIndex].lessons[lessonIndex].resources!.filter((_, i) => i !== resourceIndex);
    setSections(newSections);
  };

  // Create question (add to local state)
  const createQuestion = (questionData: QuizQuestionData) => {
    if (!isCreatingQuestion) return;

    const [sectionIndex, lessonIndex] = isCreatingQuestion.split('-').map(Number);
    const newSections = [...sections];
    newSections[sectionIndex].lessons[lessonIndex].questions = [
      ...(newSections[sectionIndex].lessons[lessonIndex].questions || []),
      questionData,
    ];
    setSections(newSections);
  };

  // Edit question
  const saveQuestion = (questionData: QuizQuestionData) => {
    if (!editingQuestionKey) return;

    const [sectionIndex, lessonIndex, questionIndex] = editingQuestionKey.split('-').map(Number);
    const newSections = [...sections];
    newSections[sectionIndex].lessons[lessonIndex].questions![questionIndex] = questionData;
    setSections(newSections);
    setEditingQuestionKey(null);
    setEditingQuestionData(null);
  };

  // Delete question
  const deleteQuestion = (sectionIndex: number, lessonIndex: number, questionIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].lessons[lessonIndex].questions =
      newSections[sectionIndex].lessons[lessonIndex].questions!.filter((_, i) => i !== questionIndex);
    setSections(newSections);
  };

  // Import questions from Excel
  const handleImportQuestions = (sectionIndex: number, lessonIndex: number, questions: QuizQuestionData[]) => {
    const newSections = [...sections];
    const currentQuestions = newSections[sectionIndex].lessons[lessonIndex].questions || [];

    // Recalculate orderIndex for imported questions
    const questionsWithCorrectOrder = questions.map((q, index) => ({
      ...q,
      orderIndex: currentQuestions.length + index,
    }));

    // Add imported questions to the lesson
    newSections[sectionIndex].lessons[lessonIndex].questions = [
      ...currentQuestions,
      ...questionsWithCorrectOrder,
    ];

    setSections(newSections);

    // Log for debugging
    console.log('Imported questions:', questionsWithCorrectOrder.length);
    console.log('Total questions after import:', newSections[sectionIndex].lessons[lessonIndex].questions?.length);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'section') {
      deleteSection(deleteConfirm.sectionIndex);
    } else if (deleteConfirm.type === 'lesson') {
      deleteLesson(deleteConfirm.sectionIndex, deleteConfirm.lessonIndex!);
    } else if (deleteConfirm.type === 'resource') {
      deleteResource(
        deleteConfirm.sectionIndex,
        deleteConfirm.lessonIndex!,
        deleteConfirm.resourceIndex!
      );
    } else if ((deleteConfirm as any).type === 'question') {
      deleteQuestion(
        deleteConfirm.sectionIndex,
        deleteConfirm.lessonIndex!,
        (deleteConfirm as any).questionIndex!
      );
    }
    setDeleteConfirm(null);
  };

  // Submit
  const handleSubmit = () => {
    if (sections.length === 0) {
      setValidationAlert({
        title: 'Thiếu thông tin',
        message: 'Vui lòng thêm ít nhất một chương',
      });
      return;
    }

    const hasLessons = sections.some(s => s.lessons.length > 0);
    if (!hasLessons) {
      setValidationAlert({
        title: 'Thiếu thông tin',
        message: 'Vui lòng thêm ít nhất một bài học',
      });
      return;
    }

    onSave(sections);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Nội dung khóa học
            </h2>
            <p className="text-gray-600 mt-1">
              Quản lý các chương, bài học và tài nguyên cho khóa học của bạn
            </p>
          </div>
          <Button
            onClick={() => setIsCreatingSection(true)}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Thêm chương
          </Button>
        </div>

        {/* Sections List */}
        <div className="space-y-4">
          {sections && sections.length > 0 ? (
            sections.map((section, sectionIndex) => (
              <Card key={sectionIndex} className="overflow-hidden">
                {/* Section Header */}
                <div
                  className="flex items-center gap-4 p-4 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => toggleSection(sectionIndex)}
                >
                  <GripVertical className="w-5 h-5 text-gray-400" />
                  {expandedSections.has(sectionIndex) ? (
                    <ChevronUp className="w-5 h-5 text-blue-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-blue-600" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      Chương {sectionIndex + 1}: {section.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {section.lessons?.length || 0} bài học
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditSection(sectionIndex);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({
                          type: 'section',
                          sectionIndex,
                        });
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Section Content */}
                {expandedSections.has(sectionIndex) && (
                  <CardContent className="p-0">
                    {/* Lessons List */}
                    <div className="divide-y">
                      {section.lessons && section.lessons.length > 0 ? (
                        section.lessons.map((lesson, lessonIndex) => (
                          <div
                            key={lessonIndex}
                            className="p-4 hover:bg-gray-50 transition"
                          >
                            {/* Lesson Header */}
                            <div
                              className="flex items-center gap-3 cursor-pointer"
                              onClick={() => toggleLesson(sectionIndex, lessonIndex)}
                            >
                              <GripVertical className="w-4 h-4 text-gray-400" />
                              {expandedLessons.get(`${sectionIndex}-${lessonIndex}`) ? (
                                <ChevronUp className="w-4 h-4 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-600" />
                              )}
                              <FileText className="w-4 h-4 text-blue-600" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {lesson.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {lesson.duration} phút • {lesson.lessonType}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditLesson(sectionIndex, lessonIndex);
                                  }}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm({
                                      type: 'lesson',
                                      sectionIndex,
                                      lessonIndex,
                                    });
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Lesson Details */}
                            {expandedLessons.get(`${sectionIndex}-${lessonIndex}`) && (
                              <div className="mt-4 space-y-3 pl-7 border-l-2 border-gray-200">
                                {/* Resources (for Video and Reading lessons) */}
                                {lesson.lessonType !== 'Quiz' && (
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs font-semibold text-gray-600 uppercase">
                                        Tài nguyên ({lesson.resources?.length || 0})
                                      </p>
                                    </div>
                                    {lesson.resources && lesson.resources.length > 0 && (
                                      <div className="space-y-2 mb-2">
                                        {lesson.resources.map((resource, resourceIndex) => (
                                          <div
                                            key={resourceIndex}
                                            className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                                          >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                              <FileText className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                              <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                  {resource.resourceTitle}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                  {resource.resourceType}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0">
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                  openEditResource(sectionIndex, lessonIndex, resourceIndex)
                                                }
                                                className="h-8 w-8 p-0"
                                              >
                                                <Edit2 className="w-3 h-3" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                  setDeleteConfirm({
                                                    type: 'resource',
                                                    sectionIndex,
                                                    lessonIndex,
                                                    resourceIndex,
                                                  })
                                                }
                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setIsCreatingResource(`${sectionIndex}-${lessonIndex}`)}
                                      className="w-full gap-2 border-dashed"
                                    >
                                      <Plus className="w-3 h-3" />
                                      Thêm tài nguyên
                                    </Button>
                                  </div>
                                )}

                                {/* Quiz Questions (for Quiz lessons) */}
                                {lesson.lessonType === 'Quiz' && (
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs font-semibold text-gray-600 uppercase">
                                        Câu hỏi ({lesson.questions?.length || 0})
                                      </p>
                                    </div>
                                    {lesson.questions && lesson.questions.length > 0 && (
                                      <div className="space-y-2 mb-2">
                                        {lesson.questions
                                          .sort((a, b) => a.orderIndex - b.orderIndex)
                                          .map((question, questionIndex) => (
                                            <div
                                              key={questionIndex}
                                              className="flex items-start gap-2 p-3 bg-gray-50 rounded border border-gray-200"
                                            >
                                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                                <span className="text-sm font-semibold text-gray-700 flex-shrink-0 mt-0.5">
                                                  {questionIndex + 1}.
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-medium text-gray-900">
                                                    {question.questionText.length > 100
                                                      ? question.questionText.substring(0, 100) + '...'
                                                      : question.questionText}
                                                  </p>
                                                  <p className="text-xs text-gray-500 mt-1">
                                                    Điểm: {question.score} • {question.options.length} lựa chọn
                                                  </p>
                                                </div>
                                              </div>
                                              <div className="flex gap-1 flex-shrink-0">
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => {
                                                    setEditingQuestionKey(`${sectionIndex}-${lessonIndex}-${questionIndex}`);
                                                    setEditingQuestionData(question);
                                                  }}
                                                  className="h-8 w-8 p-0"
                                                >
                                                  <Edit2 className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() =>
                                                    setDeleteConfirm({
                                                      type: 'question' as any,
                                                      sectionIndex,
                                                      lessonIndex,
                                                      questionIndex,
                                                    })
                                                  }
                                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </Button>
                                              </div>
                                            </div>
                                          ))}
                                      </div>
                                    )}
                                    <div className="space-y-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setIsCreatingQuestion(`${sectionIndex}-${lessonIndex}`)}
                                        className="w-full gap-2 border-dashed"
                                      >
                                        <Plus className="w-3 h-3" />
                                        Tạo câu hỏi
                                      </Button>
                                      <ImportQuizQuestionsExcel
                                        sectionIndex={sectionIndex}
                                        lessonIndex={lessonIndex}
                                        currentQuestionCount={lesson.questions?.length || 0}
                                        onImport={(questions) => handleImportQuestions(sectionIndex, lessonIndex, questions)}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          Chương này chưa có bài học nào
                        </div>
                      )}
                    </div>

                    {/* Add Lesson Button */}
                    <div className="p-4 border-t bg-gray-50">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsCreatingLesson(sectionIndex)}
                        className="w-full gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Thêm bài học
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center text-gray-500">
              <p>Khóa học chưa có chương nào</p>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
            Quay lại
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Gửi
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Create Section Dialog */}
      <Dialog open={isCreatingSection} onOpenChange={setIsCreatingSection}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tạo chương mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-section-title">Tên chương</Label>
              <Input
                id="new-section-title"
                value={newSectionData.title}
                onChange={(e) => setNewSectionData({ ...newSectionData, title: e.target.value })}
                placeholder="VD: Giới thiệu về ngữ pháp"
              />
            </div>
            <div>
              <Label htmlFor="new-section-description">Mô tả chương</Label>
              <Textarea
                id="new-section-description"
                value={newSectionData.description}
                onChange={(e) => setNewSectionData({ ...newSectionData, description: e.target.value })}
                rows={3}
                placeholder="Mô tả ngắn gọn về nội dung chương này..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingSection(false)}>
              Hủy
            </Button>
            <Button onClick={createSection} disabled={!newSectionData.title.trim()}>
              Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Section Dialog */}
      <Dialog
        open={editingSectionIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSectionIndex(null);
            setEditingSectionData(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa chương</DialogTitle>
          </DialogHeader>
          {editingSectionData && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="section-title">Tiêu đề chương</Label>
                <Input
                  id="section-title"
                  value={editingSectionData.title}
                  onChange={(e) =>
                    setEditingSectionData({ ...editingSectionData, title: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="section-description">Mô tả chương</Label>
                <Textarea
                  id="section-description"
                  value={editingSectionData.description}
                  onChange={(e) =>
                    setEditingSectionData({ ...editingSectionData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingSectionIndex(null);
                setEditingSectionData(null);
              }}
            >
              Hủy
            </Button>
            <Button onClick={saveSection} disabled={!editingSectionData?.title.trim()}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Lesson Dialog */}
      <Dialog
        open={isCreatingLesson !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreatingLesson(null);
            setVideoUrlError('');
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo bài học mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-lesson-title">Tên bài học</Label>
              <Input
                id="new-lesson-title"
                value={newLessonData.title}
                onChange={(e) => setNewLessonData({ ...newLessonData, title: e.target.value })}
                placeholder="VD: Giới thiệu về ngữ pháp cơ bản"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="new-lesson-duration">Thời lượng (phút)</Label>
                <Input
                  id="new-lesson-duration"
                  type="number"
                  min="1"
                  value={newLessonData.duration}
                  onChange={(e) =>
                    setNewLessonData({ ...newLessonData, duration: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="new-lesson-type">Loại bài học</Label>
                <Select
                  value={newLessonData.lessonType}
                  onValueChange={(value) => {
                    setNewLessonData({ ...newLessonData, lessonType: value as 'Video' | 'Reading' | 'Quiz' });
                    if (value === 'Reading' || value === 'Quiz') setVideoUrlError('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Video">Video</SelectItem>
                    <SelectItem value="Reading">Đọc</SelectItem>
                    <SelectItem value="Quiz">Quiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {newLessonData.lessonType === 'Video' && (
              <div>
                <Label htmlFor="new-lesson-video">URL Video</Label>
                <Input
                  id="new-lesson-video"
                  value={newLessonData.videoURL}
                  onChange={(e) => {
                    const url = e.target.value;
                    setNewLessonData({ ...newLessonData, videoURL: url });
                    if (url.trim()) {
                      setVideoUrlError(getYouTubeUrlErrorMessage(url, false));
                    } else {
                      setVideoUrlError('');
                    }
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={videoUrlError ? 'border-red-500' : ''}
                />
                {videoUrlError && <p className="text-sm text-red-600 mt-1">{videoUrlError}</p>}
              </div>
            )}
            {newLessonData.lessonType === 'Reading' && (
              <div>
                <Label htmlFor="new-lesson-content">Nội dung bài học</Label>
                <RichTextEditor
                  value={newLessonData.content}
                  onChange={(value) => setNewLessonData({ ...newLessonData, content: value })}
                  placeholder="Nhập nội dung bài học tại đây..."
                />
              </div>
            )}
            {newLessonData.lessonType === 'Quiz' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  Sau khi tạo bài học Quiz, bạn có thể thêm câu hỏi.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreatingLesson(null);
                setVideoUrlError('');
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={createLesson}
              disabled={
                !newLessonData.title.trim() ||
                newLessonData.duration <= 0 ||
                (newLessonData.lessonType === 'Video' && !!videoUrlError) ||
                (newLessonData.lessonType === 'Reading' && !newLessonData.content?.trim())
              }
            >
              Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Lesson Dialog */}
      <Dialog
        open={editingLessonKey !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingLessonKey(null);
            setEditingLessonData(null);
            setEditVideoUrlError('');
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa bài học</DialogTitle>
          </DialogHeader>
          {editingLessonData && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="lesson-title">Tiêu đề bài học</Label>
                <Input
                  id="lesson-title"
                  value={editingLessonData.title}
                  onChange={(e) =>
                    setEditingLessonData({ ...editingLessonData, title: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="lesson-duration">Thời lượng (phút)</Label>
                  <Input
                    id="lesson-duration"
                    type="number"
                    min="1"
                    value={editingLessonData.duration}
                    onChange={(e) =>
                      setEditingLessonData({
                        ...editingLessonData,
                        duration: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="lesson-type">Loại bài học</Label>
                  <Select value={editingLessonData.lessonType} disabled>
                    <SelectTrigger disabled>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Video">Video</SelectItem>
                      <SelectItem value="Reading">Đọc</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Không thể thay đổi loại bài học sau khi tạo
                  </p>
                </div>
              </div>
              {editingLessonData.lessonType === 'Video' && (
                <div>
                  <Label htmlFor="lesson-video">URL Video</Label>
                  <Input
                    id="lesson-video"
                    value={editingLessonData.videoURL}
                    onChange={(e) => {
                      const url = e.target.value;
                      setEditingLessonData({ ...editingLessonData, videoURL: url });
                      setEditVideoUrlError(getYouTubeUrlErrorMessage(url, true));
                    }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className={editVideoUrlError ? 'border-red-500' : ''}
                  />
                  {editVideoUrlError && (
                    <p className="text-sm text-red-600 mt-1">{editVideoUrlError}</p>
                  )}
                </div>
              )}
              {editingLessonData.lessonType === 'Reading' && (
                <div>
                  <Label htmlFor="lesson-content">Nội dung bài học</Label>
                  <RichTextEditor
                    value={editingLessonData.content}
                    onChange={(value) =>
                      setEditingLessonData({ ...editingLessonData, content: value })
                    }
                    placeholder="Nhập nội dung bài học tại đây..."
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingLessonKey(null);
                setEditingLessonData(null);
                setEditVideoUrlError('');
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={saveLesson}
              disabled={
                !editingLessonData?.title.trim() ||
                (editingLessonData?.duration || 0) <= 0 ||
                (editingLessonData?.lessonType === 'Video' &&
                  (!!editVideoUrlError || !editingLessonData?.videoURL?.trim())) ||
                (editingLessonData?.lessonType === 'Reading' && !editingLessonData?.content?.trim())
              }
            >
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Resource Dialog */}
      <Dialog
        open={isCreatingResource !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreatingResource(null);
            setResourceUrlError('');
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Tạo tài nguyên mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-resource-type">Loại tài nguyên</Label>
              <Select
                value={standaloneResourceData.resourceType}
                onValueChange={(value) =>
                  setStandaloneResourceData({
                    ...standaloneResourceData,
                    resourceType: value as 'PDF' | 'ExternalLink',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="ExternalLink">Liên kết ngoài</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-resource-title">Tên tài nguyên</Label>
              <Input
                id="new-resource-title"
                value={standaloneResourceData.resourceTitle}
                onChange={(e) =>
                  setStandaloneResourceData({
                    ...standaloneResourceData,
                    resourceTitle: e.target.value,
                  })
                }
                placeholder="VD: Hướng dẫn ngữ pháp"
              />
            </div>
            <div>
              <Label htmlFor="new-resource-url">
                {standaloneResourceData.resourceType === 'PDF' ? 'File tài nguyên' : 'URL tài nguyên'}
              </Label>
              {standaloneResourceData.resourceType === 'PDF' ? (
                <FileUploadField
                  value={standaloneResourceData.resourceURL}
                  onChange={(url) => {
                    setStandaloneResourceData({ ...standaloneResourceData, resourceURL: url });
                    setResourceUrlError(''); // Clear error on successful upload
                  }}
                  allowedTypes={['application/pdf']}
                  accept=".pdf"
                  error={resourceUrlError}
                />
              ) : (
                <Input
                  id="new-resource-url"
                  value={standaloneResourceData.resourceURL}
                  onChange={(e) => {
                    const url = e.target.value;
                    setStandaloneResourceData({ ...standaloneResourceData, resourceURL: url });
                    setResourceUrlError(getResourceUrlErrorMessage(url, true));
                  }}
                  placeholder="https://example.com/resource"
                  className={resourceUrlError ? 'border-red-500' : ''}
                />
              )}
              {resourceUrlError && standaloneResourceData.resourceType !== 'PDF' && (
                <p className="text-sm text-red-600 mt-1">{resourceUrlError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreatingResource(null);
                setResourceUrlError('');
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={createResource}
              disabled={
                !standaloneResourceData.resourceTitle.trim() ||
                !standaloneResourceData.resourceURL.trim() ||
                !!resourceUrlError
              }
            >
              Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Resource Dialog */}
      <Dialog
        open={editingResourceKey !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingResourceKey(null);
            setEditingResourceData(null);
            setEditResourceUrlError('');
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa tài nguyên</DialogTitle>
          </DialogHeader>
          {editingResourceData && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="resource-type">Loại tài nguyên</Label>
                <Select
                  value={editingResourceData.resourceType}
                  onValueChange={(value) =>
                    setEditingResourceData({
                      ...editingResourceData,
                      resourceType: value as 'PDF' | 'ExternalLink',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="ExternalLink">Liên kết ngoài</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="resource-title">Tên tài nguyên</Label>
                <Input
                  id="resource-title"
                  value={editingResourceData.resourceTitle}
                  onChange={(e) =>
                    setEditingResourceData({
                      ...editingResourceData,
                      resourceTitle: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="resource-url">
                  {editingResourceData.resourceType === 'PDF' ? 'File tài nguyên' : 'URL tài nguyên'}
                </Label>
                {editingResourceData.resourceType === 'PDF' ? (
                  <FileUploadField
                    value={editingResourceData.resourceURL}
                    onChange={(url) => {
                      setEditingResourceData({ ...editingResourceData, resourceURL: url });
                      setEditResourceUrlError('');
                    }}
                    allowedTypes={['application/pdf']}
                    accept=".pdf"
                    error={editResourceUrlError}
                  />
                ) : (
                  <Input
                    id="resource-url"
                    value={editingResourceData.resourceURL}
                    onChange={(e) => {
                      const url = e.target.value;
                      setEditingResourceData({ ...editingResourceData, resourceURL: url });
                      setEditResourceUrlError(getResourceUrlErrorMessage(url, true));
                    }}
                    placeholder="https://example.com/resource"
                    className={editResourceUrlError ? 'border-red-500' : ''}
                  />
                )}
                {editResourceUrlError && editingResourceData.resourceType !== 'PDF' && (
                  <p className="text-sm text-red-600 mt-1">{editResourceUrlError}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingResourceKey(null);
                setEditingResourceData(null);
                setEditResourceUrlError('');
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={saveResource}
              disabled={
                !editingResourceData?.resourceTitle.trim() ||
                !editingResourceData?.resourceURL.trim() ||
                !!editResourceUrlError
              }
            >
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteConfirm?.type === 'section' &&
              'Bạn có chắc muốn xóa chương này? Tất cả bài học trong chương sẽ bị xóa.'}
            {deleteConfirm?.type === 'lesson' &&
              'Bạn có chắc muốn xóa bài học này? Tất cả tài nguyên sẽ bị xóa.'}
            {deleteConfirm?.type === 'resource' &&
              'Bạn có chắc muốn xóa tài nguyên này?'}
          </AlertDialogDescription>
          <div className="flex justify-end gap-3 mt-4">
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Validation Alert Dialog */}
      <AlertDialog
        open={validationAlert !== null}
        onOpenChange={(open) => {
          if (!open) setValidationAlert(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>{validationAlert?.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {validationAlert?.message}
          </AlertDialogDescription>
          <div className="flex justify-end gap-3 mt-4">
            <AlertDialogAction
              onClick={() => setValidationAlert(null)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              OK
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Question Dialog */}
      <LocalQuestionDialog
        open={isCreatingQuestion !== null || editingQuestionKey !== null}
        question={editingQuestionData}
        initialOrderIndex={
          isCreatingQuestion
            ? (() => {
              const [sectionIndex, lessonIndex] = isCreatingQuestion.split('-').map(Number);
              return sections[sectionIndex]?.lessons[lessonIndex]?.questions?.length || 0;
            })()
            : 0
        }
        onClose={() => {
          setIsCreatingQuestion(null);
          setEditingQuestionKey(null);
          setEditingQuestionData(null);
        }}
        onSave={(questionData: QuizQuestionData) => {
          if (editingQuestionKey) {
            saveQuestion(questionData);
          } else {
            createQuestion(questionData);
          }
          setIsCreatingQuestion(null);
          setEditingQuestionKey(null);
          setEditingQuestionData(null);
        }}
        onSaveAndContinue={
          !editingQuestionKey
            ? (questionData: QuizQuestionData) => {
              createQuestion(questionData);
            }
            : undefined
        }
      />
    </>
  );
}
