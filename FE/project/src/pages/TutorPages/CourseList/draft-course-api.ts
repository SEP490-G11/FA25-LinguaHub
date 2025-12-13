import axiosInstance from '@/config/axiosConfig';

// Interface for section data in draft course response
// Note: Backend returns sectionID, lessonID, resourceID (not just "id")
export interface DraftSection {
  sectionID: number;  // Backend returns sectionID (which is sectionDraftID)
  courseID: number;
  title: string;
  description?: string;
  orderIndex: number;
  lessons?: DraftLesson[];
}

// Interface for lesson data in draft course response
export interface DraftLesson {
  lessonID: number;  // Backend returns lessonID (which is lessonDraftID)
  title: string;
  duration: number;
  lessonType: 'Video' | 'Reading';
  videoURL?: string;
  content?: string;
  orderIndex: number;
  createdAt?: string | null;
  resources?: DraftResource[];
}

// Interface for resource data in draft course response
export interface DraftResource {
  resourceID: number;  // Backend returns resourceID (which is resourceDraftID)
  resourceType: string;
  resourceTitle: string;
  resourceURL: string;
  orderIndex: number;
}

// Interface for the complete draft course data
export interface DraftCourseData {
  id: number; // Draft ID
  title: string;
  shortDescription: string;
  description: string;
  requirement: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  duration: number;
  price: number;
  language: string;
  thumbnailURL: string;
  categoryName: string;
  status: string;
  section: DraftSection[];
  objectives: string[];
}

// Interface for the API response when creating a draft course
export interface DraftCourseResponse {
  code: number;
  message: string;
  result: DraftCourseData;
}

// Interface for updating draft course basic information
export interface UpdateCourseDraftRequest {
  title: string;
  shortDescription: string;
  description: string;
  requirement: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  duration: number;
  price: number;
  language: string;
  thumbnailURL: string;
  categoryID: number;
}

// Standard API response interface
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  result?: T;
}

// Interface for objective data (draft mode)
export interface ObjectiveItem {
  objectiveDraftID: number; // Changed from objectiveID to objectiveDraftID
  objectiveText: string;
  orderIndex: number;
}

// Interface for creating a new objective
export interface CreateObjectiveRequest {
  objectiveText: string;
  orderIndex: number;
}

// Interface for updating an objective
export interface UpdateObjectiveRequest {
  objectiveText: string;
  orderIndex: number;
}

// Interface for objective creation response (draft mode)
export interface ObjectiveResponse {
  objectiveDraftID: number; // Changed from objectiveID to objectiveDraftID
  objectiveText: string;
  orderIndex: number;
}

// Interfaces for section management
export interface Section {
  sectionID: number;
  title: string;
  description?: string;
  orderIndex: number;
  lessons?: Lesson[];
}

export interface CreateSectionRequest {
  title: string;
  description?: string;
  orderIndex: number;
}

export interface UpdateSectionRequest {
  title: string;
  description?: string;
  orderIndex: number;
}

export interface SectionResponse {
  sectionID: number;
  title: string;
  description?: string;
  orderIndex: number;
}

// Interfaces for lesson management
export interface Lesson {
  lessonID: number;
  title: string;
  duration: number;
  lessonType: 'Video' | 'Reading' | 'Quiz';
  videoURL?: string;
  content?: string;
  orderIndex: number;
  resources?: Resource[];
}

export interface CreateLessonRequest {
  title: string;
  duration: number;
  lessonType: 'Video' | 'Reading' | 'Quiz';
  videoURL?: string;
  content?: string;
  orderIndex: number;
}

export interface UpdateLessonRequest {
  title: string;
  duration: number;
  lessonType: 'Video' | 'Reading' | 'Quiz';
  videoURL?: string;
  content?: string;
  orderIndex: number;
}

export interface LessonResponse {
  lessonID: number;
  title: string;
  duration: number;
  lessonType: 'Video' | 'Reading';
  videoURL?: string;
  content?: string;
  orderIndex: number;
}

// Interfaces for resource management
export interface Resource {
  resourceID: number;
  resourceType: 'PDF' | 'ExternalLink';
  resourceTitle: string;
  resourceURL: string;
  orderIndex: number;
}

export interface CreateResourceRequest {
  resourceType: 'PDF' | 'ExternalLink';
  resourceTitle: string;
  resourceURL: string;
  orderIndex: number;
}

export interface UpdateResourceRequest {
  resourceType: 'PDF' | 'ExternalLink';
  resourceTitle: string;
  resourceURL: string;
  orderIndex: number;
}

export interface ResourceResponse {
  resourceID: number;
  resourceType: 'PDF' | 'ExternalLink';
  resourceTitle: string;
  resourceURL: string;
  orderIndex: number;
}

/**
 * Get draft course details
 * GET /tutor/courses/drafts/{draftID}
 * 
 * @param draftId - The ID of the draft course
 * @returns Promise<DraftCourseData> - The complete draft course data
 */
export const getDraftCourseDetail = async (draftId: number): Promise<DraftCourseData> => {
  try {
    const response = await axiosInstance.get<DraftCourseResponse>(
      `/tutor/courses/drafts/${draftId}`
    );

    // Validate response structure
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to fetch draft course details');
    }

    if (!response.data.result) {
      throw new Error('Invalid response: missing draft course data');
    }

    return response.data.result;
  } catch (error: any) {
    console.error('Error fetching draft course details:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to fetch draft course details'
    );
  }
};

/**
 * Create a draft version of an approved course
 * POST /tutor/courses/{courseID}/draft
 * 
 * @param courseId - The ID of the approved course to create a draft from
 * @returns Promise<DraftCourseData> - The complete draft course data
 */
export const createCourseDraft = async (courseId: number): Promise<DraftCourseData> => {
  try {
    const response = await axiosInstance.post<DraftCourseResponse>(
      `/tutor/courses/${courseId}/draft`
    );

    // Validate response structure
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to create course draft');
    }

    if (!response.data.result) {
      throw new Error('Invalid response: missing draft course data');
    }

    return response.data.result;
  } catch (error: any) {
    console.error('Error creating course draft:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to create course draft'
    );
  }
};

/**
 * Update basic information of a draft course
 * PUT /tutor/courses/drafts/{draftID}
 * 
 * @param draftId - The ID of the draft course to update
 * @param data - The updated course information
 * @returns Promise<void>
 */
export const updateCourseDraft = async (draftId: number, data: UpdateCourseDraftRequest): Promise<void> => {
  try {
    const response = await axiosInstance.put<ApiResponse>(
      `/tutor/courses/drafts/${draftId}`,
      data
    );

    // Validate response
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to update course draft');
    }
  } catch (error: any) {
    console.error('Error updating course draft:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to update course draft'
    );
  }
};

/**
 * Get all objectives for a draft course
 * GET /tutor/courses/drafts/{draftID}/objectives
 * 
 * @param draftId - The ID of the draft course
 * @returns Promise<ObjectiveItem[]> - Array of objectives
 */
export const getDraftObjectives = async (draftId: number): Promise<ObjectiveItem[]> => {
  try {
    const response = await axiosInstance.get<ApiResponse<ObjectiveItem[]>>(
      `/tutor/courses/drafts/${draftId}/objectives`
    );

    // Validate response
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to fetch draft objectives');
    }

    return response.data.result || [];
  } catch (error: any) {
    console.error('Error fetching draft objectives:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to fetch draft objectives'
    );
  }
};

/**
 * Create a new objective for a draft course
 * POST /tutor/courses/drafts/{draftID}/objectives
 * 
 * @param draftId - The ID of the draft course
 * @param data - The objective data to create
 * @returns Promise<ObjectiveResponse> - The created objective
 */
export const createDraftObjective = async (draftId: number, data: CreateObjectiveRequest): Promise<ObjectiveResponse> => {
  try {
    const response = await axiosInstance.post<ApiResponse<ObjectiveResponse>>(
      `/tutor/courses/drafts/${draftId}/objectives`,
      data
    );

    // Validate response
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to create draft objective');
    }

    if (!response.data.result) {
      throw new Error('Invalid response: missing objective data');
    }

    return response.data.result;
  } catch (error: any) {
    console.error('Error creating draft objective:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to create draft objective'
    );
  }
};

/**
 * Update an existing draft objective
 * PUT /tutor/courses/drafts/objectives/{objectiveDraftID}
 * 
 * @param objectiveDraftID - The ID of the objective to update
 * @param data - The updated objective data
 * @returns Promise<void>
 */
export const updateDraftObjective = async (objectiveDraftID: number, data: UpdateObjectiveRequest): Promise<void> => {
  try {
    const response = await axiosInstance.put<ApiResponse>(
      `/tutor/courses/drafts/objectives/${objectiveDraftID}`,
      data
    );

    // Validate response
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to update draft objective');
    }
  } catch (error: any) {
    console.error('Error updating draft objective:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to update draft objective'
    );
  }
};

/**
 * Delete a draft objective
 * DELETE /tutor/courses/drafts/objectives/{objectiveDraftID}
 * 
 * @param objectiveDraftID - The ID of the objective to delete
 * @returns Promise<void>
 */
