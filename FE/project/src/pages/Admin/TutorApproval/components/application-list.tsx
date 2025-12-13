import { Application } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye } from 'lucide-react';

interface ApplicationListProps {
  applications: Application[];
  onViewDetails: (application: Application) => void;
}

export function ApplicationList({
  applications,
  onViewDetails,
}: ApplicationListProps) {
  const getStatusBadge = (status: Application['status']) => {
    const variants = {
      pending: 'bg-orange-100 text-orange-800 border-orange-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    };

    const labels = {
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
    };

    return (
      <Badge className={`${variants[status]} font-semibold`}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-50 hover:to-blue-50">
            <TableHead className="w-[60px] text-center font-bold text-indigo-900">STT</TableHead>
            <TableHead className="font-bold text-indigo-900">Tên người đăng ký</TableHead>
            <TableHead className="font-bold text-indigo-900">Ngôn ngữ giảng dạy</TableHead>
            <TableHead className="font-bold text-indigo-900">Chuyên môn</TableHead>
            <TableHead className="text-center font-bold text-indigo-900">Trạng thái</TableHead>
            <TableHead className="text-center font-bold text-indigo-900">Ngày đăng ký</TableHead>
            <TableHead className="text-center font-bold text-indigo-900 w-[120px]">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((application, index) => (
            <TableRow 
              key={application.id}
              className="hover:bg-blue-50 transition-colors"
            >
              <TableCell className="text-center font-bold text-indigo-600">
                {index + 1}
              </TableCell>
              <TableCell className="font-semibold text-gray-900">
                {application.applicantName}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {application.teachingLanguages.map((lang, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {lang}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-gray-700">
                {application.specialization}
              </TableCell>
              <TableCell className="text-center">
                {getStatusBadge(application.status)}
              </TableCell>
              <TableCell className="text-center text-gray-600">
                {new Date(application.appliedDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </TableCell>
              <TableCell className="text-center">
                <Button
                  onClick={() => onViewDetails(application)}
                  size="sm"
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Xem
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
