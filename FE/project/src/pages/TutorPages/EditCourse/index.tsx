import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  getCourseDetail,
  updateCourse,
  updateSection,
  updateLesson,
  updateResource,
  deleteSection,
  deleteLesson,
  deleteResource,
  submitCourseForApproval,
  getObjectives,
  createObjective,
  updateObjective,
  deleteObjective,
} from './edit-course-api';
import {
  updateCourseDraft,
  getDraftCourseDetail,
  getDraftObjectives,
  createDraftObjective,
  updateDraftObjective,
  deleteDraftObjective,
  createDraftSection,
  updateDraftSection,
  createDraftLesson,
  updateDraftLesson,
  updateDraftResource,
  deleteDraftSection,
  deleteDraftLesson,
  deleteDraftResource,
  createDraftResource,
  submitCourseDraft,
  type DraftCourseData,
} from '@/pages/TutorPages/CourseList/draft-course-api';
import courseApi from '@/pages/TutorPages/CreateCourse/course-api';
import { CourseDetail, Section, Lesson, Resource } from './types';
import { EditCourseInfo, EditCourseStructure } from './components';
import EditCourseObjectives, { ObjectiveEditItem } from './components/edit-course-objectives';
import { getCourseListRoute } from '@/utils/course-routes';
import { StandardPageHeading } from '@/components/shared';