export const deleteDraftObjective = async (objectiveDraftID: number): Promise<void> => {
  try {
    const response = await axiosInstance.delete<ApiResponse>(
      `/tutor/courses/drafts/objectives/${objectiveDraftID}`
    );

    // Validate response
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to delete draft objective');
    }
  } catch (error: any) {
    console.error('Error deleting draft objective:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to delete draft objective'
    );
  }
};

// ===== SECTION MANAGEMENT =====

/**
 * Get all sections for a draft course
 * GET /tutor/courses/drafts/{draftID}/sections
 * 
 * @param draftId - The ID of the draft course
 * @returns Promise<Section[]> - Array of sections
 */
export const getDraftSections = async (draftId: number): Promise<Section[]> => {
  try {
    const response = await axiosInstance.get<ApiResponse<Section[]>>(
      `/tutor/courses/drafts/${draftId}/sections`
    );

    // Validate response
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to fetch draft sections');
    }

    return response.data.result || [];
  } catch (error: any) {
    console.error('Error fetching draft sections:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to fetch draft sections'
    );
  }
};

/**
 * Create a new section for a draft course
 * POST /tutor/courses/drafts/{draftID}/sections
 * 
 * @param draftId - The ID of the draft course
 * @param data - The section data to create
 * @returns Promise<SectionResponse> - The created section
 */
export const createDraftSection = async (draftId: number, data: CreateSectionRequest): Promise<SectionResponse> => {
  try {
    const response = await axiosInstance.post<ApiResponse<SectionResponse>>(
      `/tutor/courses/drafts/${draftId}/sections`,
      data
    );

    // Validate response
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to create draft section');
    }

    if (!response.data.result) {
      throw new Error('Invalid response: missing section data');
    }

    return response.data.result;
  } catch (error: any) {
    console.error('Error creating draft section:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to create draft section'
    );
  }
};

/**
 * Update an existing draft section
 * PUT /tutor/courses/drafts/{draftID}/sections
 * 
 * @param sectionDraftID - The ID of the draft course
 * @param data - The updated section data
 * @returns Promise<void>
 */
export const updateDraftSection = async (sectionDraftID: number, data: UpdateSectionRequest): Promise<void> => {
  try {
    const response = await axiosInstance.put<ApiResponse>(
      `/tutor/courses/drafts/sections/${sectionDraftID}`,
      data
    );

    // Validate response
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to update draft section');
    }
  } catch (error: any) {
    console.error('Error updating draft section:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to update draft section'
    );
  }
};

/**
 * Delete a draft section
 * DELETE /tutor/courses/drafts/{draftID}/sections
 * 
 * @param sectionDraftID - The ID of the draft course
 * @returns Promise<void>
 */
export const deleteDraftSection = async (sectionDraftID: number): Promise<void> => {
  try {
    const response = await axiosInstance.delete<ApiResponse>(
      `/tutor/courses/drafts/sections/${sectionDraftID}`
    );

    // Validate response
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to delete draft section');
    }
  } catch (error: any) {
    console.error('Error deleting draft section:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to delete draft section'
    );
  }
};

// ===== LESSON MANAGEMENT =====

/**
 * Get all lessons for a draft section
 * GET /tutor/courses/drafts/sections/{sectionDraftID}/lessons
 * 
 * @param sectionDraftID - The ID of the draft section
 * @returns Promise<Lesson[]> - Array of lessons
 */
export const getDraftLessons = async (sectionDraftID: number): Promise<Lesson[]> => {
  try {
    const response = await axiosInstance.get<ApiResponse<Lesson[]>>(
      `/tutor/courses/drafts/sections/${sectionDraftID}/lessons`
    );

    // Validate response
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to fetch draft lessons');
    }

    return response.data.result || [];
  } catch (error: any) {
    console.error('Error fetching draft lessons:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to fetch draft lessons'
    );
  }
};

/**
 * Create a new lesson for a draft section
 * POST /tutor/courses/drafts/sections/{sectionDraftID}/lessons
 * 
 * @param sectionDraftID - The ID of the draft section
 * @param data - The lesson data to create
 * @returns Promise<LessonResponse> - The created lesson
 */
export const createDraftLesson = async (sectionDraftID: number, data: CreateLessonRequest): Promise<LessonResponse> => {
  try {
    const response = await axiosInstance.post<ApiResponse<LessonResponse>>(
      `/tutor/courses/drafts/sections/${sectionDraftID}/lessons`,
      data
    );

    // Validate response
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to create draft lesson');
    }

    if (!response.data.result) {
      throw new Error('Invalid response: missing lesson data');
    }

    return response.data.result;
  } catch (error: any) {
    console.error('Error creating draft lesson:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to create draft lesson'
    );
  }
};

/**
 * Update an existing draft lesson
 * PUT /tutor/courses/drafts/lessons/{lessonDraftID}
 * 
 * @param lessonDraftID - The ID of the lesson to update
 * @param data - The updated lesson data
 * @returns Promise<void>
 */
