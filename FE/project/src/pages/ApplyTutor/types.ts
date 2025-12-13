// TypeScript interfaces for ApplyTutor feature

export interface Certificate {
  certificateName: string;
  documentUrl: string;
}

export interface TutorApplicationRequest {
  experience: number;
  specialization: string;
  teachingLanguage: string;
  bio: string;
  certificates: Certificate[];
}

export interface ApplicationStatusResponse {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string; // ISO 8601 date string
  reasonForReject?: string;
}
