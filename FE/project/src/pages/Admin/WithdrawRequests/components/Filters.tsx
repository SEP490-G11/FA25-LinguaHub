import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';

interface FiltersProps {
  selectedStatus: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED';
  onStatusChange: (value: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED') => void;
  sortOrder: 'newest' | 'oldest';
  onSortOrderChange: (value: 'newest' | 'oldest') => void;
}

export function Filters({
  selectedStatus,
  onStatusChange,
  sortOrder,
  onSortOrderChange,
}: FiltersProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      {/* Status Filter */}
      <div className="w-48">
        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger id="withdraw-status">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="PENDING">Chờ xử lý</SelectItem>
            <SelectItem value="APPROVED">Đã duyệt</SelectItem>
            <SelectItem value="REJECTED">Đã từ chối</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Order Filter */}
      <div className="w-48">
        <Select value={sortOrder} onValueChange={onSortOrderChange}>
          <SelectTrigger id="sort-order">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" />
              <SelectValue placeholder="Sắp xếp" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="oldest">Cũ nhất</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
