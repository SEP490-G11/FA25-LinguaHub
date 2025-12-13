import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TeachingLanguage } from '../types';

interface LanguageTableProps {
  languages: TeachingLanguage[];
  onEdit: (language: TeachingLanguage) => void;
  onDelete: (language: TeachingLanguage) => void;
  isRefreshing: boolean;
}

/**
 * LanguageTable component for teaching language list display
 * Requirements: 1.2, 9.1, 9.4 - responsive table layout, consistent styling, empty state handling
 */
export const LanguageTable: React.FC<LanguageTableProps> = ({ 
  languages, 
  onEdit, 
  onDelete, 
  isRefreshing 
}) => {
  return (
    <div className="overflow-x-auto" role="region" aria-label="Languages table" tabIndex={0}>
        {languages.length === 0 ? (
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
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Chưa có ngôn ngữ nào
            </h3>
            <p className="text-gray-600 text-center max-w-md">
              Bắt đầu bằng cách tạo ngôn ngữ giảng dạy đầu tiên cho hệ thống
            </p>
          </div>
        ) : (
          /* ========== TABLE WITH DATA ========== */
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16 text-center" scope="col">ID</TableHead>
                <TableHead className="min-w-[120px]" scope="col">Tên (VN)</TableHead>
                <TableHead className="min-w-[120px]" scope="col">Tên (EN)</TableHead>
                <TableHead className="min-w-[100px]" scope="col">Trạng thái</TableHead>
                <TableHead className="min-w-[100px]" scope="col">Độ khó</TableHead>
                <TableHead className="min-w-[150px]" scope="col">Chứng chỉ</TableHead>
                <TableHead className="min-w-[100px]" scope="col">Hình ảnh</TableHead>
                <TableHead className="w-[150px] text-center" scope="col">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {languages.map((language) => (
                <TableRow 
                  key={language.id} 
                  className="hover:bg-gray-50 focus-within:bg-gray-50"
                >
                  {/* ========== ID ========== */}
                  <TableCell className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {language.id}
                    </div>
                  </TableCell>

                  {/* ========== NAME (VN) ========== */}
                  <TableCell>
                    <div className="font-semibold text-gray-900">
                      {language.nameVi}
                    </div>
                  </TableCell>

                  {/* ========== NAME (EN) ========== */}
                  <TableCell>
                    <div className="text-sm text-gray-700">
                      {language.nameEn}
                    </div>
                  </TableCell>

                  {/* ========== STATUS ========== */}
                  <TableCell>
                    <Badge 
                      variant={language.isActive ? "default" : "secondary"}
                      className={language.isActive 
                        ? "bg-green-100 text-green-800 hover:bg-green-200" 
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }
                      aria-label={`Trạng thái: ${language.isActive ? 'Hoạt động' : 'Không hoạt động'}`}
                    >
                      {language.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    </Badge>
                  </TableCell>

                  {/* ========== DIFFICULTY ========== */}
                  <TableCell>
                    <div className="text-sm text-gray-700">
                      {language.difficulty}
                    </div>
                  </TableCell>

                  {/* ========== CERTIFICATES ========== */}
                  <TableCell>
                    <div className="text-sm text-gray-700">
                      {language.certificates}
                    </div>
                  </TableCell>

                  {/* ========== THUMBNAIL ========== */}
                  <TableCell>
                    <div className="flex items-center justify-center">
                      {language.thumbnailUrl ? (
                        <img 
                          src={language.thumbnailUrl} 
                          alt={`${language.nameVi} thumbnail`}
                          className="w-12 h-12 object-cover rounded-md border border-gray-200"
                          onError={(e) => {
                            // Fallback to placeholder on error
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* ========== ACTIONS ========== */}
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(language)}
                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        aria-label={`Chỉnh sửa ${language.nameVi}`}
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" aria-hidden="true" />
                        <span className="sr-only">Chỉnh sửa</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(language)}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        aria-label={`Xóa ${language.nameVi}`}
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

export default LanguageTable;
