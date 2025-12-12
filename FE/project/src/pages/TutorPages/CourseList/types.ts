import { LucideIcon } from 'lucide-react';

export interface CourseStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

export interface StatusConfig {
  icon: LucideIcon;
  label: string;
  className: string;
}

export interface CoursePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}