export const updateDraftLesson = async (lessonDraftID: number, data: UpdateLessonRequest): Promise<void> => {
  try {
    const response = await axiosInstance.put<ApiResponse>(
      `/tutor/courses/drafts/lessons/${lessonDraftID}`,
      data
    );

    // Validate response
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to update draft lesson');
    }
  } catch (error: any) {
    console.error('Error updating draft lesson:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to update draft lesson'
    );
  }
};

/**
 * Delete a draft lesson
 * DELETE /tutor/courses/drafts/lessons/{lessonDraftID}
 * 
 * @param lessonDraftID - The ID of the lesson to delete
 * @returns Promise<void>
 */
export const deleteDraftLesson = async (lessonDraftID: number): Promise<void> => {
  try {
    const response = await axiosInstance.delete<ApiResponse>(
      `/tutor/courses/drafts/lessons/${lessonDraftID}`
    );

    // Validate response
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to delete draft lesson');
    }
  } catch (error: any) {
    console.error('Error deleting draft lesson:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to delete draft lesson'
    );
  }
};

// ===== RESOURCE MANAGEMENT =====

/**
 * Get all resources for a draft lesson
 * GET /tutor/courses/drafts/lessons/{lessonDraftID}/resources
 * 
 * @param lessonDraftID - The ID of the draft lesson
 * @returns Promise<Resource[]> - Array of resources
 */
export const getDraftResources = async (lessonDraftID: number): Promise<Resource[]> => {
  try {
    const response = await axiosInstance.get<ApiResponse<Resource[]>>(
      `/tutor/courses/drafts/lessons/${lessonDraftID}/resources`
    );

    // Validate response
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to fetch draft resources');
    }

    return response.data.result || [];
  } catch (error: any) {
    console.error('Error fetching draft resources:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to fetch draft resources'
    );
  }
};

/**
 * Create a new resource for a draft lesson
 * POST /tutor/courses/drafts/lessons/{lessonDraftID}/resources
 * 
 * @param lessonDraftID - The ID of the draft lesson
 * @param data - The resource data to create
 * @returns Promise<ResourceResponse> - The created resource
 */
export const createDraftResource = async (lessonDraftID: number, data: CreateResourceRequest): Promise<ResourceResponse> => {
  try {
    const response = await axiosInstance.post<ApiResponse<ResourceResponse>>(
      `/tutor/courses/drafts/lessons/${lessonDraftID}/resources`,
      data
    );

    // Validate response
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to create draft resource');
    }

    if (!response.data.result) {
      throw new Error('Invalid response: missing resource data');
    }

    return response.data.result;
  } catch (error: any) {
    console.error('Error creating draft resource:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to create draft resource'
    );
  }
};

/**
 * Update an existing draft resource
 * PUT /tutor/courses/drafts/resources/{resourceDraftID}
 * 
 * @param resourceId - The ID of the resource to update
 * @param data - The updated resource data
 * @returns Promise<void>
 */
export const updateDraftResource = async (resourceId: number, data: UpdateResourceRequest): Promise<void> => {
  try {
    const response = await axiosInstance.put<ApiResponse>(
      `/tutor/courses/drafts/resources/${resourceId}`,
      data
    );

    // Validate response
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to update draft resource');
    }
  } catch (error: any) {
    console.error('Error updating draft resource:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to update draft resource'
    );
  }
};

/**
 * Delete a draft resource
 * DELETE /tutor/courses/drafts/resources/{resourceDraftID}
 * 
 * @param resourceId - The ID of the resource to delete
 * @returns Promise<void>
 */
export const deleteDraftResource = async (resourceId: number): Promise<void> => {
  try {
    const response = await axiosInstance.delete<ApiResponse>(
      `/tutor/courses/drafts/resources/${resourceId}`
    );

    // Validate response
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to delete draft resource');
    }
  } catch (error: any) {
    console.error('Error deleting draft resource:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to delete draft resource'
    );
  }
};

// ===== DRAFT SUBMISSION =====

/**
 * Submit a draft course for approval
 * PUT /tutor/courses/drafts/{draftID}/submit
 * 
 * @param draftId - The ID of the draft course to submit
 * @returns Promise<void>
 */
export const submitCourseDraft = async (draftId: number): Promise<void> => {
  try {
    const response = await axiosInstance.put<ApiResponse>(
      `/tutor/courses/drafts/${draftId}/submit`
    );

    // Validate response
    if (response.data.code !== 0) {
      throw new Error(response.data.message || 'Failed to submit course draft');
    }
  } catch (error: any) {
    console.error('Error submitting course draft:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to submit course draft'
    );
  }
};