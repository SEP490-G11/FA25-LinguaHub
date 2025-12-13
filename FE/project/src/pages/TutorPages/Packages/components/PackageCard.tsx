import React from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, Users, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PackageCardProps } from '../types';

const PackageCard: React.FC<PackageCardProps> = ({ 
  package: pkg, 
  onView,
  onEdit, 
  onDelete
}) => {
  // Handle card click - navigate to detail view
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on action buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    onView(pkg.packageid);
  };
  // Format dates for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card 
        className="h-full flex flex-col hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200 cursor-pointer"
        onClick={handleCardClick}
      >
        <CardContent className="flex-1 p-6">
          {/* Header with status badge */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2">
                {pkg.name}
              </h3>
            </div>
            <Badge 
              variant={pkg.is_active ? "default" : "secondary"}
              className={pkg.is_active ? "bg-green-500 hover:bg-green-600" : "bg-gray-500 hover:bg-gray-600"}
            >
              {pkg.is_active ? "Hoạt động" : "Không hoạt động"}
            </Badge>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {pkg.description}
          </p>

          {/* Package details */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span className="text-sm">Số slot tối đa</span>
              </div>
              <span className="font-semibold text-blue-600">
                {pkg.max_slots}
              </span>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-2 text-xs text-gray-500 border-t pt-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              <span>Tạo: {formatDate(pkg.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Cập nhật: {formatDate(pkg.updated_at)}</span>
            </div>
          </div>
        </CardContent>

        {/* Action buttons */}
        <CardFooter className="p-6 pt-0 flex gap-2">
          <Button
            size="sm"
            onClick={() => onEdit(pkg.packageid)}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Edit className="w-4 h-4 mr-2" />
            Chỉnh sửa
          </Button>
          <Button
            size="sm"
            onClick={() => onDelete(pkg.packageid)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Xóa
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PackageCard;