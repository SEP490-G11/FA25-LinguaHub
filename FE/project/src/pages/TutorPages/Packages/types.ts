/**
 * TypeScript type definitions for Package Management
 * Based on the design document and API specifications
 */

import { z } from 'zod';

// Slot content interface
export interface SlotContent {
  slot_number: number;
  content: string;
}

// Main Package interface matching the API response structure
export interface Package {
  packageid: number;
  name: string;
  description: string;
  requirement: string;
  objectives: string;
  tutor_id: number;
  is_active: boolean;
  max_slots: number;
  slot_content: SlotContent[];
  min_booking_price_per_hour: number;
  created_at: string;
  updated_at: string;
}

// Form data interface for creating and updating packages
export interface PackageFormData {
  name: string;
  description: string;
  requirement: string;
  objectives: string;
  max_slots: number;
  slot_content: SlotContent[];
}

// Zod schema for form validation
export const packageFormSchema = z.object({
  name: z.string()
    .min(3, 'Tên package phải có ít nhất 3 ký tự')
    .max(200, 'Tên package không được vượt quá 200 ký tự'),
  description: z.string()
    .min(10, 'Mô tả phải có ít nhất 10 ký tự')
    .max(2000, 'Mô tả không được vượt quá 2000 ký tự'),
  requirement: z.string()
    .min(10, 'Yêu cầu phải có ít nhất 10 ký tự')
    .max(1000, 'Yêu cầu không được vượt quá 1000 ký tự'),
  objectives: z.string()
    .min(10, 'Mục tiêu phải có ít nhất 10 ký tự')
    .max(1000, 'Mục tiêu không được vượt quá 1000 ký tự'),
  max_slots: z.number()
    .int('Số slot phải là số nguyên')
    .min(1, 'Số slot tối thiểu là 1')
    .max(100, 'Số slot tối đa là 100'),
  slot_content: z.array(z.object({
    slot_number: z.number().int().positive('Số slot phải là số nguyên dương'),
    content: z.string()
      .min(10, 'Nội dung slot phải có ít nhất 10 ký tự')
      .max(1000, 'Nội dung slot không được vượt quá 1000 ký tự')
  })).min(1, 'Phải có ít nhất 1 slot content')
});

// API response interfaces
export interface PackageListResponse {
  packages: Package[];
}

export interface PackageResponse {
  success: boolean;
  message: string;
}

// Component prop interfaces
export interface PackageCardProps {
  package: Package;
  onView: (packageId: number) => void;
  onEdit: (packageId: number) => void;
  onDelete: (packageId: number) => void;
}

export interface PackageFormProps {
  mode: 'create' | 'edit';
  initialData?: Package;
  onSubmit: (data: PackageFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface DeleteConfirmDialogProps {
  isOpen: boolean;
  package: Package | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Filter and search interfaces
export interface PackageFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
}

export interface PackageFiltersProps {
  filters: PackageFilters;
  onFiltersChange: (filters: PackageFilters) => void;
}

// Package statistics interface (for future use)
export interface PackageStats {
  totalPackages: number;
  activePackages: number;
  inactivePackages: number;
}