import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import axios from '@/config/axiosConfig';
import type { CoursesFilters } from '../types';

interface CourseFiltersProps {
  filters: CoursesFilters;
  onFilterChange: (filters: CoursesFilters) => void;
  totalCount: number;
}

export default function CourseFiltersComponent({
  filters,
  onFilterChange,
  totalCount,
}: CourseFiltersProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/categories');
      
      let rawData = [];
      if (response?.data?.result) {
        rawData = response.data.result;
      } else if (Array.isArray(response?.data)) {
        rawData = response.data;
      } else if (response?.data?.data) {
        rawData = response.data.data;
      }
      
      const categoriesData = rawData.map((cat: any) => ({
        id: cat.categoryId || cat.id,
        name: cat.categoryName || cat.name,
      }));
      
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Tìm theo tên khóa học..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-48">
          <Select
            value={filters.category || 'all'}
            onValueChange={(value) =>
              onFilterChange({ ...filters, category: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {isLoading ? (
                <SelectItem value="loading" disabled>
                  Đang tải...
                </SelectItem>
              ) : (
                categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) =>
              onFilterChange({ ...filters, status: value === 'all' ? undefined : value as any })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="PENDING">Chờ duyệt</SelectItem>
              <SelectItem value="APPROVED">Đã duyệt</SelectItem>
              <SelectItem value="REJECTED">Từ chối</SelectItem>
              <SelectItem value="DRAFT">Nháp</SelectItem>
              <SelectItem value="DISABLED">Vô hiệu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div className="w-full md:w-48">
          <Select
            value={filters.sortBy || 'newest'}
            onValueChange={(value) =>
              onFilterChange({ ...filters, sortBy: value as any })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="oldest">Cũ nhất</SelectItem>
              <SelectItem value="price">Giá cao nhất</SelectItem>
              <SelectItem value="rating">Đánh giá cao</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Result count */}
      <div className="mt-3 text-sm text-gray-600">
        Hiển thị {totalCount} khóa học
      </div>
    </div>
  );
}
