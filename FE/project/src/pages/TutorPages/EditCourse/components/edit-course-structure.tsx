import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { getYouTubeUrlErrorMessage, getResourceUrlErrorMessage } from '@/utils/url-validation';
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
  Link2,
  GripVertical,
  CheckCircle2,
  Loader2,
  Plus,
} from 'lucide-react';
import { CourseDetail, Section, Lesson, Resource } from '../types';
import {
  CreateQuestionDialog,
  EditQuestionDialog,
  DeleteQuestionDialog,
  QuizQuestionList,
  ImportQuizQuestionsExcel,
} from '@/components/shared/QuizManagement';
import { toast } from 'sonner';
import { FileUploadField } from '@/components/shared/FileUploadField';

interface EditCourseStructureProps {
  course: CourseDetail;
  onUpdateSection: (sectionIndex: number, section: Section) => void;
  onUpdateLesson: (
    sectionIndex: number,
    lessonIndex: number,
    lesson: Lesson
  ) => void;
  onUpdateResource: (
    sectionIndex: number,
    lessonIndex: number,
    resourceIndex: number,
    resource: Resource
  ) => void;
  onDeleteSection: (sectionIndex: number) => void;
  onDeleteLesson: (sectionIndex: number, lessonIndex: number) => void;
  onDeleteResource: (
    sectionIndex: number,
    lessonIndex: number,
    resourceIndex: number
  ) => void;
  onCreateSection: (section: Section) => Promise<void>;
  onCreateLesson: (sectionIndex: number, lesson: Lesson) => Promise<void>;
  onCreateResource: (sectionIndex: number, lessonIndex: number, resource: Resource) => Promise<void>;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isDraft?: boolean;
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
  resourceType: 'PDF' | 'Video' | 'ExternalLink' | 'Document';
  resourceTitle: string;
  resourceURL: string;
}

