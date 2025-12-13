import axios from '@/config/axiosConfig';
import { CATEGORIES, LANGUAGES, type Category, type Language } from '@/constants/categories';

export type { Category, Language };

export interface CourseFormData {
  title: string;
  description: string;
  categoryID: number;
  language: string;
  duration: number;
  price: number;
  thumbnailURL?: string;
}

export interface SectionFormData {
  courseID: number;
  title: string;
  description?: string | null;
  orderIndex: number;
}

export interface LessonFormData {
  title: string;
  duration: number;
  lessonType: 'Video' | 'Reading';
  videoURL?: string;
  content?: string;
  orderIndex: number;
}

export interface ResourceFormData {
  resourceType: 'PDF' | 'ExternalLink';
  resourceTitle: string;
  resourceURL: string;
}

export interface SectionData {
  id?: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  lessons: LessonData[];
}

export interface LessonResourceData {
  id?: string;
  resourceType: 'PDF' | 'ExternalLink';
  resourceTitle: string;
  resourceURL: string;
}

export interface LessonData {
  id?: string;
  title: string;
  duration: number;
  lessonType?: 'Video' | 'Reading';
  videoURL?: string;
  content?: string;
  orderIndex: number;
  resources?: LessonResourceData[];
}

interface ApiResponse<T> {
  result?: T;
  id?: string | number;
  courseID?: number;
  sectionID?: number;
  lessonID?: number;
  resourceID?: number;
  url?: string;
  publicUrl?: string;
}

export const courseApi = {
  createCourse: async (courseData: CourseFormData): Promise<{ courseId: string }> => {
    const payload = {
      title: courseData.title,
      description: courseData.description,
      categoryID: courseData.categoryID,
      language: courseData.language,
      duration: courseData.duration,
      price: courseData.price,
      thumbnailURL: courseData.thumbnailURL || '',
    };
    const res = await axios.post<ApiResponse<{ courseID?: number; id?: string | number }>>('/tutor/courses', payload);
    const courseId = res?.data?.result?.courseID || res?.data?.result?.id || res?.data?.courseID || res?.data?.id;
    if (!courseId) throw new Error('Invalid response from server');
    return { courseId: courseId.toString() };
  },

  addSection: async (courseId: string, sectionData: SectionFormData): Promise<{ sectionId: string }> => {
    const payload: Record<string, unknown> = {
      title: sectionData.title,
      orderIndex: sectionData.orderIndex,
    };

    if (sectionData.description) {
      payload.description = sectionData.description;
    }

    const res = await axios.post<ApiResponse<{ id: string; sectionID?: number }>>(`/tutor/courses/sections/${courseId}`, payload);
    const sectionId = res?.data?.result?.sectionID || res?.data?.result?.id || res?.data?.id;
    if (!sectionId) throw new Error('Invalid response');
    return { sectionId: sectionId.toString() };
  },

  addLesson: async (_courseId: string, sectionId: string, lessonData: LessonFormData): Promise<{ lessonId: string }> => {
    const payload: Record<string, unknown> = {
      title: lessonData.title,
      duration: lessonData.duration,
      lessonType: lessonData.lessonType,
      orderIndex: lessonData.orderIndex,
    };

    if (lessonData.videoURL) {
      payload.videoURL = lessonData.videoURL;
    }
    if (lessonData.content) {
      payload.content = lessonData.content;
    }

    const res = await axios.post<ApiResponse<{ id: string; lessonID?: number }>>(`/tutor/courses/sections/${sectionId}/lessons`, payload);
    const lessonId = res?.data?.result?.lessonID || res?.data?.result?.id || res?.data?.id;
    if (!lessonId) throw new Error('Invalid response');
    return { lessonId: lessonId.toString() };
  },

  addLessonResource: async (_courseId: string, _sectionId: string, lessonId: string, resourceData: ResourceFormData): Promise<{ resourceId: string }> => {
    const payload: Record<string, unknown> = {
      resourceType: resourceData.resourceType,
      resourceTitle: resourceData.resourceTitle,
      resourceURL: resourceData.resourceURL,
    };

    const res = await axios.post<any>(`/tutor/lessons/${lessonId}/resources`, payload);
    const resourceId = res?.data?.result?.resourceID || res?.data?.resourceID;
    if (!resourceId) throw new Error('Invalid response');
    return { resourceId: resourceId.toString() };
  },

  submitCourse: async (courseId: string): Promise<{ success: boolean; status: string }> => {
    const res = await axios.put<any>(`/tutor/courses/${courseId}/submit`);
    const status = res?.data?.result?.status || res?.data?.status;

    if (status && (status.toLowerCase() === 'pending' || status.toLowerCase() === 'draft')) {
      return { success: true, status };
    }

    return { success: false, status: status || 'unknown' };
  },
};

export const getCategories = (): Category[] => [...CATEGORIES];
export const getLanguages = (): Language[] => [...LANGUAGES];

export default courseApi;
