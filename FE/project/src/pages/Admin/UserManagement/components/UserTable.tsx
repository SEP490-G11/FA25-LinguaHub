import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import UserRow from './UserRow';
import { User } from '../types';

interface UserTableProps {
  users: User[];
  onRefresh: () => void;
  onRemoveUser: (userID: number) => void;
  onAddUser: (user: User) => void;
  isRefreshing?: boolean;
}

/**
 * UserTable component for user list display
 * Requirements: 1.2, 3.1, 3.2, 3.3, 4.4 - responsive table layout, user status indicators, role display, empty state handling
 */
export const UserTable: React.FC<UserTableProps> = ({ users, onRefresh, onRemoveUser, onAddUser, isRefreshing = false }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-blue-100 hover:shadow-lg transition-all">
      {/* ========== TABLE HEADER ========== */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Danh sách người dùng</h2>
            <p className="text-gray-600 text-sm mt-1" aria-live="polite">
              Hiển thị {users.length} người dùng
            </p>
          </div>
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 font-semibold disabled:opacity-50 w-full sm:w-auto"
            aria-label={isRefreshing ? 'Đang làm mới danh sách người dùng' : 'Làm mới danh sách người dùng'}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {isRefreshing ? 'Đang làm mới...' : 'Làm mới'}
          </Button>
        </div>
      </div>

      {/* ========== RESPONSIVE TABLE ========== */}
      <div className="overflow-x-auto" role="region" aria-label="Users table" tabIndex={0}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16 text-center" scope="col">ID</TableHead>
              <TableHead className="min-w-[180px]" scope="col">Thông tin người dùng</TableHead>
              <TableHead className="min-w-[180px]" scope="col">Liên hệ</TableHead>
              <TableHead className="min-w-[100px]" scope="col">Trạng thái</TableHead>
              <TableHead className="min-w-[100px]" scope="col">Vai trò</TableHead>
              <TableHead className="min-w-[120px]" scope="col">Ngày tạo</TableHead>
              <TableHead className="w-[120px] text-center" scope="col">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <UserRow 
                key={user.userID} 
                user={user} 
                onRefresh={onRefresh}
              />
            ))}
          </TableBody>
        </Table>
      </div>

    </div>
  );
};

export default UserTable;