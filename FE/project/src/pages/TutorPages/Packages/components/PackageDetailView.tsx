import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Edit,
  Trash2,
  Users,
  Calendar,
  Clock,
  FileText,
  Target,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { tutorPackageApi } from '../api';
import { Package } from '../types';
import BackButton from './BackButton';
import { StandardPageHeading } from '@/components/shared';

interface PackageDetailViewProps {
  packageId: number;
  onBack: () => void;
  onEdit: (packageId: number) => void;
  onDelete: (packageId: number) => void;
}

const PackageDetailView: React.FC<PackageDetailViewProps> = ({
  packageId,
  onBack,
  onEdit,
  onDelete
}) => {
  const [packageData, setPackageData] = useState<Package | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPackageDetails();
  }, [packageId]);

  const fetchPackageDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await tutorPackageApi.getPackageById(packageId);
      setPackageData(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin gói dịch vụ');
      console.error('Error fetching package details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Format dates for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <BackButton onClick={onBack} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải thông tin gói dịch vụ...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !packageData) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <BackButton onClick={onBack} />
        <div className="flex items-center justify-center h-96">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Không thể tải thông tin
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchPackageDetails} variant="outline">
                Thử lại
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <BackButton onClick={onBack} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-5xl mx-auto pt-16"
      >
        {/* Header Section */}
        <div className="mb-6">
          <StandardPageHeading
            title={packageData.name}
            children={
              <Badge
                variant={packageData.is_active ? "default" : "secondary"}
                className={packageData.is_active ? "bg-green-500 hover:bg-green-600 mt-2" : "bg-gray-500 hover:bg-gray-600 mt-2"}
              >
                {packageData.is_active ? "Hoạt động" : "Không hoạt động"}
              </Badge>
            }
            icon={FileText}
            gradientFrom="from-blue-600"
            gradientVia="via-indigo-600"
            gradientTo="to-purple-600"
            actionButtons={
              <div className="flex gap-2">
                <Button
                  onClick={() => onEdit(packageData.packageid)}
                  className="bg-white/20 hover:bg-white/30 text-white border-none"
                  variant="secondary"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Chỉnh sửa
                </Button>
                <Button
                  onClick={() => onDelete(packageData.packageid)}
                  className="bg-red-500/80 hover:bg-red-600/90 text-white border-none"
                  variant="secondary"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa
                </Button>
              </div>
            }
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Mô tả
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {packageData.description}
                </p>
              </CardContent>
            </Card>

            {/* Requirements Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Yêu cầu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {packageData.requirement}
                </p>
              </CardContent>
            </Card>

            {/* Objectives Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Mục tiêu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {packageData.objectives}
                </p>
              </CardContent>
            </Card>

            {/* Slot Content Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-600" />
                  Nội dung các buổi học ({packageData.slot_content.length} buổi)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {packageData.slot_content
                    .sort((a, b) => a.slot_number - b.slot_number)
                    .map((slot) => (
                      <Card key={slot.slot_number} className="bg-gray-50 border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                              {slot.slot_number}
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-700 whitespace-pre-wrap">
                                {slot.content}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Package Details */}
          <div className="space-y-6">
            {/* Package Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thông tin chi tiết</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Max Slots */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">
                      Số slot tối đa
                    </span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {packageData.max_slots}
                  </span>
                </div>


              </CardContent>
            </Card>

            {/* Timestamps Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thời gian</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-gray-500 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Ngày tạo</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(packageData.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-gray-500 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Cập nhật lần cuối</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(packageData.updated_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PackageDetailView;
