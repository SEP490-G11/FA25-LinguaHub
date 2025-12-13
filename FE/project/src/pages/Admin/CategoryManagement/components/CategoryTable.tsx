import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Category } from '../types';

interface CategoryTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  isRefreshing: boolean;
}

/**
 * CategoryTable component for category list display
 * Requirements: 5.2, 9.1, 9.4 - responsive table layout, consistent styling, empty state handling
 */
export const CategoryTable: React.FC<CategoryTableProps> = ({ 
  categories, 
  onEdit, 
  onDelete, 
  isRefreshing 
}) => {
  // Format dates for display
  // const formatDate = (dateString: string) => {
  //   try {
  //     return new Date(dateString).toLocaleDateString('vi-VN', {
  //       year: 'numeric',
  //       month: 'short',
  //       day: 'numeric'
  //     });
  //   } catch {
  //     return 'N/A';
  //   }
  // };

  return (
    <div className="overflow-x-auto" role="region" aria-label="Categories table" tabIndex={0}>
        {categories.length === 0 ? (
          /* ========== EMPTY STATE ========== */
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chưa có danh mục nào
            </h3>
            <p className="text-gray-600 text-center max-w-md">
              Bắt đầu bằng cách tạo danh mục đầu tiên cho hệ thống
            </p>
          </div>
        ) : (
          /* ========== TABLE WITH DATA ========== */
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16 text-center" scope="col">ID</TableHead>
                <TableHead className="min-w-[150px]" scope="col">Tên danh mục</TableHead>
                <TableHead className="min-w-[200px]" scope="col">Mô tả</TableHead>
                <TableHead className="w-[150px] text-center" scope="col">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow 
                  key={category.categoryID} 
                  className="hover:bg-gray-50 focus-within:bg-gray-50"
                >
                  {/* ========== ID ========== */}
                  <TableCell className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {category.categoryID}
                    </div>
                  </TableCell>

                  {/* ========== CATEGORY NAME ========== */}
                  <TableCell>
                    <div className="font-semibold text-gray-900">
                      {category.categoryName}
                    </div>
                  </TableCell>

                  {/* ========== DESCRIPTION ========== */}
                  <TableCell>
                    <div className="text-sm text-gray-700">
                      {category.description || 'Không có mô tả'}
                    </div>
                  </TableCell>

                  {/* ========== ACTIONS ========== */}
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(category)}
                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        aria-label={`Chỉnh sửa ${category.categoryName}`}
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" aria-hidden="true" />
                        <span className="sr-only">Chỉnh sửa</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(category)}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        aria-label={`Xóa ${category.categoryName}`}
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                        <span className="sr-only">Xóa</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
    </div>
  );
};

export default CategoryTable;
