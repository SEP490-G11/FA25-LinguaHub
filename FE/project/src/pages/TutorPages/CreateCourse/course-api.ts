import axios from '@/config/axiosConfig';
import { getCurrentLocale } from '@/utils/locale';

// Language type matching API response
export interface LanguageResponse {
  id: number;
  nameVi: string;
  nameEn: string;
  isActive: boolean;
  difficulty: string;
  certificates: string;
  thumbnailUrl: string;
}

// Transformed language type for UI
export interface Language {
  id: number;
  name: string;        // nameEn for storage
  displayName: string; // nameVi or nameEn based on locale
  code: string;        // derived from nameEn
}

// Category type matching API response
export interface Category {
  categoryId: number;
  categoryName: string;
  description: string;
}

export interface CourseFormData {
  title: string;
  shortDescription: string;
  description: string;
  requirement: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
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
  lessonType: 'Video' | 'Reading' | 'Quiz';
  videoURL?: string;
  content?: string;
  orderIndex: number;
}

export interface ResourceFormData {
  resourceType: 'PDF' | 'ExternalLink';
  resourceTitle: string;
  resourceURL: string;
}

export interface ObjectiveFormData {
  objectiveText: string;
  orderIndex: number;
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
  lessonType?: 'Video' | 'Reading' | 'Quiz';
  videoURL?: string;
  content?: string;
  orderIndex: number;
  resources?: LessonResourceData[];
  questionCount?: number;
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
      shortDescription: courseData.shortDescription,
      description: courseData.description,
      requirement: courseData.requirement,
      level: courseData.level,
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

    // Fixed: POST /tutor/courses/{sectionID}/lessons (not /tutor/courses/sections/{sectionID}/lessons)
    const res = await axios.post<ApiResponse<{ id: string; lessonID?: number }>>(`/tutor/courses/${sectionId}/lessons`, payload);
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

  uploadThumbnail: async (file: File, courseId: string): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await axios.post<ApiResponse<{ url: string }>>(`/tutor/courses/${courseId}/thumbnail`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res?.data?.result?.url || res?.data?.url || res?.data?.publicUrl || '';
  },

  submitCourse: async (courseId: string): Promise<{ success: boolean; status: string }> => {
    const res = await axios.put<any>(`/tutor/courses/${courseId}/submit`);
    const status = res?.data?.result?.status || res?.data?.status;

    if (status && (status.toLowerCase() === 'pending' || status.toLowerCase() === 'draft')) {
      return { success: true, status };
    }

    return { success: false, status: status || 'unknown' };
  },

  updateResource: async (resourceId: string, resourceData: ResourceFormData): Promise<{ resourceId: string }> => {
    const payload = {
      resourceType: resourceData.resourceType,
      resourceTitle: resourceData.resourceTitle,
      resourceURL: resourceData.resourceURL,
    };

    const res = await axios.put<any>(`/tutor/resources/${resourceId}`, payload);
    const resId = res?.data?.result?.resourceID || res?.data?.resourceID || resourceId;
    return { resourceId: resId.toString() };
  },

  deleteResource: async (resourceId: string): Promise<void> => {
    await axios.delete<any>(`/tutor/resources/${resourceId}`);
  },

  addObjective: async (courseId: string, objectiveData: ObjectiveFormData): Promise<{ objectiveId: string }> => {
    const payload = {
      objectiveText: objectiveData.objectiveText,
      orderIndex: objectiveData.orderIndex,
    };

    const res = await axios.post<any>(`/courses/${courseId}/objectives`, payload);
    const objectiveId = res?.data?.result?.id || res?.data?.result?.objectiveID || res?.data?.id || res?.data?.objectiveID;
    if (!objectiveId) throw new Error('Invalid response from server');
    return { objectiveId: objectiveId.toString() };
  },

  deleteObjective: async (objectiveId: string): Promise<void> => {
    await axios.delete<any>(`/course-objectives/${objectiveId}`);
  },
};

/**
 * Fetch categories from API
 * GET /categories
 */
