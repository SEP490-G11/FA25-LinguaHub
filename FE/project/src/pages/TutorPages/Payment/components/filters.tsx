import { StandardFilters } from '@/components/shared';
import type { FilterConfig } from '@/components/shared/types/standard-components';
import { Search } from 'lucide-react';

interface FiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
}

export function Filters({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedStatus,
  onStatusChange,
}: FiltersProps) {
  const filterConfigs: FilterConfig[] = [
    {
      id: 'search',
      type: 'search',
      placeholder: 'Tìm theo mã đơn, ID người dùng, mô tả...',
      value: searchQuery,
      onChange: onSearchChange,
      icon: Search,
    },
    {
      id: 'payment-type',
      type: 'select',
      placeholder: 'Loại thanh toán',
      value: selectedType,
      onChange: onTypeChange,
      options: [
        { value: 'all', label: 'Tất cả' },
        { value: 'Course', label: 'Khóa học' },
        { value: 'Booking', label: 'Đặt lịch' },
      ],
    },
    {
      id: 'payment-status',
      type: 'select',
      placeholder: 'Trạng thái',
      value: selectedStatus,
      onChange: onStatusChange,
      options: [
        { value: 'all', label: 'Tất cả' },
        { value: 'PAID', label: 'Đã thanh toán' },
        { value: 'PENDING', label: 'Chờ thanh toán' },
        { value: 'REFUNDED', label: 'Đã hoàn tiền' },
        { value: 'FAILED', label: 'Thất bại' },
      ],
    },
  ];

  return <StandardFilters filters={filterConfigs} />;
}
