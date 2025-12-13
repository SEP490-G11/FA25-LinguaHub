import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CoursePaginationProps } from '../types';

export const CoursePagination = ({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: CoursePaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <Card className="shadow-md">
      <CardContent className="pt-6">
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Trước
          </Button>
          
          <div className="flex gap-2">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              // Show first, last, current, and nearby pages
              let page;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  onClick={() => onPageChange(page)}
                  className="w-10"
                >
                  {page}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Sau
          </Button>
        </div>
        
        <p className="text-center text-sm text-gray-600 mt-4">
          Trang {currentPage} / {totalPages} • Tổng {totalItems} khóa học
        </p>
      </CardContent>
    </Card>
  );
};