export const getCategories = async (): Promise<Category[]> => {
  try {
    const response = await axios.get<Category[]>('/categories');
    // Handle different response formats
    const categoriesData = response.data || [];
    return categoriesData;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
};

/**
 * Derive language code from English name
 * @param nameEn - English name of language
 * @returns ISO 639-1 language code
 */
function deriveLanguageCode(nameEn: string): string {
  const codeMap: Record<string, string> = {
    'English': 'en',
    'Vietnamese': 'vi',
    'Japanese': 'ja',
    'Chinese': 'zh',
    'Korean': 'ko',
    'French': 'fr',
    'Spanish': 'es',
    'German': 'de',
    'Russian': 'ru',
  };
  return codeMap[nameEn] || 'en';
}

/**
 * Get display name for a language based on current locale
 * Falls back to nameEn if the locale-specific name is missing or empty
 * @param lang - Language response from API
 * @returns Display name for the language
 */
function getDisplayName(lang: LanguageResponse): string {
  const locale = getCurrentLocale();
  
  if (locale === 'vi') {
    // Use Vietnamese name if available, fallback to English
    return lang.nameVi && lang.nameVi.trim() !== '' ? lang.nameVi : lang.nameEn;
  }
  
  // For English locale, use English name
  return lang.nameEn;
}

/**
 * Fetch languages from API
 * GET /languages
 * @returns Promise<Language[]> - List of active languages
 */
export const getLanguages = async (): Promise<Language[]> => {
  const response = await axios.get<{ 
    code: number; 
    message: string; 
    result: LanguageResponse[] 
  }>('/languages');
  
  const languages = response.data.result || [];
  
  // Filter active languages and transform to UI format
  return languages
    .filter(lang => lang.isActive)
    .map(lang => ({
      id: lang.id,
      name: lang.nameEn,
      displayName: getDisplayName(lang),
      code: deriveLanguageCode(lang.nameEn),
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
};

export default courseApi;

/**
 * Fetch course detail by ID
 * GET /tutor/courses/{courseId}
 */
export const getCourseDetail = async (courseId: string): Promise<CourseFormData> => {
  try {
    const response = await axios.get<any>(`/tutor/courses/${courseId}`);
    const courseData = response.data?.result || response.data;
    return {
      title: courseData.title,
      shortDescription: courseData.shortDescription,
      description: courseData.description,
      requirement: courseData.requirement,
      level: courseData.level,
      categoryID: courseData.categoryID,
      language: courseData.language,
      duration: courseData.duration,
      price: courseData.price,
      thumbnailURL: courseData.thumbnailURL,
    };
  } catch (error) {
    console.error('Failed to fetch course detail:', error);
    throw error;
  }
};

/**
 * Fetch objectives for a course
 * GET /courses/{courseId}/objectives
 */
export const getObjectives = async (courseId: string): Promise<any[]> => {
  try {
    const response = await axios.get<any>(`/courses/${courseId}/objectives`);
    const objectives = response.data?.result || response.data || [];
    return objectives;
  } catch (error) {
    console.error('Failed to fetch objectives:', error);
    return [];
  }
};

/**
 * Fetch sections with lessons and resources for a course
 * GET /tutor/courses/{courseId}/sections
 */
export const getSections = async (courseId: string): Promise<SectionData[]> => {
  try {
    const response = await axios.get<any>(`/tutor/courses/${courseId}/sections`);
    const sections = response.data?.result || response.data || [];
    
    // Transform API response to match SectionData interface
    return sections.map((section: any) => ({
      id: section.sectionID?.toString() || section.id?.toString(),
      title: section.title,
      description: section.description,
      orderIndex: section.orderIndex,
      lessons: (section.lessons || []).map((lesson: any) => ({
        id: lesson.lessonID?.toString() || lesson.id?.toString(),
        title: lesson.title,
        duration: lesson.duration,
        lessonType: lesson.lessonType,
        videoURL: lesson.videoURL,
        content: lesson.content,
        orderIndex: lesson.orderIndex,
        resources: (lesson.resources || []).map((resource: any) => ({
          id: resource.resourceID?.toString() || resource.id?.toString(),
          resourceType: resource.resourceType,
          resourceTitle: resource.resourceTitle,
          resourceURL: resource.resourceURL,
        })),
      })),
    }));
  } catch (error) {
    console.error('Failed to fetch sections:', error);
    return [];
  }
};
