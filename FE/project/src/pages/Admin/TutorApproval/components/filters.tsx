import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

interface FiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
}

export function Filters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: FiltersProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search Input */}
        <div className="relative">
          <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-600" />
            Tìm kiếm đơn đăng ký
          </label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Tìm theo tên hoặc ngôn ngữ..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="border-blue-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            Lọc theo trạng thái
          </label>
          <Select value={statusFilter || 'all'} onValueChange={(value) => onStatusChange(value === 'all' ? '' : value)}>
            <SelectTrigger className="border-blue-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Từ chối</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