export default function EditCourseStructure({
  course,
  onUpdateSection,
  onUpdateLesson,
  onUpdateResource,
  onDeleteSection,
  onDeleteLesson,
  onDeleteResource,
  onCreateSection,
  onCreateLesson,
  onCreateResource,
  onBack,
  onSubmit,
  isSubmitting,
  isDraft = false,
}: EditCourseStructureProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set([0])
  );
  const [expandedLessons, setExpandedLessons] = useState<Map<string, boolean>>(
    new Map()
  );



  // Edit section dialog
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(
    null
  );
  const [editingSectionData, setEditingSectionData] =
    useState<SectionFormData | null>(null);

  // Edit lesson dialog
  const [editingLessonKey, setEditingLessonKey] = useState<string | null>(null);
  const [editingLessonData, setEditingLessonData] =
    useState<LessonFormData | null>(null);

  // Edit resource dialog
  const [editingResourceKey, setEditingResourceKey] = useState<string | null>(
    null
  );
  const [editingResourceData, setEditingResourceData] =
    useState<ResourceFormData | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'section' | 'lesson' | 'resource';
    sectionIndex: number;
    lessonIndex?: number;
    resourceIndex?: number;
  } | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // Create section state
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [newSectionData, setNewSectionData] = useState<SectionFormData>({
    title: '',
    description: '',
  });

  // Create lesson state
  const [isCreatingLesson, setIsCreatingLesson] = useState<number | null>(null);
  const [newLessonData, setNewLessonData] = useState<LessonFormData>({
    title: '',
    duration: 0,
    lessonType: 'Video',
    videoURL: '',
    content: '',
  });

  // Quiz question management state
  const [isCreatingQuestion, setIsCreatingQuestion] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [questionRefreshKey, setQuestionRefreshKey] = useState<number>(0);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [cachedQuestions, setCachedQuestions] = useState<Record<string, any[]>>({});
  const [isImportingQuestions, setIsImportingQuestions] = useState<string | null>(null);

  // Note: Resources are added separately after lesson creation, not during creation

  // Validation error states
  const [videoUrlError, setVideoUrlError] = useState<string>('');
  const [editVideoUrlError, setEditVideoUrlError] = useState<string>('');
  const [editResourceUrlError, setEditResourceUrlError] = useState<string>('');
  const [resourceUrlError, setResourceUrlError] = useState<string>('');

  // Edit resource state (for lesson editing)
  const [showEditResourceDialog, setShowEditResourceDialog] = useState(false);
  const [editResourceData, setEditResourceData] = useState<ResourceFormData>({
    resourceType: 'PDF',
    resourceTitle: '',
    resourceURL: '',
  });
  const [editingResourceIndex, setEditingResourceIndex] = useState<number | null>(null);
  const [editLessonResources, setEditLessonResources] = useState<Resource[]>([]);

  // Create resource state (for standalone resource creation after lesson created)
  const [isCreatingResource, setIsCreatingResource] = useState<string | null>(null);
  const [standaloneResourceData, setStandaloneResourceData] = useState<ResourceFormData>({
    resourceType: 'PDF',
    resourceTitle: '',
    resourceURL: '',
  });

  // Create section
  const createSection = async () => {
    if (newSectionData && newSectionData.title.trim()) {
      setIsSaving(true);
      try {
        const newSection: Section = {
          sectionID: Math.floor(Math.random() * 10000),
          courseID: course.id,
          title: newSectionData.title,
          description: newSectionData.description,
          orderIndex: course.section.length,
          lessons: [],
        };

        onCreateSection(newSection);
        setIsCreatingSection(false);
        setNewSectionData({ title: '', description: '' });
      } catch (error) {
        console.error('Error creating section:', error);
        alert('Failed to create section');
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Create lesson
  const createLesson = async () => {
    if (isCreatingLesson !== null && newLessonData && newLessonData.title.trim()) {
      // No need to validate here - button is already disabled if invalid

      setIsSaving(true);
      try {
        const lessonCount = course.section[isCreatingLesson].lessons?.length || 0;

        const newLesson: Lesson = {
          lessonID: Math.floor(Math.random() * 10000),
          title: newLessonData.title,
          duration: newLessonData.duration,
          lessonType: newLessonData.lessonType,
          videoURL: newLessonData.videoURL,
          content: newLessonData.content,
          orderIndex: lessonCount,
          createdAt: new Date().toISOString(),
          resources: [], // Resources will be added separately after lesson creation
        };

        onCreateLesson(isCreatingLesson, newLesson);
        setIsCreatingLesson(null);
        setNewLessonData({
          title: '',
          duration: 0,
          lessonType: 'Video',
          videoURL: '',
          content: '',
        });
      } catch (error) {
        console.error('Error creating lesson:', error);
        alert('Failed to create lesson');
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Create resource (after lesson created)
  const createResource = async () => {
    if (isCreatingResource && standaloneResourceData && standaloneResourceData.resourceTitle.trim()) {
      setIsSaving(true);
      try {
        const [sectionIndex, lessonIndex] = isCreatingResource.split('-').map(Number);

        const newResource: Resource = {
          resourceID: Math.floor(Math.random() * 10000),
          resourceType: standaloneResourceData.resourceType,
          resourceTitle: standaloneResourceData.resourceTitle,
          resourceURL: standaloneResourceData.resourceURL,
          uploadedAt: new Date().toISOString(),
        };

        onCreateResource(sectionIndex, lessonIndex, newResource);
        setIsCreatingResource(null);
        setStandaloneResourceData({
          resourceType: 'PDF',
          resourceTitle: '',
          resourceURL: '',
        });
      } catch (error) {
        console.error('Error creating resource:', error);
        alert('Failed to create resource');
      } finally {
        setIsSaving(false);
      }
    }
  };

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

  // Add resource to edit lesson
  const addResourceToEditLesson = () => {
    if (!editResourceData.resourceTitle.trim() || !editResourceData.resourceURL.trim()) {
      alert('Please fill in resource title and URL');
      return;
    }

    const newResource: Resource = {
      resourceID: Math.floor(Math.random() * 10000),
      resourceType: editResourceData.resourceType,
      resourceTitle: editResourceData.resourceTitle,
      resourceURL: editResourceData.resourceURL,
      uploadedAt: new Date().toISOString(),
    };

    setEditLessonResources([...editLessonResources, newResource]);
    setEditResourceData({ resourceType: 'PDF', resourceTitle: '', resourceURL: '' });
    setShowEditResourceDialog(false);
  };

  // Update resource in edit lesson
  const updateEditLessonResource = () => {
    if (editingResourceIndex === null) return;
    if (!editResourceData.resourceTitle.trim() || !editResourceData.resourceURL.trim()) {
      alert('Please fill in resource title and URL');
      return;
    }

    const updated = [...editLessonResources];
    updated[editingResourceIndex] = {
      ...updated[editingResourceIndex],
      resourceType: editResourceData.resourceType,
      resourceTitle: editResourceData.resourceTitle,
      resourceURL: editResourceData.resourceURL,
    };

    setEditLessonResources(updated);
    setEditResourceData({ resourceType: 'PDF', resourceTitle: '', resourceURL: '' });
    setEditingResourceIndex(null);
    setShowEditResourceDialog(false);
  };



  // Open edit section dialog
  const openEditSection = (sectionIndex: number) => {
    const section = course.section[sectionIndex];
    setEditingSectionIndex(sectionIndex);
    setEditingSectionData({
      title: section.title,
      description: section.description,
    });
  };

  // Save section
  const saveSection = async () => {
    if (
      editingSectionIndex !== null &&
      editingSectionData &&
      editingSectionData.title.trim()
    ) {
      setIsSaving(true);
      try {
        const section = course.section[editingSectionIndex];
        const updatedSection: Section = {
          ...section,
          title: editingSectionData.title,
          description: editingSectionData.description,
        };
        onUpdateSection(editingSectionIndex, updatedSection);
        setEditingSectionIndex(null);
        setEditingSectionData(null);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Open edit lesson dialog
  const openEditLesson = (sectionIndex: number, lessonIndex: number) => {
    const lesson = course.section[sectionIndex].lessons[lessonIndex];
    const lessonType = lesson.lessonType as 'Video' | 'Reading';
    const videoURL = lesson.videoURL || '';

    setEditingLessonKey(`${sectionIndex}-${lessonIndex}`);
    setEditingLessonData({
      title: lesson.title,
      duration: lesson.duration,
      lessonType: lessonType,
      videoURL: videoURL,
      content: lesson.content || '',
    });
    setEditLessonResources(lesson.resources || []);

    // Validate video URL if lesson type is Video
    if (lessonType === 'Video') {
      setEditVideoUrlError(getYouTubeUrlErrorMessage(videoURL, true));
    } else {
      setEditVideoUrlError('');
    }
  };

  // Save lesson
  const saveLesson = async () => {
    if (editingLessonKey && editingLessonData && editingLessonData.title.trim()) {
      // No need to validate here - button is already disabled if invalid

      setIsSaving(true);
      try {
        const [sectionIndex, lessonIndex] = editingLessonKey
          .split('-')
          .map(Number);
        const lesson = course.section[sectionIndex].lessons[lessonIndex];
        const updatedLesson: Lesson = {
          ...lesson,
          title: editingLessonData.title,
          duration: editingLessonData.duration,
          lessonType: editingLessonData.lessonType,
          videoURL: editingLessonData.videoURL,
          content: editingLessonData.content,
          resources: editLessonResources,
        };
        onUpdateLesson(sectionIndex, lessonIndex, updatedLesson);
        setEditingLessonKey(null);
        setEditingLessonData(null);
        setEditLessonResources([]);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Open edit resource dialog
  const openEditResource = (
    sectionIndex: number,
    lessonIndex: number,
    resourceIndex: number
  ) => {
    const resource = course.section[sectionIndex].lessons[lessonIndex].resources[resourceIndex];
    setEditingResourceKey(`${sectionIndex}-${lessonIndex}-${resourceIndex}`);
    setEditingResourceData({
      resourceType: resource.resourceType,
      resourceTitle: resource.resourceTitle,
      resourceURL: resource.resourceURL,
    });

    // Validate existing resource URL
    const urlError = getResourceUrlErrorMessage(resource.resourceURL, true);
    setEditResourceUrlError(urlError);
  };

  // Save resource
  const saveResource = async () => {
    if (
      editingResourceKey &&
      editingResourceData &&
      editingResourceData.resourceTitle.trim()
    ) {
      setIsSaving(true);
      try {
        const [sectionIndex, lessonIndex, resourceIndex] = editingResourceKey
          .split('-')
          .map(Number);
        const resource =
          course.section[sectionIndex].lessons[lessonIndex].resources[resourceIndex];
        const updatedResource: Resource = {
          ...resource,
          resourceType: editingResourceData.resourceType,
          resourceTitle: editingResourceData.resourceTitle,
          resourceURL: editingResourceData.resourceURL,
        };
        onUpdateResource(
          sectionIndex,
          lessonIndex,
          resourceIndex,
          updatedResource
        );
        setEditingResourceKey(null);
        setEditingResourceData(null);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Confirm delete
  const confirmDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'section') {
      onDeleteSection(deleteConfirm.sectionIndex);
    } else if (deleteConfirm.type === 'lesson') {
      onDeleteLesson(deleteConfirm.sectionIndex, deleteConfirm.lessonIndex!);
    } else if (deleteConfirm.type === 'resource') {
      onDeleteResource(
        deleteConfirm.sectionIndex,
        deleteConfirm.lessonIndex!,
        deleteConfirm.resourceIndex!
      );
    }
    setDeleteConfirm(null);
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
          {course.section && course.section.length > 0 ? (
            course.section.map((section, sectionIndex) => (
              <Card key={section.sectionID} className="overflow-hidden">
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
                            key={lesson.lessonID}
                            className="p-4 hover:bg-gray-50 transition"
                          >
                            {/* Lesson Header */}
                            <div
                              className="flex items-center gap-3 cursor-pointer"
                              onClick={() =>
                                toggleLesson(sectionIndex, lessonIndex)
                              }
                            >
                              <GripVertical className="w-4 h-4 text-gray-400" />
                              {expandedLessons.get(
                                `${sectionIndex}-${lessonIndex}`
                              ) ? (
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
                                  {lesson.duration} phút •{' '}
                                  {lesson.lessonType}
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
                            {expandedLessons.get(
                              `${sectionIndex}-${lessonIndex}`
                            ) && (
                                <div className="mt-4 space-y-3 pl-7 border-l-2 border-gray-200">
                                  {lesson.lessonType === 'Video' && lesson.videoURL && (
                                    <div>
                                      <p className="text-xs font-semibold text-gray-600 uppercase">
                                        Video
                                      </p>
                                      <a
                                        href={lesson.videoURL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline mt-1 flex items-center gap-2"
                                      >
                                        <Link2 className="w-3 h-3" />
                                        Xem video
                                      </a>
                                    </div>
                                  )}

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
                                          {lesson.resources.map(
                                            (resource, resourceIndex) => (
                                              <div
                                                key={resource.resourceID}
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
                                                      openEditResource(
                                                        sectionIndex,
                                                        lessonIndex,
                                                        resourceIndex
                                                      )
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
                                            )
                                          )}
                                        </div>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          setIsCreatingResource(
                                            `${sectionIndex}-${lessonIndex}`
                                          )
                                        }
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
                                          Câu hỏi ({questionCounts[lesson.lessonID?.toString() || ''] || 0})
                                        </p>
                                      </div>
                                      {lesson.lessonID ? (
                                        <>
                                          <QuizQuestionList
                                            key={`${lesson.lessonID}-${questionRefreshKey}`}
                                            lessonId={lesson.lessonID.toString()}
                                            isDraft={isDraft}
                                            readOnly={false}
                                            initialQuestions={cachedQuestions[lesson.lessonID.toString()]}
                                            onQuestionsChange={(questions) => {
                                              const lessonIdStr = lesson.lessonID!.toString();
                                              setQuestionCounts((prev) => ({
                                                ...prev,
                                                [lessonIdStr]: questions.length,
                                              }));
                                              setCachedQuestions((prev) => ({
                                                ...prev,
                                                [lessonIdStr]: questions,
                                              }));
                                            }}
                                          />
                                          <div className="flex gap-2 mt-2">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => setIsCreatingQuestion(lesson.lessonID.toString())}
                                              className="flex-1 gap-2 border-dashed"
                                            >
                                              <Plus className="w-3 h-3" />
                                              Tạo câu hỏi
                                            </Button>
                                            <ImportQuizQuestionsExcel
                                              sectionIndex={sectionIndex}
                                              lessonIndex={lessonIndex}
                                              currentQuestionCount={questionCounts[lesson.lessonID?.toString() || ''] || 0}
                                              disabled={isImportingQuestions === lesson.lessonID?.toString()}
                                              onImport={async (questions) => {
                                                // Handle imported questions - need to save to API
                                                const lessonIdStr = lesson.lessonID!.toString();

                                                setIsImportingQuestions(lessonIdStr);

                                                try {
                                                  // Import quizApi
                                                  const { quizApi } = await import('@/pages/TutorPages/CreateCourse/quiz-api');

                                                  // Show progress toast
                                                  toast.info(`Đang import ${questions.length} câu hỏi...`);

                                                  // Create each question via API
                                                  let successCount = 0;
                                                  for (const question of questions) {
                                                    try {
                                                      await quizApi.createQuestion(
                                                        lessonIdStr,
                                                        {
                                                          questionText: question.questionText,
                                                          explanation: question.explanation,
                                                          score: question.score,
                                                          orderIndex: question.orderIndex,
                                                          options: question.options.map((opt) => ({
                                                            optionText: opt.optionText,
                                                            isCorrect: opt.isCorrect,
                                                            orderIndex: opt.orderIndex,
                                                          })),
                                                        },
                                                        isDraft
                                                      );
                                                      successCount++;
                                                    } catch (err) {
                                                      console.error('Error creating question:', err);
                                                    }
                                                  }

                                                  // Clear cache to force refresh
                                                  setCachedQuestions((prev) => {
                                                    const newCache = { ...prev };
                                                    delete newCache[lessonIdStr];
                                                    return newCache;
                                                  });

                                                  // Refresh the question list
                                                  setQuestionRefreshKey((prev) => prev + 1);

                                                  if (successCount === questions.length) {
                                                    toast.success(`Đã import thành công ${successCount} câu hỏi`);
                                                  } else {
                                                    toast.warning(`Đã import ${successCount}/${questions.length} câu hỏi`);
                                                  }
                                                } catch (error) {
                                                  console.error('Error importing questions:', error);
                                                  toast.error('Không thể import câu hỏi. Vui lòng thử lại');
                                                } finally {
                                                  setIsImportingQuestions(null);
                                                }
                                              }}
                                            />
                                          </div>
                                        </>
                                      ) : (
                                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                                          <p className="text-sm text-yellow-800">
                                            Vui lòng lưu bài học trước khi thêm câu hỏi. Nhấn nút "Lưu thay đổi" ở cuối trang để lưu.
                                          </p>
                                        </div>
                                      )}
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
                        onClick={() => {
                          setIsCreatingLesson(sectionIndex);
                          setVideoUrlError('');
                        }}
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
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Quay lại
          </Button>
          <Button
            onClick={onSubmit}
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
                <Label htmlFor="section-title" className="text-base">
                  Tiêu đề chương
                </Label>
                <Input
                  id="section-title"
                  value={editingSectionData.title}
                  onChange={(e) =>
                    setEditingSectionData({
                      ...editingSectionData,
                      title: e.target.value,
                    })
                  }
                  disabled={isSaving}
                />
              </div>
              <div>
                <Label htmlFor="section-description" className="text-base">
                  Mô tả chương
                </Label>
                <Textarea
                  id="section-description"
                  value={editingSectionData.description}
                  onChange={(e) =>
                    setEditingSectionData({
                      ...editingSectionData,
                      description: e.target.value,
                    })
                  }
                  disabled={isSaving}
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
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button onClick={saveSection} disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu'}
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
                <Label htmlFor="lesson-title" className="text-base">
                  Tiêu đề bài học
                </Label>
                <Input
                  id="lesson-title"
                  value={editingLessonData.title}
                  onChange={(e) =>
                    setEditingLessonData({
                      ...editingLessonData,
                      title: e.target.value,
                    })
                  }
                  disabled={isSaving}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="lesson-duration" className="text-sm">
                    Thời lượng (phút)
                  </Label>
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
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <Label htmlFor="lesson-type" className="text-sm">
                    Loại bài học
                  </Label>
                  <Select
                    value={editingLessonData.lessonType}
                    onValueChange={(value) =>
                      setEditingLessonData({
                        ...editingLessonData,
                        lessonType: value as 'Video' | 'Reading' | 'Quiz',
                      })
                    }
                    disabled
                  >
                    <SelectTrigger disabled>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Video">Video</SelectItem>
                      <SelectItem value="Reading">Đọc</SelectItem>
                      <SelectItem value="Quiz">Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Không thể thay đổi loại bài học sau khi tạo
                  </p>
                </div>
              </div>

              {editingLessonData.lessonType === 'Video' && (
                <div>
                  <Label htmlFor="lesson-video" className="text-base">
                    URL Video
                  </Label>
                  <Input
                    id="lesson-video"
                    value={editingLessonData.videoURL}
                    onChange={(e) => {
                      const url = e.target.value;
                      setEditingLessonData({
                        ...editingLessonData,
                        videoURL: url,
                      });
                      setEditVideoUrlError(getYouTubeUrlErrorMessage(url, true));
                    }}
                    onBlur={(e) => {
                      // Re-validate on blur to ensure required check
                      setEditVideoUrlError(getYouTubeUrlErrorMessage(e.target.value, true));
                    }}
                    disabled={isSaving}
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
                  <Label htmlFor="lesson-content" className="text-base">
                    Nội dung bài học
                  </Label>
                  <RichTextEditor
                    value={editingLessonData.content}
                    onChange={(value) =>
                      setEditingLessonData({
                        ...editingLessonData,
                        content: value,
                      })
                    }
                    placeholder="Nhập nội dung bài học tại đây. Bạn có thể định dạng văn bản, thêm hình ảnh, video và nhiều hơn nữa..."
                    disabled={isSaving}
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
                setEditLessonResources([]);
              }}
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button
              onClick={saveLesson}
              disabled={
                isSaving ||
                !editingLessonData?.title.trim() ||
                (editingLessonData?.duration || 0) <= 0 ||
                (editingLessonData?.lessonType === 'Video' && (!!editVideoUrlError || !editingLessonData?.videoURL?.trim())) ||
                (editingLessonData?.lessonType === 'Reading' && !editingLessonData?.content?.trim())
              }
            >
              {isSaving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Resource Dialog for Edit Lesson */}
      <Dialog open={showEditResourceDialog} onOpenChange={setShowEditResourceDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingResourceIndex !== null ? 'Chỉnh sửa tài nguyên' : 'Thêm tài nguyên'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-lesson-resource-type">Loại tài nguyên</Label>
              <Select
                value={editResourceData.resourceType}
                onValueChange={(value) =>
                  setEditResourceData({
                    ...editResourceData,
                    resourceType: value as 'PDF' | 'ExternalLink',
                  })
                }
              >
                <SelectTrigger disabled={isSaving}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="ExternalLink">Liên kết ngoài</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-lesson-resource-title">Tên tài nguyên</Label>
              <Input
                id="edit-lesson-resource-title"
                value={editResourceData.resourceTitle}
                onChange={(e) =>
                  setEditResourceData({
                    ...editResourceData,
                    resourceTitle: e.target.value,
                  })
                }
                disabled={isSaving}
                placeholder="VD: Hướng dẫn ngữ pháp"
              />
            </div>
            <div>
              <Label htmlFor="edit-lesson-resource-url">
                {editResourceData.resourceType === 'PDF' ? 'File tài nguyên' : 'URL tài nguyên'}
              </Label>
              {editResourceData.resourceType === 'PDF' ? (
                <FileUploadField
                  value={editResourceData.resourceURL}
                  onChange={(url) => {
                    setEditResourceData({
                      ...editResourceData,
                      resourceURL: url,
                    });
                    setEditResourceUrlError('');
                  }}
                  allowedTypes={['application/pdf']}
                  accept=".pdf"
                  error={editResourceUrlError}
                />
              ) : (
                <Input
                  id="edit-lesson-resource-url"
                  value={editResourceData.resourceURL}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setEditResourceData({
                      ...editResourceData,
                      resourceURL: newValue,
                    });
                    setEditResourceUrlError(getResourceUrlErrorMessage(newValue, true));
                  }}
                  onBlur={(e) => {
                    setEditResourceUrlError(getResourceUrlErrorMessage(e.target.value, true));
                  }}
                  disabled={isSaving}
                  placeholder="https://example.com/resource"
                  className={editResourceUrlError ? 'border-red-500' : ''}
                />
              )}
              {editResourceUrlError && editResourceData.resourceType !== 'PDF' && (
                <p className="text-sm text-red-600 mt-1">{editResourceUrlError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditResourceDialog(false);
                setEditingResourceIndex(null);
              }}
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button
              onClick={
                editingResourceIndex !== null
                  ? updateEditLessonResource
                  : addResourceToEditLesson
              }
              disabled={
                isSaving ||
                !editResourceData.resourceTitle.trim() ||
                !editResourceData.resourceURL.trim() ||
                !!editResourceUrlError
              }
            >
              {editingResourceIndex !== null ? 'Cập nhật' : 'Thêm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={editingResourceKey !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingResourceKey(null);
            setEditingResourceData(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
          </DialogHeader>

          {editingResourceData && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="resource-type" className="text-base">
                  Resource Type
                </Label>
                <Select
                  value={editingResourceData.resourceType}
                  onValueChange={(value) =>
                    setEditingResourceData({
                      ...editingResourceData,
                      resourceType: value as
                        | 'PDF'
                        | 'Video'
                        | 'ExternalLink'
                        | 'Document',
                    })
                  }
                >
                  <SelectTrigger disabled={isSaving}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="Video">Video</SelectItem>
                    <SelectItem value="ExternalLink">External Link</SelectItem>
                    <SelectItem value="Document">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="resource-title" className="text-base">
                  Resource Name
                </Label>
                <Input
                  id="resource-title"
                  value={editingResourceData.resourceTitle}
                  onChange={(e) =>
                    setEditingResourceData({
                      ...editingResourceData,
                      resourceTitle: e.target.value,
                    })
                  }
                  disabled={isSaving}
                />
              </div>

              <div>
                <Label htmlFor="resource-url" className="text-base">
                  {editingResourceData.resourceType === 'PDF' ? 'Resource File' : 'Resource URL'}
                </Label>
                {editingResourceData.resourceType === 'PDF' ? (
                  <FileUploadField
                    value={editingResourceData.resourceURL}
                    onChange={(url) => {
                      setEditingResourceData({
                        ...editingResourceData,
                        resourceURL: url,
                      });
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
                      const newValue = e.target.value;
                      setEditingResourceData({
                        ...editingResourceData,
                        resourceURL: newValue,
                      });
                      setEditResourceUrlError(getResourceUrlErrorMessage(newValue, true));
                    }}
                    onBlur={(e) => {
                      setEditResourceUrlError(getResourceUrlErrorMessage(e.target.value, true));
                    }}
                    disabled={isSaving}
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
              }}
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button
              onClick={saveResource}
              disabled={
                isSaving ||
                !editingResourceData?.resourceTitle.trim() ||
                !editingResourceData?.resourceURL.trim() ||
                !!editResourceUrlError
              }
            >
              {isSaving ? 'Đang lưu...' : 'Lưu'}
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
          <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteConfirm?.type === 'section' &&
              'Are you sure you want to delete this Section? All lessons in the Section will be deleted.'}
            {deleteConfirm?.type === 'lesson' &&
              'Are you sure you want to delete this lesson? All resources will be deleted.'}
            {deleteConfirm?.type === 'resource' &&
              'Are you sure you want to delete this resource?'}
          </AlertDialogDescription>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Section Dialog */}
      <Dialog
        open={isCreatingSection}
        onOpenChange={setIsCreatingSection}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tạo chương mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-section-title" className="text-base">
                Tên chương
              </Label>
              <Input
                id="new-section-title"
                value={newSectionData.title}
                onChange={(e) =>
                  setNewSectionData({
                    ...newSectionData,
                    title: e.target.value,
                  })
                }
                disabled={isSaving}
                placeholder="VD: Giới thiệu về ngữ pháp"
              />
            </div>
            <div>
              <Label htmlFor="new-section-description" className="text-base">
                Mô tả chương
              </Label>
              <Textarea
                id="new-section-description"
                value={newSectionData.description}
                onChange={(e) =>
                  setNewSectionData({
                    ...newSectionData,
                    description: e.target.value,
                  })
                }
                disabled={isSaving}
                rows={3}
                placeholder="Mô tả ngắn gọn về nội dung chương này..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreatingSection(false)}
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button onClick={createSection} disabled={isSaving}>
              {isSaving ? 'Đang tạo...' : 'Tạo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Lesson Dialog */}
      <Dialog
        open={isCreatingLesson !== null}
        onOpenChange={(open) => {
          if (!open) setIsCreatingLesson(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo bài học mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-lesson-title" className="text-base">
                Tên bài học
              </Label>
              <Input
                id="new-lesson-title"
                value={newLessonData.title}
                onChange={(e) =>
                  setNewLessonData({
                    ...newLessonData,
                    title: e.target.value,
                  })
                }
                disabled={isSaving}
                placeholder="VD: Giới thiệu về ngữ pháp cơ bản"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="new-lesson-duration" className="text-sm">
                  Thời lượng (phút)
                </Label>
                <Input
                  id="new-lesson-duration"
                  type="number"
                  min="1"
                  value={newLessonData.duration}
                  onChange={(e) =>
                    setNewLessonData({
                      ...newLessonData,
                      duration: parseInt(e.target.value) || 0,
                    })
                  }
                  disabled={isSaving}
                />
              </div>
              <div>
                <Label htmlFor="new-lesson-type" className="text-sm">
                  Loại bài học
                </Label>
                <Select
                  value={newLessonData.lessonType}
                  onValueChange={(value) => {
                    setNewLessonData({
                      ...newLessonData,
                      lessonType: value as 'Video' | 'Reading' | 'Quiz',
                    });
                    // Clear video URL error when switching lesson type
                    if (value === 'Reading' || value === 'Quiz') {
                      setVideoUrlError('');
                    }
                  }}
                >
                  <SelectTrigger disabled={isSaving}>
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
                <Label htmlFor="new-lesson-video" className="text-base">
                  URL Video
                </Label>
                <Input
                  id="new-lesson-video"
                  value={newLessonData.videoURL}
                  onChange={(e) => {
                    const url = e.target.value;
                    setNewLessonData({
                      ...newLessonData,
                      videoURL: url,
                    });
                    // Only validate if user has typed something
                    if (url.trim()) {
                      setVideoUrlError(getYouTubeUrlErrorMessage(url, false));
                    } else {
                      setVideoUrlError('');
                    }
                  }}
                  onBlur={(e) => {
                    // Only show required error on blur if field is empty
                    const url = e.target.value;
                    if (!url.trim()) {
                      setVideoUrlError('');
                    } else {
                      setVideoUrlError(getYouTubeUrlErrorMessage(url, false));
                    }
                  }}
                  disabled={isSaving}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={videoUrlError ? 'border-red-500' : ''}
                />
                {videoUrlError && (
                  <p className="text-sm text-red-600 mt-1">{videoUrlError}</p>
                )}
              </div>
            )}
            {newLessonData.lessonType === 'Reading' && (
              <div>
                <Label htmlFor="new-lesson-content" className="text-base">
                  Nội dung bài học
                </Label>
                <RichTextEditor
                  value={newLessonData.content}
                  onChange={(value) =>
                    setNewLessonData({
                      ...newLessonData,
                      content: value,
                    })
                  }
                  placeholder="Nhập nội dung bài học tại đây. Bạn có thể định dạng văn bản, thêm hình ảnh, video và nhiều hơn nữa..."
                  disabled={isSaving}
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
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                // Validate before creating
                if (newLessonData.lessonType === 'Video' && !newLessonData.videoURL?.trim()) {
                  setVideoUrlError('URL video là bắt buộc');
                  return;
                }
                createLesson();
              }}
              disabled={
                isSaving ||
                !newLessonData.title.trim() ||
                newLessonData.duration <= 0 ||
                (newLessonData.lessonType === 'Video' && !!videoUrlError) ||
                (newLessonData.lessonType === 'Reading' && !newLessonData.content?.trim())
                // Quiz lessons don't require videoURL or content
              }
            >
              {isSaving ? 'Đang tạo...' : 'Tạo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Resource Dialog (Standalone) */}
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
              <Label htmlFor="new-resource-type" className="text-base">
                Loại tài nguyên
              </Label>
              <Select
                value={standaloneResourceData.resourceType}
                onValueChange={(value) =>
                  setStandaloneResourceData({
                    ...standaloneResourceData,
                    resourceType: value as 'PDF' | 'ExternalLink',
                  })
                }
              >
                <SelectTrigger disabled={isSaving}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="ExternalLink">Liên kết ngoài</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-resource-title" className="text-base">
                Tên tài nguyên
              </Label>
              <Input
                id="new-resource-title"
                value={standaloneResourceData.resourceTitle}
                onChange={(e) =>
                  setStandaloneResourceData({
                    ...standaloneResourceData,
                    resourceTitle: e.target.value,
                  })
                }
                disabled={isSaving}
                placeholder="VD: Tài liệu ngữ pháp"
              />
            </div>
            <div>
              <Label htmlFor="new-resource-url" className="text-base">
                {standaloneResourceData.resourceType === 'PDF' ? 'File tài nguyên' : 'URL tài nguyên'}
              </Label>
              {standaloneResourceData.resourceType === 'PDF' ? (
                <FileUploadField
                  value={standaloneResourceData.resourceURL}
                  onChange={(url) => {
                    setStandaloneResourceData({ ...standaloneResourceData, resourceURL: url });
                    setResourceUrlError('');
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
                  disabled={isSaving}
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
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button onClick={createResource} disabled={isSaving}>
              {isSaving ? 'Đang tạo...' : 'Tạo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Question Dialog */}
      {isCreatingQuestion && (
        <CreateQuestionDialog
          open={true}
          lessonId={isCreatingQuestion}
          isDraft={isDraft}
          initialOrderIndex={(() => {
            const questions = cachedQuestions[isCreatingQuestion] || [];
            if (questions.length === 0) return 0;
            // Find max orderIndex and add 1
            const maxOrderIndex = Math.max(...questions.map((q) => q.orderIndex));
            return maxOrderIndex + 1;
          })()}
          onClose={() => setIsCreatingQuestion(null)}
          onSuccess={() => {
            // Invalidate cache for this lesson
            setCachedQuestions((prev) => {
              const newCache = { ...prev };
              delete newCache[isCreatingQuestion];
              return newCache;
            });
            setQuestionRefreshKey((prev) => prev + 1);
          }}
        />
      )}

      {/* Edit Question Dialog */}
      {editingQuestion && (
        <EditQuestionDialog
          open={true}
          question={editingQuestion}
          isDraft={isDraft}
          onClose={() => setEditingQuestion(null)}
          onSuccess={() => {
            // Invalidate cache for this lesson
            const lessonId = editingQuestion.lessonID?.toString();
            if (lessonId) {
              setCachedQuestions((prev) => {
                const newCache = { ...prev };
                delete newCache[lessonId];
                return newCache;
              });
            }
            setQuestionRefreshKey((prev) => prev + 1);
            setEditingQuestion(null);
          }}
        />
      )}

      {/* Delete Question Dialog */}
      {deletingQuestionId && (
        <DeleteQuestionDialog
          open={true}
          questionId={deletingQuestionId}
          isDraft={isDraft}
          onClose={() => setDeletingQuestionId(null)}
          onSuccess={() => {
            // Clear all cache to be safe
            setCachedQuestions({});
            setQuestionRefreshKey((prev) => prev + 1);
            setDeletingQuestionId(null);
          }}
        />
      )}
    </>
  );
}
