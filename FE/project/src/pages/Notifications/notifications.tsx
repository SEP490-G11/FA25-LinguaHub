import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationApi } from '@/queries/notification-api';
import { Notification } from '@/types/Notification';
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import api from '@/config/axiosConfig';

/**
 * Trang hiển thị tất cả thông báo
 */
const Notifications = () => {
  const navigate = useNavigate();
  
  // Lấy danh sách thông báo từ hook
  const { notifications, unreadCount, loading, refetch } = useNotifications();
  
  // Get user role
  const [userRole, setUserRole] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await api.get('/users/myInfo');
        setUserRole(res.data.result?.role || null);
      } catch (error) {
        console.error('Failed to fetch user role:', error);
      }
    };
    fetchUserRole();
  }, []);
  
  // State để filter: 'all', 'unread', 'read'
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'read'>('all');
  
  // State để sort: 'newest' hoặc 'oldest'
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Lọc thông báo theo filter
  let filteredNotifications = notifications;
  if (activeFilter === 'unread') {
    filteredNotifications = notifications.filter(n => !n.isRead);
  } else if (activeFilter === 'read') {
    filteredNotifications = notifications.filter(n => n.isRead);
  }
  
  // Sắp xếp theo thời gian
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });
  
  // Pagination
  const totalPages = Math.ceil(sortedNotifications.length / itemsPerPage);
  const paginatedNotifications = sortedNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Reset page khi filter thay đổi
  const handleFilterChange = (filter: 'all' | 'unread' | 'read') => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  /**
   * Lấy icon theo loại thông báo
   */
  const getNotificationIcon = (type: string) => {
    const iconClass = "w-5 h-5";
    
    if (type.includes('CANCEL')) {
      return <Bell className={cn(iconClass, "text-red-500")} />;
    }
    if (type.includes('CONFIRMED')) {
      return <CheckCheck className={cn(iconClass, "text-green-500")} />;
    }
    if (type.includes('REMINDER')) {
      return <Bell className={cn(iconClass, "text-blue-500")} />;
    }
    if (type.includes('MESSAGE')) {
      return <Bell className={cn(iconClass, "text-purple-500")} />;
    }
    if (type.includes('COMPLETED') || type.includes('APPROVED')) {
      return <Check className={cn(iconClass, "text-green-500")} />;
    }
    
    return <Bell className={cn(iconClass, "text-gray-500")} />;
  };

  /**
   * Xử lý khi click vào thông báo
   * Tutor: chỉ đánh dấu đã đọc, KHÔNG navigate
   * Learner/Admin: đánh dấu đã đọc VÀ navigate
   */
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read nếu chưa đọc và đợi refetch hoàn thành
      if (!notification.isRead) {
        await notificationApi.markAsRead(notification.notificationId);
        await refetch(); // Đợi refetch hoàn thành để UI cập nhật
      }
      
      // Tutor KHÔNG navigate, chỉ đánh dấu đã đọc
      if (userRole === 'Tutor') {
        return; // Dừng lại, không navigate
      }
      
      // Learner/Admin: navigate nếu có URL
      if (notification.primaryActionUrl) {
        navigate(notification.primaryActionUrl);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Vẫn navigate dù có lỗi (chỉ với Learner/Admin)
      if (userRole !== 'Tutor' && notification.primaryActionUrl) {
        navigate(notification.primaryActionUrl);
      }
    }
  };

  // Hiển thị loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Container lớn bao quanh toàn bộ */}
        <Card className="border-2 border-gray-300 shadow-xl bg-white">
          <div className="p-6 md:p-8">
            {/* Header - Tiêu đề và badge số lượng unread */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                  <p className="text-gray-600 mt-1">
                    Stay updated with your learning activities
                  </p>
                </div>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-lg px-4 py-2">
                    {unreadCount} new
                  </Badge>
                )}
              </div>

              {/* Filters và Sort */}
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={activeFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => handleFilterChange('all')}
                  >
                    All ({notifications.length})
                  </Button>
                  <Button
                    variant={activeFilter === 'unread' ? 'default' : 'outline'}
                    onClick={() => handleFilterChange('unread')}
                  >
                    Unread ({unreadCount})
                  </Button>
                  <Button
                    variant={activeFilter === 'read' ? 'default' : 'outline'}
                    onClick={() => handleFilterChange('read')}
                  >
                    Read ({notifications.filter(n => n.isRead).length})
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant={sortOrder === 'newest' ? 'default' : 'outline'}
                    onClick={() => setSortOrder('newest')}
                    size="sm"
                  >
                    Newest First
                  </Button>
                  <Button
                    variant={sortOrder === 'oldest' ? 'default' : 'outline'}
                    onClick={() => setSortOrder('oldest')}
                    size="sm"
                  >
                    Oldest First
                  </Button>
                </div>
              </div>
            </div>

            {/* Danh sách thông báo */}
            <div className="space-y-3">
              {paginatedNotifications.length === 0 ? (
                // Không có thông báo
                <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
                  <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No notifications
                  </h3>
                  <p className="text-gray-600">
                    {activeFilter === 'unread' 
                      ? "You're all caught up! No unread notifications."
                      : "You don't have any notifications yet."}
                  </p>
                </div>
              ) : (
                // Hiển thị từng thông báo
                paginatedNotifications.map((notification) => (
                  <Card
                    key={notification.notificationId}
                    className={cn(
                      "p-5 cursor-pointer transition-all hover:shadow-lg border-2",
                      // Thông báo chưa đọc có màu xanh nhạt với viền xanh đậm
                      !notification.isRead 
                        ? "bg-blue-50/50 border-blue-300 hover:border-blue-400" 
                        : "bg-white border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Nội dung */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 text-base">
                            {notification.title}
                          </h3>
                          {/* Chấm xanh cho thông báo chưa đọc */}
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                        
                        {/* Hiển thị FULL content ở trang notifications */}
                        <p className="text-gray-700 text-sm mb-3 whitespace-pre-wrap break-words">
                          {notification.content}
                        </p>
                        
                        {/* Thời gian và loại */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {formatDistanceToNow(new Date(notification.createdAt), { 
                              addSuffix: true 
                            })}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                            {notification.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Notifications;
