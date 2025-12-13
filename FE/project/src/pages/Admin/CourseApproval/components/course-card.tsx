import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, User, Calendar, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PendingCourse } from '../types';
import { routeHelpers } from '@/constants/routes';

interface Language {
  name: string;
  displayName: string;
}

interface CourseCardProps {
  course: PendingCourse;
  onClick?: () => void;
  showDraftBadge?: boolean;
  showPendingBadge?: boolean;
  buttonText?: string;
  variant?: 'approval' | 'management';
  languages?: Language[];
}

export function CourseCard({ 
  course, 
  onClick,
  showDraftBadge = true,
  showPendingBadge = true,
  buttonText,
  variant = 'approval',
  languages = []
}: CourseCardProps) {
  const navigate = useNavigate();

  // Helper function to get Vietnamese display name for language
  const getLanguageDisplayName = (languageName?: string): string => {
    if (!languageName) return 'English';
    
    // Find the language in the fetched languages list
    const language = languages.find(lang => lang.name === languageName);
    
    // Return displayName if found, otherwise return the original name
    return language?.displayName || languageName;
  };

  // Helper function to translate level to Vietnamese
  const getLevelLabel = (level?: string): string => {
    const levelMap: Record<string, string> = {
      'BEGINNER': 'Cơ bản',
      'INTERMEDIATE': 'Trung cấp',
      'ADVANCED': 'Nâng cao',
    };
    return levelMap[level?.toUpperCase() || 'BEGINNER'] || level || 'Cơ bản';
  };

  const handleViewDetails = () => {
    if (onClick) {
      onClick();
    } else {
      const isDraftParam = course.isDraft ? '?isDraft=true' : '';
      navigate(routeHelpers.adminCourseApprovalDetail(course.id) + isDraftParam);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-blue-100 group flex flex-col h-full">
      {/* Thumbnail - Fixed height */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex-shrink-0">
        {course.thumbnailURL ? (
          <img
            src={course.thumbnailURL}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">📚</span>
          </div>
        )}
        <div className="absolute top-3 right-3 flex gap-2">
          {/* Status Badge */}
          {course.status === 'Pending' && showPendingBadge && (
            <Badge className="bg-yellow-500 text-white font-semibold shadow-md">
              Chờ duyệt
            </Badge>
          )}
          {course.status === 'Pending Review' && showPendingBadge && (
            <Badge className="bg-orange-500 text-white font-semibold shadow-md">
              Chờ xem xét
            </Badge>
          )}
          {course.status === 'Chờ xem xét' && showPendingBadge && (
            <Badge className="bg-orange-500 text-white font-semibold shadow-md">
              Chờ xem xét
            </Badge>
          )}
          {course.status === 'Approved' && (
            <Badge className="bg-green-500 text-white font-semibold shadow-md">
              Đã duyệt
            </Badge>
          )}
          {course.status === 'Rejected' && (
            <Badge className="bg-red-500 text-white font-semibold shadow-md">
              Từ chối
            </Badge>
          )}
          {(course.status === 'DRAFT' || course.status === 'Draft') && (
            <Badge className="bg-gray-500 text-white font-semibold shadow-md">
              Nháp
            </Badge>
          )}
          {course.status === 'DISABLED' && (
            <Badge className="bg-gray-400 text-white font-semibold shadow-md">
              Vô hiệu
            </Badge>
          )}

        </div>
      </div>

      <CardContent className="p-5 flex flex-col flex-1">
        {/* Title - Fixed 2 lines */}
        <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
          {course.title}
        </h3>

        {/* Tutor Info - Prominent */}
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">Giảng viên</p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {course.tutorName || `Tutor #${course.tutorID}`}
            </p>
          </div>
        </div>

        {/* Category & Level - Compact */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {course.categoryName || 'No Category'}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {getLevelLabel(course.level)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {getLanguageDisplayName(course.language)}
          </Badge>
        </div>

        {/* Quick Stats - 2 columns */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-xs">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Clock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span className="font-medium">{course.duration} giờ</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <DollarSign className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            <span className="font-semibold text-blue-600 truncate">
              {formatPrice(course.price)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 col-span-2">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formatDate(course.createdAt)}</span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Action Button */}
        <Button
          onClick={handleViewDetails}
          className="w-full gap-2 mt-auto"
          size="sm"
        >
          <Eye className="w-4 h-4" />
          {buttonText || (variant === 'approval' ? 'Xem chi tiết & Duyệt' : 'Xem chi tiết')}
        </Button>
      </CardContent>
    </Card>
  );
}
