// Certificate interface for detail view
export interface Certificate {
  certificateId: number;
  certificateName: string;
  documentUrl: string;
}

// Application interface for list view
export interface Application {
  id: string; // verificationId converted to string
  applicantName: string; // userName
  applicantEmail: string; // userEmail
  teachingLanguages: string[]; // teachingLanguage split to array
  specialization: string;
  experience: number; // Only in detail view
  bio: string; // Only in detail view
  certificateName: string; // First certificate name (for list view)
  certificateUrl: string; // First certificate URL (for list view)
  certificates?: Certificate[]; // Full certificates array (for detail view)
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string; // submittedAt
  // Additional fields from backend
  verificationId?: number;
  tutorId?: number;
  userId?: number;
  avatarURL?: string;
  country?: string;
  userPhone?: string;
  pricePerHour?: number;
  reviewedBy?: string;
  reviewedAt?: string;
  reasonForReject?: string;
}

export interface ApprovalFormData {
  status: 'approved' | 'rejected';
  adminNotes?: string;
}
