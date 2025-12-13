import React, { useState } from 'react';
import { Ban, User, Calendar, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { User as UserType } from '../types';

interface UserRowProps {
  user: UserType;
  onRefresh?: () => void;
}

/**
 * UserRow component for individual user display
 * Requirements: 1.2, 3.1, 3.2, 3.3 - display all user fields, action buttons
 */
const UserRow: React.FC<UserRowProps> = ({ user, onRefresh }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Format dates for display - Vietnamese format
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  // Translate role to Vietnamese
  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      'Admin': 'Quản trị viên',
      'Tutor': 'Gia sư',
      'Learner': 'Học viên',
    };
    return roleMap[role] || role;
  };



  return (
    <>
      <TableRow className="hover:bg-gray-50 focus-within:bg-gray-50">
        {/* ========== ID ========== */}
        <TableCell className="text-center">
          <div className="text-sm font-medium text-gray-900">
            {user.userID}
          </div>
        </TableCell>

        {/* ========== USER INFO ========== */}
        <TableCell>
          <div className="space-y-1">
            <div className="font-semibold text-gray-900">
              {user.fullName || 'N/A'}
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-1">
              <User className="w-3 h-3" aria-hidden="true" />
              <span>{user.username}</span>
            </div>
          </div>
        </TableCell>

        {/* ========== CONTACT INFO ========== */}
        <TableCell>
          <div className="space-y-1">
            <div className="text-sm text-gray-900 flex items-center gap-1">
              <Mail className="w-3 h-3" aria-hidden="true" />
              <span className="truncate max-w-[150px]" title={user.email}>
                {user.email || 'N/A'}
              </span>
            </div>
            {user.phone && (
              <div className="text-xs text-gray-600 flex items-center gap-1">
                <Phone className="w-3 h-3" aria-hidden="true" />
                <span>{user.phone}</span>
              </div>
            )}
          </div>
        </TableCell>

        {/* ========== STATUS ========== */}
        <TableCell>
          <Badge 
            variant={user.isActive ? "default" : "secondary"}
            className={user.isActive 
              ? "bg-green-100 text-green-800 hover:bg-green-200" 
              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }
            aria-label={`Trạng thái người dùng: ${user.isActive ? 'Hoạt động' : 'Không hoạt động'}`}
          >
            {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
          </Badge>
        </TableCell>

        {/* ========== ROLE ========== */}
        <TableCell>
          <Badge variant="outline" className="font-medium">
            {getRoleLabel(user.role || 'User')}
          </Badge>
        </TableCell>

        {/* ========== CREATED DATE ========== */}
        <TableCell>
          <div className="text-sm text-gray-700 flex items-center gap-1">
            <Calendar className="w-4 h-4 text-gray-500" aria-hidden="true" />
            <span>{formatDate(user.createdAt)}</span>
          </div>
        </TableCell>

        {/* ========== ACTIONS ========== */}
        <TableCell>
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              aria-label={`Dừng hoạt động ${user.fullName || user.username}`}
              title="Dừng hoạt động"
            >
              <Ban className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Dừng hoạt động</span>
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* ========== DELETE CONFIRMATION MODAL ========== */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        user={user}
        onRefresh={onRefresh}
      />
    </>
  );
};

export default UserRow;