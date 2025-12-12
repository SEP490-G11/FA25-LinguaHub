// Resource types
export interface Resource {
  resourceID: number;
  resourceType: 'PDF' | 'Video' | 'ExternalLink' | 'Document';
  resourceTitle: string;
  resourceURL: string;
  uploadedAt: string;
  orderIndex?: number;
}

// Objective types
export interface Objective {
  id: number;
  objectiveText: string;
  orderIndex: number;
}

// Lesson types
export interface Lesson {
  lessonID: number;
  title: string;
  duration: number;
  lessonType: 'Video' | 'Reading' | 'Quiz';
  videoURL?: string;
  content?: string;
  orderIndex: number;
  createdAt: string;
  resources: Resource[];
  questionCount?: number;
}

// Section types
export interface Section {
  sectionID: number;
  courseID: number;
  title: string;
  description: string;
  orderIndex: number;
  lessons: Lesson[];
}

// Course detail types
export interface CourseDetail {
  id: number;
  title: string;
  shortDescription: string;
  description: string;
  requirement: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: number;
  price: number;
  language: string;
  thumbnailURL: string;
  categoryID?: number;
  categoryName: string;
  status: string;
  section: Section[];
}

// API Response type
export interface ApiResponse<T> {
  code: number;
  message?: string;
  result: T;
}

// Update request types
export interface UpdateCourseRequest {
  title: string;
  shortDescription: string;
  description: string;
  requirement: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  duration: number;
  price: number;
  language: string;
  thumbnailURL: string;
  categoryID: number;
}

export interface UpdateSectionRequest {
  title: string;
  description: string;
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

export interface UpdateResourceRequest {
  resourceType: 'PDF' | 'Video' | 'ExternalLink' | 'Document';
  resourceTitle: string;
  resourceURL: string;
}
