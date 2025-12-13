import React from 'react';
import { Users, Loader2, AlertCircle, UserCheck, Search, Shield, UserCog, Calendar } from 'lucide-react';
import { UserTable } from './components/UserTable';
import { useUsers } from './hooks/useUsers';
import { StandardPageHeading, StandardFilters, FilterConfig } from '@/components/shared';

/**
 * UserManagement main page component
 * Requirements: 1.1, 1.4, 4.1, 4.4 - Set up page layout, loading states, error handling, connect with useUsers hook
 */
export default function UserManagement() {
  const { users, loading, error, refresh, removeUser, addUser } = useUsers();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [dateFilter, setDateFilter] = React.useState('all');

  // Filter and sort users based on current filters
  const filteredUsers = React.useMemo(() => {
    // First, filter users - exclude Admin users
    let filtered = users.filter(user => {
      // Exclude Admin users from the list
      if (user.role === 'Admin') return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          user.fullName?.toLowerCase().includes(query) ||
          user.username?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter && statusFilter !== 'all') {
        const isActive = statusFilter === 'active';
        if (user.isActive !== isActive) return false;
      }

      // Role filter
      if (roleFilter && roleFilter !== 'all') {
        if (user.role !== roleFilter) return false;
      }

      return true;
    });

    // Then, sort by date if specified
    if (dateFilter && dateFilter !== 'all') {
      filtered = [...filtered].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        
        switch (dateFilter) {
          case 'newest':
            return dateB - dateA; // Newest first (descending)
          case 'oldest':
            return dateA - dateB; // Oldest first (ascending)
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [users, searchQuery, statusFilter, roleFilter, dateFilter]);

  const activeUsersCount = filteredUsers.filter(user => user.isActive).length;
  const totalUsersCount = filteredUsers.length;

  // Handle refresh with loading state
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setRoleFilter('all');
    setDateFilter('all');
  };

  try {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50">
        {/* ========== HEADER SECTION ========== */}
        <StandardPageHeading
          title="Quản lý người dùng"
          description="Quản lý và giám sát tất cả người dùng trong hệ thống"
          icon={Users}
          gradientFrom="from-purple-600"
          gradientVia="via-purple-600"
          gradientTo="to-purple-500"
          statistics={[
            {
              label: 'Tổng người dùng',
              value: users.filter(user => user.role !== 'Admin').length,
              ariaLabel: `${users.filter(user => user.role !== 'Admin').length} tổng người dùng`,
            },
            {
              label: 'Người dùng hoạt động',
              value: users.filter(user => user.isActive && user.role !== 'Admin').length,
              ariaLabel: `${users.filter(user => user.isActive && user.role !== 'Admin').length} người dùng hoạt động`,
            },
          ]}
        />

      {/* ========== MAIN CONTENT ========== */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* ========== LOADING STATE ========== */}
        {loading ? (
          <div className="flex justify-center items-center py-16 sm:py-24">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full mb-4">
                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-purple-600" aria-hidden="true" />
              </div>
              <p className="text-gray-700 font-semibold text-base sm:text-lg">Đang tải người dùng...</p>
              <p className="text-gray-500 text-sm mt-2">Vui lòng đợi trong khi chúng tôi tải dữ liệu người dùng</p>
            </div>
          </div>
        ) : error ? (
          /* ========== ERROR STATE ========== */
          <div className="bg-white rounded-xl shadow-md border border-red-100 p-8 sm:p-16 text-center hover:shadow-lg transition-all">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-red-100 via-red-100 to-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 sm:w-12 sm:h-12 text-red-500" aria-hidden="true" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Lỗi tải người dùng</h3>
            <p className="text-gray-600 text-base sm:text-lg mb-6">{error}</p>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              aria-label={isRefreshing ? 'Đang thử lại tải người dùng' : 'Thử lại tải người dùng'}
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Đang thử lại...
                </>
              ) : (
                'Thử lại'
              )}
            </button>
          </div>
        ) : users.length === 0 ? (
          /* ========== EMPTY STATE ========== */
          <div className="bg-white rounded-xl shadow-md border border-purple-100 p-8 sm:p-16 text-center hover:shadow-lg transition-all">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-100 via-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                <UserCheck className="w-8 h-8 sm:w-12 sm:h-12 text-purple-500" aria-hidden="true" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Không tìm thấy người dùng</h3>
            <p className="text-gray-600 text-base sm:text-lg">Hiện tại không có người dùng nào trong hệ thống.</p>
          </div>
        ) : (
          <>
            {/* ========== FILTERS ========== */}
            <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6 mb-6 hover:shadow-lg transition-all">
              <StandardFilters
                filters={[
                  {
                    id: 'search',
                    type: 'search',
                    placeholder: 'Tìm theo tên, tên đăng nhập, email...',
                    value: searchQuery,
                    onChange: setSearchQuery,
                    icon: Search,
                  },
                  {
                    id: 'status',
                    type: 'select',
                    placeholder: 'Tất cả trạng thái',
                    value: statusFilter,
                    onChange: setStatusFilter,
                    icon: Shield,
                    options: [
                      { value: 'all', label: 'Tất cả trạng thái' },
                      { value: 'active', label: 'Hoạt động' },
                      { value: 'inactive', label: 'Không hoạt động' },
                    ],
                  },
                  {
                    id: 'role',
                    type: 'select',
                    placeholder: 'Tất cả vai trò',
                    value: roleFilter,
                    onChange: setRoleFilter,
                    icon: UserCog,
                    options: [
                      { value: 'all', label: 'Tất cả vai trò' },
                      { value: 'Tutor', label: 'Gia sư' },
                      { value: 'Learner', label: 'Học viên' },
                    ],
                  },
                  {
                    id: 'date',
                    type: 'select',
                    placeholder: 'Thứ tự mặc định',
                    value: dateFilter,
                    onChange: setDateFilter,
                    icon: Calendar,
                    options: [
                      { value: 'all', label: 'Thứ tự mặc định' },
                      { value: 'newest', label: 'Mới nhất trước' },
                      { value: 'oldest', label: 'Cũ nhất trước' },
                    ],
                  },
                ] as FilterConfig[]}
              />
            </div>

            {/* ========== USER TABLE ========== */}
            {filteredUsers.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md border border-purple-100 p-8 sm:p-16 text-center hover:shadow-lg transition-all">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-100 via-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                    <UserCheck className="w-8 h-8 sm:w-12 sm:h-12 text-purple-500" aria-hidden="true" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Không có người dùng phù hợp với bộ lọc</h3>
                <p className="text-gray-600 text-base sm:text-lg">Thử điều chỉnh tiêu chí tìm kiếm hoặc xóa bộ lọc.</p>
              </div>
            ) : (
              <UserTable 
                users={filteredUsers} 
                onRefresh={handleRefresh}
                onRemoveUser={removeUser}
                onAddUser={addUser}
                isRefreshing={isRefreshing}
              />
            )}
          </>
        )}
      </div>
    </div>
    );
  } catch (renderError) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lỗi Component</h2>
          <p className="text-gray-600 mb-4">
            Đã xảy ra lỗi khi hiển thị trang Quản lý người dùng.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }
}