const EditCourse = () => {
  const { courseId, draftId } = useParams<{ courseId: string; draftId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // ========== MAIN STATES ==========
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [objectives, setObjectives] = useState<ObjectiveEditItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // ========== DRAFT MODE STATES ==========
  // Initialize as undefined to prevent race condition
  const [isDraftMode, setIsDraftMode] = useState<boolean | undefined>(undefined);
  const [currentDraftId, setCurrentDraftId] = useState<number | null>(null);

  // ========== NAVIGATION HELPERS ==========
  const handleBackToCourseList = () => {
    navigate(getCourseListRoute());
  };

  // ========== HELPER: Normalize course data ==========
  const normalizeCourseData = (courseData: CourseDetail): CourseDetail => {
    return {
      ...courseData,
      section: Array.isArray(courseData?.section)
        ? courseData.section.map(section => ({
          ...section,
          lessons: Array.isArray(section.lessons)
            ? section.lessons.map(lesson => ({
              ...lesson,
              resources: Array.isArray(lesson.resources)
                ? lesson.resources
                : [],
            }))
            : [],
        }))
        : [],
    };
  };

  // ========== HELPER: Convert draft data to CourseDetail format ==========
  const convertDraftToCourseDetail = (draftData: DraftCourseData, originalCourseId: number): CourseDetail => {
    return {
      id: originalCourseId,
      title: draftData.title,
      shortDescription: draftData.shortDescription,
      description: draftData.description,
      requirement: draftData.requirement,
      level: draftData.level,
      duration: draftData.duration,
      price: draftData.price,
      language: draftData.language,
      thumbnailURL: draftData.thumbnailURL,
      categoryName: draftData.categoryName,
      status: draftData.status,
      section: Array.isArray(draftData.section)
        ? draftData.section.map((section: any) => ({
          sectionID: section.sectionID,  // Backend returns sectionID (draft ID)
          courseID: section.courseID || originalCourseId,
          title: section.title,
          description: section.description || '',
          orderIndex: section.orderIndex,
          lessons: Array.isArray(section.lessons)
            ? section.lessons.map((lesson: any) => ({
              lessonID: lesson.lessonID,  // Backend returns lessonID (draft ID)
              title: lesson.title,
              duration: lesson.duration || 0,
              lessonType: lesson.lessonType || 'Reading',
              videoURL: lesson.videoURL || '',
              content: lesson.content || '',
              orderIndex: lesson.orderIndex,
              createdAt: lesson.createdAt || new Date().toISOString(),
              resources: Array.isArray(lesson.resources)
                ? lesson.resources.map((resource: any) => ({
                  resourceID: resource.resourceID,  // Backend returns resourceID (draft ID)
                  resourceType: resource.resourceType || 'ExternalLink',
                  resourceTitle: resource.resourceTitle,
                  resourceURL: resource.resourceURL,
                  uploadedAt: new Date().toISOString(),
                  orderIndex: resource.orderIndex || 0,
                }))
                : [],
            }))
            : [],
        }))
        : [],
    };
  };

  // ========== DETECT DRAFT MODE ==========
  useEffect(() => {
    // Check if we're in draft mode from URL parameters
    if (draftId) {
      // Draft mode detected from URL parameters (new route structure)
      setIsDraftMode(true);
      setCurrentDraftId(parseInt(draftId));
    } else {
      // Check legacy URL parameters for backward compatibility
      const urlParams = new URLSearchParams(location.search);
      const draftIdParam = urlParams.get('draftId');
      const isDraftParam = urlParams.get('isDraft') === 'true';

      // Check location state for draft data (passed from CourseCard)
      const locationState = location.state as any;
      const draftData = locationState?.draftData;
      const isDraftFromState = locationState?.isDraft === true;

      if (draftIdParam && isDraftParam) {
        // Draft mode detected from legacy URL parameters
        setIsDraftMode(true);
        setCurrentDraftId(parseInt(draftIdParam));
      } else if (isDraftFromState && draftData) {
        // Draft mode detected from location state
        setIsDraftMode(true);
        setCurrentDraftId(draftData.id);
      } else {
        // Regular course editing mode
        setIsDraftMode(false);
        setCurrentDraftId(null);
      }
    }
  }, [draftId, location]);

  // ========== FETCH COURSE DATA ==========
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;

      try {
        setIsLoading(true);
        setError(null);

        let courseData: CourseDetail;

        if (isDraftMode && currentDraftId) {
          // DRAFT MODE: Always fetch fresh draft course data from API
          const draftData = await getDraftCourseDetail(currentDraftId);
          courseData = convertDraftToCourseDetail(draftData, parseInt(courseId));

          // Fetch draft objectives only
          try {
            const objectivesData = await getDraftObjectives(currentDraftId);
            const formattedObjectives = objectivesData.map((obj: any) => {
              const objectiveId = obj.objectiveDraftID || obj.objectiveID || obj.id;
              return {
                id: objectiveId,
                objectiveText: obj.objectiveText,
                orderIndex: obj.orderIndex,
                isNew: false,
              };
            });
            setObjectives(formattedObjectives);
          } catch (objErr) {
            console.error('Error fetching draft objectives:', objErr);
            setObjectives([]);
          }
        } else if (isDraftMode === false) {
          // REGULAR MODE: Fetch regular course data only
          courseData = await getCourseDetail(parseInt(courseId));

          // Fetch regular objectives only
          try {
            const objectivesData = await getObjectives(parseInt(courseId));
            const formattedObjectives = objectivesData.map((obj: any) => {
              const objectiveId = obj.objectiveID || obj.id;
              return {
                id: objectiveId,
                objectiveText: obj.objectiveText,
                orderIndex: obj.orderIndex,
                isNew: false,
              };
            });
            setObjectives(formattedObjectives);
          } catch (objErr) {
            console.error('Error fetching regular objectives:', objErr);
            setObjectives([]);
          }
        } else {
          // Mode not determined yet
          return;
        }

        // Normalize all nested arrays
        const normalizedCourse = normalizeCourseData(courseData);
        setCourse(normalizedCourse);
      } catch (err: any) {
        console.error('Error fetching course:', err);
        setError(err.message || 'Không thể tải thông tin khóa học');
        setCourse(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch data when we have determined the mode
    // This prevents race condition where we fetch with wrong mode
    if (isDraftMode !== undefined) {
      fetchCourseData();
    }
  }, [courseId, isDraftMode, currentDraftId]);

  // ========== STEP 1: UPDATE COURSE INFO ==========
  const handleStep1Save = async (
    courseData: Partial<CourseDetail>
  ) => {
    if (!courseId || !course) return;

    setIsSaving(true);
    try {
      const updateData = {
        title: courseData.title || course.title,
        shortDescription: courseData.shortDescription || course.shortDescription,
        description: courseData.description || course.description,
        requirement: courseData.requirement || course.requirement,
        level: courseData.level || course.level,
        duration: courseData.duration || course.duration,
        price: courseData.price || course.price,
        language: courseData.language || course.language,
        thumbnailURL: courseData.thumbnailURL || course.thumbnailURL,
        categoryID: 1, // TODO: Get from form
      };

      if (isDraftMode && currentDraftId) {
        // Update draft course
        await updateCourseDraft(currentDraftId, updateData);

        // Update local state with the new data
        setCourse({
          ...course,
          ...updateData,
        });
      } else {
        // Update regular course
        await updateCourse(parseInt(courseId), updateData);

        // Re-fetch the complete course data with sections/lessons/resources
        const updated = await getCourseDetail(parseInt(courseId));
        const normalizedCourse = normalizeCourseData(updated);
        setCourse(normalizedCourse);
      }

      toast({
        title: 'Thành công',
        description: 'Thông tin khóa học đã được cập nhật',
      });

      setCurrentStep(2);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể cập nhật khóa học';
      setError(message);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ========== STEP 2: UPDATE SECTIONS/LESSONS/RESOURCES ==========
  const handleStep2UpdateSection = async (
    sectionIndex: number,
    sectionData: Section
  ) => {
    if (!course) return;

    setIsSaving(true);
    try {
      const updateData = {
        title: sectionData.title,
        description: sectionData.description,
        orderIndex: sectionData.orderIndex,
      };

      if (isDraftMode && currentDraftId) {
        // Update draft section
        await updateDraftSection(sectionData.sectionID, updateData);

        // Update local state
        const newSections = [...course.section];
        newSections[sectionIndex] = { ...sectionData };
        setCourse({ ...course, section: newSections });
      } else {
        // Update regular section
        const updated = await updateSection(sectionData.sectionID, updateData);

        const newSections = [...course.section];
        newSections[sectionIndex] = updated;
        setCourse({ ...course, section: newSections });
      }

      toast({
        title: 'Thành công',
        description: 'Chương đã được cập nhật',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể cập nhật chương';
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStep2UpdateLesson = async (
    sectionIndex: number,
    lessonIndex: number,
    lessonData: Lesson
  ) => {
    if (!course) return;

    setIsSaving(true);
    try {
      const lessonUpdateData = {
        title: lessonData.title,
        duration: lessonData.duration,
        lessonType: lessonData.lessonType,
        videoURL: lessonData.videoURL || '',
        content: lessonData.content || '',
        orderIndex: lessonData.orderIndex,
      };

      if (isDraftMode && currentDraftId) {
        // Update draft lesson
        await updateDraftLesson(lessonData.lessonID, lessonUpdateData);

        // Handle resources for draft mode
        const originalResources = course.section[sectionIndex].lessons[lessonIndex].resources || [];
        const updatedResources = lessonData.resources || [];

        // Find new resources
        const newResources = updatedResources.filter(r => !originalResources.some(or => or.resourceID === r.resourceID));

        // Find deleted resources
        const deletedResources = originalResources.filter(or => !updatedResources.some(r => r.resourceID === or.resourceID));

        // Find updated resources
        const changedResources = updatedResources.filter(r =>
          originalResources.some(or => or.resourceID === r.resourceID && (
            or.resourceTitle !== r.resourceTitle ||
            or.resourceURL !== r.resourceURL ||
            or.resourceType !== r.resourceType
          ))
        );

        // Create new resources using draft API
        for (const res of newResources) {
          if (res.resourceID > 0 && res.resourceID < 10000) {
            // This is a locally generated ID, create it via draft API
            await createDraftResource(lessonData.lessonID, {
              resourceType: res.resourceType as 'PDF' | 'ExternalLink',
              resourceTitle: res.resourceTitle,
              resourceURL: res.resourceURL,
              orderIndex: res.orderIndex || 0,
            });
          }
        }

        // Update changed resources using draft API
        for (const res of changedResources) {
          if (res.resourceID) {
            await updateDraftResource(res.resourceID, {
              resourceType: res.resourceType as 'PDF' | 'ExternalLink',
              resourceTitle: res.resourceTitle,
              resourceURL: res.resourceURL,
              orderIndex: res.orderIndex || 0,
            });
          }
        }

        // Delete removed resources using draft API
        for (const res of deletedResources) {
          if (res.resourceID) {
            await deleteDraftResource(res.resourceID);
          }
        }

        // Update local state
        const newSections = [...course.section];
        newSections[sectionIndex].lessons[lessonIndex] = {
          ...lessonData,
          resources: updatedResources,
        };
        setCourse({ ...course, section: newSections });
      } else {
        // Regular lesson update
        // 1. Update lesson basic info
        const updated = await updateLesson(lessonData.lessonID, lessonUpdateData);

        // 2. Handle resources
        const originalResources = course.section[sectionIndex].lessons[lessonIndex].resources || [];
        const updatedResources = lessonData.resources || [];

        // Find new resources (no resourceID from server means it's newly created)
        const newResources = updatedResources.filter(r => !originalResources.some(or => or.resourceID === r.resourceID));

        // Find deleted resources
        const deletedResources = originalResources.filter(or => !updatedResources.some(r => r.resourceID === or.resourceID));

        // Find updated resources
        const changedResources = updatedResources.filter(r =>
          originalResources.some(or => or.resourceID === r.resourceID && (
            or.resourceTitle !== r.resourceTitle ||
            or.resourceURL !== r.resourceURL ||
            or.resourceType !== r.resourceType
          ))
        );

        // Create new resources
        for (const res of newResources) {
          if (res.resourceID > 0 && res.resourceID < 10000) {
            // This is a locally generated ID, create it via API
            const resourceType = res.resourceType as 'PDF' | 'ExternalLink';
            await courseApi.addLessonResource(
              course.id.toString(),
              course.section[sectionIndex].sectionID.toString(),
              lessonData.lessonID.toString(),
              {
                resourceType,
                resourceTitle: res.resourceTitle,
                resourceURL: res.resourceURL,
              }
            );
          }
        }

        // Update changed resources
        for (const res of changedResources) {
          if (res.resourceID) {
            const resourceType = res.resourceType as 'PDF' | 'ExternalLink';
            await courseApi.updateResource(res.resourceID.toString(), {
              resourceType,
              resourceTitle: res.resourceTitle,
              resourceURL: res.resourceURL,
            });
          }
        }

        // Delete removed resources
        for (const res of deletedResources) {
          if (res.resourceID) {
            await courseApi.deleteResource(res.resourceID.toString());
          }
        }

        // 3. Update state with the updated lesson
        const newSections = [...course.section];
        newSections[sectionIndex].lessons[lessonIndex] = {
          ...updated,
          resources: updatedResources,
        };
        setCourse({ ...course, section: newSections });
      }

      toast({
        title: 'Thành công',
        description: 'Bài học đã được cập nhật',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể cập nhật bài học';
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStep2UpdateResource = async (
    sectionIndex: number,
    lessonIndex: number,
    resourceIndex: number,
    resourceData: Resource
  ) => {
    if (!course) return;

    setIsSaving(true);
    try {
      const resourceUpdateData = {
        resourceType: resourceData.resourceType as 'PDF' | 'ExternalLink',
        resourceTitle: resourceData.resourceTitle,
        resourceURL: resourceData.resourceURL,
        orderIndex: resourceData.orderIndex || 0,
      };

      if (isDraftMode && currentDraftId) {
        // Update draft resource
        await updateDraftResource(resourceData.resourceID, resourceUpdateData);

        // Update local state
        const newSections = [...course.section];
        newSections[sectionIndex].lessons[lessonIndex].resources[resourceIndex] = resourceData;
        setCourse({ ...course, section: newSections });
      } else {
        // Update regular resource
        const updated = await updateResource(resourceData.resourceID, {
          resourceType: resourceData.resourceType,
          resourceTitle: resourceData.resourceTitle,
          resourceURL: resourceData.resourceURL,
        });

        const newSections = [...course.section];
        newSections[sectionIndex].lessons[lessonIndex].resources[resourceIndex] = updated;
        setCourse({ ...course, section: newSections });
      }

      toast({
        title: 'Thành công',
        description: 'Tài nguyên đã được cập nhật',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể cập nhật tài nguyên';
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStep2DeleteSection = async (sectionIndex: number) => {
    if (!course) return;

    const sectionId = course.section[sectionIndex].sectionID;
    setIsSaving(true);

    try {
      if (isDraftMode && currentDraftId) {
        // Delete draft section
        await deleteDraftSection(sectionId);
      } else {
        // Delete regular section
        await deleteSection(sectionId);
      }

      const newSections = course.section.filter(
        (_, i) => i !== sectionIndex
      );
      setCourse({ ...course, section: newSections });

      toast({
        title: 'Thành công',
        description: 'Chương đã được xóa',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể xóa chương';
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStep2DeleteLesson = async (
    sectionIndex: number,
    lessonIndex: number
  ) => {
    if (!course) return;

    const lessonId =
      course.section[sectionIndex].lessons[lessonIndex].lessonID;
    setIsSaving(true);

    try {
      if (isDraftMode && currentDraftId) {
        // Delete draft lesson
        await deleteDraftLesson(lessonId);
      } else {
        // Delete regular lesson
        await deleteLesson(lessonId);
      }

      const newSections = [...course.section];
      newSections[sectionIndex].lessons = newSections[
        sectionIndex
      ].lessons.filter((_, i) => i !== lessonIndex);
      setCourse({ ...course, section: newSections });

      toast({
        title: 'Thành công',
        description: 'Bài học đã được xóa',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể xóa bài học';
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStep2DeleteResource = async (
    sectionIndex: number,
    lessonIndex: number,
    resourceIndex: number
  ) => {
    if (!course) return;

    const resourceId =
      course.section[sectionIndex].lessons[lessonIndex].resources[
        resourceIndex
      ].resourceID;

    setIsSaving(true);

    try {
      if (isDraftMode && currentDraftId) {
        // Delete draft resource
        await deleteDraftResource(resourceId);
      } else {
        // Delete regular resource
        await deleteResource(resourceId);
      }

      const newSections = [...course.section];
      newSections[sectionIndex].lessons[lessonIndex].resources =
        newSections[sectionIndex].lessons[lessonIndex].resources.filter(
          (_, i) => i !== resourceIndex
        );
      setCourse({ ...course, section: newSections });

      toast({
        title: 'Thành công',
        description: 'Tài nguyên đã được xóa',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể xóa tài nguyên';
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ========== STEP 1.5: MANAGE OBJECTIVES ==========
  const handleStep1aSaveObjectives = async (
    objectivesList: ObjectiveEditItem[]
  ) => {
    if (!courseId) return;

    setIsSaving(true);
    try {
      // Handle updates to existing objectives
      for (const objective of objectivesList) {
        if (objective.isNew || objective.id < 0) {
          // Create new objective
          let response;

          if (isDraftMode && currentDraftId) {
            response = await createDraftObjective(currentDraftId, {
              objectiveText: objective.objectiveText,
              orderIndex: objective.orderIndex,
            });
          } else {
            response = await createObjective(parseInt(courseId), {
              objectiveText: objective.objectiveText,
              orderIndex: objective.orderIndex,
            });
          }

          // Update the objective with the returned ID
          const newId = response.objectiveDraftID || response.objectiveID || response.id;
          objective.id = newId;
          objective.isNew = false;
        } else {
          // Update existing objective
          if (isDraftMode && currentDraftId) {
            await updateDraftObjective(objective.id, {
              objectiveText: objective.objectiveText,
              orderIndex: objective.orderIndex,
            });
          } else {
            await updateObjective(objective.id, {
              objectiveText: objective.objectiveText,
              orderIndex: objective.orderIndex,
            });
          }
        }
      }

      // Note: Deleted objectives are already handled by onDeleteObjective callback
      // in EditCourseObjectives component, so no need to handle them here again

      setObjectives(objectivesList);

      toast({
        title: 'Thành công',
        description: 'Mục tiêu đã được cập nhật',
      });

      setCurrentStep(3);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể lưu mục tiêu';
      setError(message);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ========== SUBMIT COURSE ==========
  const handleSubmitCourse = async () => {
    if (!courseId || !course) return;

    // Validate: Must have at least 1 section
    if (!course.section || course.section.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Khóa học phải có ít nhất một chương',
      });
      return;
    }

    // Validate: At least one section must have lessons
    const hasLessons = course.section.some(section =>
      section.lessons && section.lessons.length > 0
    );

    if (!hasLessons) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Khóa học phải có ít nhất một bài học',
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isDraftMode && currentDraftId) {
        // Submit draft course for approval
        await submitCourseDraft(currentDraftId);

        // Update course status to PENDING_REVIEW after successful submission
        setCourse({
          ...course,
          status: 'PENDING_REVIEW'
        });
      } else {
        // Submit regular course for approval
        const updatedCourse = await submitCourseForApproval(parseInt(courseId));

        // Update course with response from API (includes updated status)
        setCourse(updatedCourse);
      }

      setShowSuccessModal(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể gửi khóa học';
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ========== CREATE SECTION ==========
  const handleCreateSection = async (newSection: Section) => {
    if (!course) return;

    setIsSaving(true);
    try {
      let sectionWithId: Section;

      if (isDraftMode && currentDraftId) {
        // Create draft section
        const result = await createDraftSection(currentDraftId, {
          title: newSection.title,
          description: newSection.description || '',
          orderIndex: course.section.length,
        });

        sectionWithId = {
          ...newSection,
          sectionID: result.sectionID,
          lessons: [],
        };
      } else {
        // Create regular section
        const result = await courseApi.addSection(
          course.id.toString(),
          {
            courseID: course.id,
            title: newSection.title,
            description: newSection.description || null,
            orderIndex: course.section.length,
          }
        );

        sectionWithId = {
          ...newSection,
          sectionID: parseInt(result.sectionId),
          lessons: [],
        };
      }

      setCourse({
        ...course,
        section: [...course.section, sectionWithId],
      });

      toast({
        title: 'Thành công',
        description: 'Chương đã được tạo thành công',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể tạo chương';
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ========== CREATE LESSON ==========
  const handleCreateLesson = async (
    sectionIndex: number,
    newLesson: Lesson
  ) => {
    if (!course) return;

    setIsSaving(true);
    try {
      const sectionId = course.section[sectionIndex].sectionID;

      let lessonWithId: Lesson;

      if (isDraftMode && currentDraftId) {
        // Create draft lesson
        const result = await createDraftLesson(sectionId, {
          title: newLesson.title,
          duration: newLesson.duration,
          lessonType: newLesson.lessonType,
          videoURL: newLesson.videoURL || '',
          content: newLesson.content || '',
          orderIndex: course.section[sectionIndex].lessons.length,
        });

        lessonWithId = {
          ...newLesson,
          lessonID: result.lessonID,
          resources: [],
        };
      } else {
        // Create regular lesson
        const result = await courseApi.addLesson(
          course.id.toString(),
          sectionId.toString(),
          {
            title: newLesson.title,
            duration: newLesson.duration,
            lessonType: newLesson.lessonType,
            videoURL: newLesson.videoURL || '',
            content: newLesson.content || '',
            orderIndex: course.section[sectionIndex].lessons.length,
          }
        );

        lessonWithId = {
          ...newLesson,
          lessonID: parseInt(result.lessonId),
          resources: [],
        };
      }

      const newSections = [...course.section];
      newSections[sectionIndex].lessons = [
        ...newSections[sectionIndex].lessons,
        lessonWithId,
      ];
      setCourse({ ...course, section: newSections });

      toast({
        title: 'Thành công',
        description: 'Bài học đã được tạo thành công',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể tạo bài học';
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ========== CREATE RESOURCE ==========
  const handleCreateResource = async (
    sectionIndex: number,
    lessonIndex: number,
    newResource: Resource
  ) => {
    if (!course) return;

    setIsSaving(true);
    try {
      const sectionId = course.section[sectionIndex].sectionID;
      const lessonId =
        course.section[sectionIndex].lessons[lessonIndex].lessonID;

      let resourceWithId: Resource;

      if (isDraftMode && currentDraftId) {
        // Create draft resource
        const result = await createDraftResource(lessonId, {
          resourceType: newResource.resourceType as 'PDF' | 'ExternalLink',
          resourceTitle: newResource.resourceTitle,
          resourceURL: newResource.resourceURL,
          orderIndex: course.section[sectionIndex].lessons[lessonIndex].resources.length,
        });

        resourceWithId = {
          ...newResource,
          resourceID: result.resourceID,
          orderIndex: result.orderIndex,
        };
      } else {
        // Create regular resource
        const result = await courseApi.addLessonResource(
          course.id.toString(),
          sectionId.toString(),
          lessonId.toString(),
          {
            resourceType: newResource.resourceType as 'PDF' | 'ExternalLink',
            resourceTitle: newResource.resourceTitle,
            resourceURL: newResource.resourceURL,
          }
        );

        resourceWithId = {
          ...newResource,
          resourceID: parseInt(result.resourceId),
        };
      }

      const newSections = [...course.section];
      newSections[sectionIndex].lessons[lessonIndex].resources = [
        ...newSections[sectionIndex].lessons[lessonIndex].resources,
        resourceWithId,
      ];
      setCourse({ ...course, section: newSections });

      toast({
        title: 'Thành công',
        description: 'Tài nguyên đã được tạo thành công',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể tạo tài nguyên';
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ========== LOADING STATE ==========
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            Đang tải khóa học...
          </p>
        </div>
      </div>
    );
  }

  // ========== ERROR STATE ==========
  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={handleBackToCourseList}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>

          <Card className="p-8 bg-red-50 border-red-200">
            <div className="flex gap-4 items-start">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-red-600 text-lg font-semibold mb-4">
                  {error || 'Không tìm thấy khóa học'}
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  size="sm"
                >
                  Thử lại
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ========== SUCCESS MODAL ==========
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    navigate(getCourseListRoute());
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <StandardPageHeading
            title={isDraftMode ? 'Chỉnh sửa bản nháp' : 'Chỉnh sửa khóa học'}
            description={
              <>
                <span className="block mb-2 text-blue-100">
                  {course.title}
                </span>
                {isDraftMode && (
                  <span className="px-2 py-1 text-xs bg-orange-100/90 text-orange-800 rounded-full backdrop-blur-sm border border-orange-200">
                    Bản nháp #{currentDraftId}
                  </span>
                )}
              </>
            }
            icon={CheckCircle2}
            gradientFrom="from-blue-600"
            gradientVia="via-indigo-600"
            gradientTo="to-purple-600"
            actionButtons={
              <Button
                variant="secondary"
                onClick={handleBackToCourseList}
                className="gap-2 bg-white/20 hover:bg-white/30 text-white border-none"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Button>
            }
          />
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center w-full max-w-2xl">
              {/* Step 1: Course Information */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep === 1
                    ? 'bg-blue-500 text-white'
                    : 'bg-green-500 text-white'
                    }`}
                >
                  {currentStep > 1 ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    '1'
                  )}
                </div>
                <span className="mt-2 text-sm font-medium">
                  Thông tin
                </span>
              </div>

              {/* Line 1 */}
              <div
                className={`h-1 flex-1 mx-4 ${currentStep > 1 ? 'bg-green-500' : 'bg-gray-300'
                  }`}
              />

              {/* Step 2: Learning Objectives */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep === 2
                    ? 'bg-blue-500 text-white'
                    : currentStep > 2
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                    }`}
                >
                  {currentStep > 2 ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    '2'
                  )}
                </div>
                <span className="mt-2 text-sm font-medium">
                  Mục tiêu
                </span>
              </div>

              {/* Line 2 */}
              <div
                className={`h-1 flex-1 mx-4 ${currentStep > 2 ? 'bg-green-500' : 'bg-gray-300'
                  }`}
              />

              {/* Step 3: Course Content */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep === 3
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                    }`}
                >
                  3
                </div>
                <span className="mt-2 text-sm font-medium">
                  Nội dung
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Content Card */}
        <Card>
          <CardHeader>
            {/* <CardTitle>
              {currentStep === 1
                ? 'Step 1: Course Information'
                : currentStep === 2
                  ? 'Step 2: Learning Objectives'
                  : 'Step 3: Manage Content'}
            </CardTitle> */}
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <EditCourseInfo
                course={course}
                onSave={handleStep1Save}
                isSubmitting={isSaving}
              />
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <EditCourseObjectives
                  objectives={objectives}
                  isLoading={isSaving}
                  onChange={setObjectives}
                  onDeleteObjective={async (objectiveId: number) => {
                    if (isDraftMode && currentDraftId) {
                      await deleteDraftObjective(objectiveId);
                    } else {
                      await deleteObjective(objectiveId);
                    }
                  }}
                  isDraftMode={isDraftMode}
                />
                <div className="flex gap-3 justify-between pt-6 ">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                  >
                    Quay lại
                  </Button>
                  <Button
                    onClick={() => {
                      if (objectives.length === 0) {
                        toast({
                          variant: 'destructive',
                          title: 'Lỗi',
                          description: 'Vui lòng thêm ít nhất một mục tiêu trước khi tiếp tục',
                        });
                        return;
                      }
                      handleStep1aSaveObjectives(objectives);
                    }}
                    disabled={isSaving || objectives.length === 0}
                    className="gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      'Tiếp tục'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <EditCourseStructure
                course={course}
                onUpdateSection={handleStep2UpdateSection}
                onUpdateLesson={handleStep2UpdateLesson}
                onUpdateResource={handleStep2UpdateResource}
                onDeleteSection={handleStep2DeleteSection}
                onDeleteLesson={handleStep2DeleteLesson}
                onDeleteResource={handleStep2DeleteResource}
                onCreateSection={handleCreateSection}
                onCreateLesson={handleCreateLesson}
                onCreateResource={handleCreateResource}
                onBack={() => setCurrentStep(2)}
                onSubmit={handleSubmitCourse}
                isSubmitting={isSaving}
                isDraft={isDraftMode}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Success Modal */}
      <Dialog
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
      >
        <DialogContent className="sm:max-w-md border-0 shadow-lg">
          <DialogHeader className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              🎉 {isDraftMode ? 'Đã gửi bản nháp!' : 'Cập nhật thành công!'}
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600">
              {isDraftMode
                ? 'Bản nháp khóa học của bạn đã được gửi để xem xét thành công.'
                : 'Khóa học của bạn đã được cập nhật và gửi thành công.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">
                📚 Tên khóa học
              </p>
              <p className="font-semibold text-gray-900 text-lg">
                {course.title}
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">
                📊 Trạng thái
              </p>
              <p className="font-semibold text-blue-600">
                {course.status === 'PENDING_REVIEW' || course.status === 'Pending'
                  ? 'Đang chờ duyệt'
                  : course.status === 'DRAFT' || course.status === 'Draft'
                    ? 'Bản nháp'
                    : course.status}
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-3 mt-6">
            <Button
              onClick={handleCloseSuccessModal}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Quay lại danh sách
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditCourse;
