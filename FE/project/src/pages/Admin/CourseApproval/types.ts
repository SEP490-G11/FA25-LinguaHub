// Unified types for Course Approval
// These types match the structure from TutorPages for consistency

export type CourseStatus = 'Pending' | 'Approved' | 'Rejected' | 'Draft' | 'DRAFT' | 'DISABLED' | 'Pending Review';

export interface Objective {
  objectiveID: number;
  objectiveText: string;
  orderIndex: number;
}

export interface Resource {
  resourceID: number;
  resourceType: 'PDF' | 'ExternalLink';
  resourceTitle: string;
  resourceURL: string;
}

export interface QuizOption {
  optionID: number;
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface QuizQuestionData {
  questionID: number;
  questionText: string;
  orderIndex: number;
  explanation: string;
  score: number;
  options: QuizOption[];
}

export interface Lesson {
  lessonID: number;
  title: string;
  duration: number;
  lessonType: 'Video' | 'Reading' | 'Quiz';
  videoURL?: string;
  content?: string;
  orderIndex: number;
  resources: Resource[];
  quizQuestions?: QuizQuestionData[] | null;
}

export interface Section {
  sectionID: number;
  title: string;
  description?: string;
  orderIndex: number;
  lessons: Lesson[];
}

export interface PendingCourse {
  id: number;
  title: string;
  shortDescription: string;
  description: string;
  requirement: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  categoryID: number;
  categoryName?: string;
  language: string;
  duration: number;
  price: number;
  thumbnailURL: string;
  status: CourseStatus;
  tutorID: number;
  tutorName?: string;
  tutorEmail?: string;
  createdAt: string;
  updatedAt: string;
  isDraft?: boolean; // true if this is a draft, false if live course
}

export interface CourseDetail extends PendingCourse {
  section: Section[];
  objectives: Objective[];
  adminNotes?: string;
  adminReviewNote?: string;
  rejectionReason?: string;
  isDraft?: boolean;
  totalRatings?: number;
  avgRating?: number;
  learnerCount?: number;
  isEnabled?: boolean;
}

export interface ApprovalFilters {
  search?: string;
  categoryID?: number;
  status?: CourseStatus;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Change comparison types
export type ChangeType = 'ADDED' | 'MODIFIED' | 'DELETED';

export interface FieldChange {
  field: string;
  oldValue: string;
  newValue: string;
}

export interface ObjectiveChange {
  originalObjectiveId: number;
  draftObjectiveId: number;
  changeType: ChangeType;
  fieldChanges: FieldChange[];
}

export interface SectionChange {
  originalSectionId: number;
  draftSectionId: number;
  title: string;
  changeType: ChangeType;
  fieldChanges: FieldChange[];
}

export interface LessonChange {
  originalLessonId: number;
  draftLessonId: number;
  title: string;
  lessonType: string;
  changeType: ChangeType;
  fieldChanges: FieldChange[];
  resetUserProgressRequired: boolean;
}

export interface ResourceChange {
  originalResourceId: number;
  draftResourceId: number;
  resourceTitle: string;
  changeType: ChangeType;
  fieldChanges: FieldChange[];
}

export interface CourseChangeData {
  courseId: number;
  draftId: number;
  courseChanges: FieldChange[];
  objectives: ObjectiveChange[];
  sections: SectionChange[];
  lessons: LessonChange[];
  resources: ResourceChange[];
}
