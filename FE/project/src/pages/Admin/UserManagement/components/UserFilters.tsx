import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  roleFilter: string;
  onRoleChange: (value: string) => void;
  dateFilter: string;
  onDateChange: (value: string) => void;
  onClearFilters: () => void;
}

/**
 * UserFilters component for filtering users
 * Provides search and filter functionality for the user management table
 */
export const UserFilters: React.FC<UserFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  roleFilter,
  onRoleChange,
  dateFilter,
  onDateChange,
  onClearFilters,
}) => {
  const hasActiveFilters = searchQuery || 
    (statusFilter && statusFilter !== 'all') || 
    (roleFilter && roleFilter !== 'all') || 
    (dateFilter && dateFilter !== 'all');

  return (
    <div className="bg-white rounded-xl shadow-md border border-blue-100 p-6 mb-6 hover:shadow-lg transition-all">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Filter className="w-6 h-6 text-indigo-600" aria-hidden="true" />
        Tìm kiếm & Lọc người dùng
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Search Input */}
        <div className="space-y-2">
          <label htmlFor="search" className="text-sm font-medium text-gray-700">
            Tìm kiếm
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" aria-hidden="true" />
            <Input
              id="search"
              type="text"
              placeholder="Tìm theo tên, tên đăng nhập, email..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
            Trạng thái
          </label>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger id="status-filter" className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="inactive">Không hoạt động</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Role Filter */}
        <div className="space-y-2">
          <label htmlFor="role-filter" className="text-sm font-medium text-gray-700">
            Vai trò
          </label>
          <Select value={roleFilter} onValueChange={onRoleChange}>
            <SelectTrigger id="role-filter" className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
              <SelectValue placeholder="Tất cả vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              <SelectItem value="Admin">Quản trị viên</SelectItem>
              <SelectItem value="Tutor">Giảng viên</SelectItem>
              <SelectItem value="Learner">Học viên</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Sort */}
        <div className="space-y-2">
          <label htmlFor="date-filter" className="text-sm font-medium text-gray-700">
            Sắp xếp theo ngày
          </label>
          <Select value={dateFilter} onValueChange={onDateChange}>
            <SelectTrigger id="date-filter" className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
              <SelectValue placeholder="Thứ tự mặc định" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Thứ tự mặc định</SelectItem>
              <SelectItem value="newest">Mới nhất trước</SelectItem>
              <SelectItem value="oldest">Cũ nhất trước</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            onClick={onClearFilters}
            variant="outline"
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 font-semibold"
            aria-label="Xóa tất cả bộ lọc"
          >
            <X className="w-4 h-4 mr-2" aria-hidden="true" />
            Xóa bộ lọc
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserFilters;