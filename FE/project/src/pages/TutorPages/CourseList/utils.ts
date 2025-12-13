import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { StatusConfig } from './types';

/**
 * Get status configuration (icon, label, className) for a given status
 */
export const getStatusConfig = (status: string): StatusConfig => {
  const configs: Record<string, StatusConfig> = {
    Draft: {
      icon: AlertCircle,
      label: 'Bản nháp',
      className: 'bg-gray-100 text-gray-700 border-gray-300'
    },
    Pending: {
      icon: Clock,
      label: 'Chờ duyệt',
      className: 'bg-yellow-100 text-yellow-700 border-yellow-300'
    },
    Approved: {
      icon: CheckCircle,
      label: 'Đã duyệt',
      className: 'bg-green-100 text-green-700 border-green-300'
    },
    Rejected: {
      icon: XCircle,
      label: 'Từ chối',
      className: 'bg-red-100 text-red-700 border-red-300'
    },
    Disabled: {
      icon: XCircle,
      label: 'Vô hiệu hóa',
      className: 'bg-gray-100 text-gray-500 border-gray-300'
    }
  };
  return configs[status] || configs.Draft;
};

/**
 * Format price to Vietnamese currency format
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

/**
 * Format date to Vietnamese date format
 */
export const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(dateString));
};
