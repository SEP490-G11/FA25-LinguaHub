import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatRelativeTime } from '../utils/formatters';
import { ROUTES } from '@/constants/routes';
import type { RecentUserItem } from '../types';

interface RecentUsersTableProps {
  users: RecentUserItem[];
}

/**
 * RecentUsersTable Component
 * 
 * Displays the 5 most recently registered users with their details.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 * - Retrieves the 5 most recent users ordered by created_at descending
 * - Includes userId, fullName, email, role name, and createdAt
 * - Displays recent users in a table format
 * - Does not apply date range filters to recent users
 * 
 * Features:
 * - Role badge with colors
 * - Format created_at as relative time
 * - Click handler for row navigation to user management
 * - Responsive table layout
 * - Empty state handling
 */
export const RecentUsersTable: React.FC<RecentUsersTableProps> = ({ users }) => {
  const navigate = useNavigate();

  /**
   * Handle row click to navigate to user management page
   * Requirement 8.4 - Click handler for row
   * Task 18.2: Memoize callback to prevent recreation on every render
   */
  const handleRowClick = React.useCallback((userId: number) => {
    // Navigate to user management page
    // Note: We don't have a specific user detail page, so we navigate to user management
    navigate(ROUTES.ADMIN_USER_MANAGEMENT);
  }, [navigate]);

  /**
   * Get badge color variant based on role name
   * Requirement 8.2 - Role badge with colors
   */
  const getRoleBadgeVariant = (roleName: string | undefined): 'default' | 'secondary' | 'outline' => {
    if (!roleName) return 'outline';
    const role = roleName.toLowerCase();
    if (role === 'admin') return 'default';
    if (role === 'tutor') return 'secondary';
    return 'outline';
  };

  /**
   * Get badge color classes based on role name
   */
  const getRoleBadgeClasses = (roleName: string | undefined): string => {
    if (!roleName) return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    const role = roleName.toLowerCase();
    if (role === 'admin') return 'bg-red-100 text-red-800 hover:bg-red-200';
    if (role === 'tutor') return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  };

  // Empty state handling
  if (!users || users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle id="recent-users-heading" className="flex items-center gap-2">
            <User className="w-5 h-5" aria-hidden="true" />
            Người dùng gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8" role="status" aria-label="No recent users found">
            Không tìm thấy người dùng gần đây
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle id="recent-users-heading" className="flex items-center gap-2 text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">
          <User className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
          Người dùng gần đây
        </CardTitle>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          {users.length} người dùng mới nhất
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <Table aria-label="Recent users table">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[180px]">Họ và tên</TableHead>
                <TableHead className="min-w-[200px]">Email</TableHead>
                <TableHead className="min-w-[100px]">Vai trò</TableHead>
                <TableHead className="min-w-[150px]">Ngày tạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.userId}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleRowClick(user.userId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleRowClick(user.userId);
                    }
                  }}
                  aria-label={`View details for ${user.fullName}`}
                >
                  {/* Full Name - Requirement 8.2 */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      <span className="font-medium">{user.fullName}</span>
                    </div>
                  </TableCell>

                  {/* Email - Requirement 8.2 */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      <span className="text-sm truncate max-w-[200px]" title={user.email}>
                        {user.email}
                      </span>
                    </div>
                  </TableCell>

                  {/* Role - Requirement 8.2, 8.3 (Role badge with colors) */}
                  <TableCell>
                    <Badge
                      variant={getRoleBadgeVariant(user.roleName)}
                      className={getRoleBadgeClasses(user.roleName)}
                    >
                      {user.roleName || 'User'}
                    </Badge>
                  </TableCell>

                  {/* Created At - Requirement 8.2, 8.3 (Format created_at as relative time) */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      <span className="text-sm text-muted-foreground">
                        {formatRelativeTime(user.createdAt)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Memoized version of RecentUsersTable for performance optimization
 */
export const MemoizedRecentUsersTable = React.memo(RecentUsersTable);

export default RecentUsersTable;
