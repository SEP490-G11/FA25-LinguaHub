import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/types/Notification';
import { Bell, Check, CheckCheck, Loader2, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Format ISO datetime trong content thành dạng đẹp hơn
 * VD: 2025-12-05T12:00 -> 12:00 ngày 05/12/2025
 */
const formatContentDates = (content: string): string => {
  if (!content) return content;
  
  // Regex để tìm ISO datetime format: YYYY-MM-DDTHH:mm hoặc YYYY-MM-DDTHH:mm:ss
  const isoDateRegex = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?)/g;
  
  return content.replace(isoDateRegex, (match) => {
    try {
      const date = parseISO(match);
      // Kiểm tra date có hợp lệ không
      if (isNaN(date.getTime())) {
        return match;
      }
      return format(date, "HH:mm 'ngày' dd/MM/yyyy", { locale: vi });
    } catch {
      return match; // Nếu parse lỗi thì giữ nguyên
    }
  });
};

/**
 * Trang hiển thị tất cả thông báo
 */
const Notifications = () => {
  const navigate = useNavigate();
  
  // Lấy danh sách thông báo từ hook
  const { notifications, unreadCount, loading, markAsRead } = useNotifications();
  
  // State để filter: 'all', 'unread', hoặc 'read'
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'read'>('all');
  
  // State tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');
  
  // State phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Normalize text for search (remove diacritics)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .trim();
  };

  // Lọc thông báo theo filter và search
  const filteredNotifications = useMemo(() => {
    let filtered = activeFilter === 'all' 
      ? notifications 
      : activeFilter === 'unread'
        ? notifications.filter(n => !n.isRead)
        : notifications.filter(n => n.isRead);
    
    // Apply search filter
    if (searchQuery.trim()) {
      const normalizedQuery = normalizeText(searchQuery);
      filtered = filtered.filter(notification => {
        const normalizedTitle = normalizeText(notification.title);
        const normalizedContent = normalizeText(notification.content);
        const normalizedType = normalizeText(notification.type.replace(/_/g, ' '));
        
        return normalizedTitle.includes(normalizedQuery) ||
               normalizedContent.includes(normalizedQuery) ||
               normalizedType.includes(normalizedQuery);
      });
    }
    
    return filtered;
  }, [notifications, activeFilter, searchQuery]);
  
  // Tính toán phân trang
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);
  
  const readCount = notifications.filter(n => n.isRead).length;
  
  // Reset về trang 1 khi filter thay đổi
  const handleFilterChange = (filter: 'all' | 'unread' | 'read') => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  // Reset về trang 1 khi search thay đổi
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
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
   */
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read nếu chưa đọc
    if (!notification.isRead) {
      await markAsRead(notification.notificationId);
    }
    
    // Nếu có link thì chuyển đến trang đó
    if (notification.primaryActionUrl) {
      navigate(notification.primaryActionUrl);
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
                  <h1 className="text-3xl font-bold text-gray-900">Thông báo</h1>
                  <p className="text-gray-600 mt-1">
                    Cập nhật các hoạt động học tập của bạn
                  </p>
                </div>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-lg px-4 py-2">
                    {unreadCount} mới
                  </Badge>
                )}
              </div>

              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm thông báo..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filters - Nút All, Unread và Read */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={activeFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => handleFilterChange('all')}
                >
                  Tất cả ({notifications.length})
                </Button>
                <Button
                  variant={activeFilter === 'unread' ? 'default' : 'outline'}
                  onClick={() => handleFilterChange('unread')}
                >
                  Chưa đọc ({unreadCount})
                </Button>
                <Button
                  variant={activeFilter === 'read' ? 'default' : 'outline'}
                  onClick={() => handleFilterChange('read')}
                >
                  Đã đọc ({readCount})
                </Button>
              </div>
            </div>
            
            {/* Thông tin phân trang và kết quả tìm kiếm */}
            {filteredNotifications.length > 0 && (
              <div className="mb-4 text-sm text-gray-600">
                {searchQuery ? (
                  <>
                    Tìm thấy <strong>{filteredNotifications.length}</strong> kết quả cho "<strong>{searchQuery}</strong>" 
                    {filteredNotifications.length > itemsPerPage && (
                      <> - Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredNotifications.length)}</>
                    )}
                  </>
                ) : (
                  <>Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredNotifications.length)} trong tổng số {filteredNotifications.length} thông báo</>
                )}
              </div>
            )}

            {/* Danh sách thông báo */}
            <div className="space-y-3">
              {paginatedNotifications.length === 0 ? (
                // Không có thông báo
                <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
                  <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Không có thông báo
                  </h3>
                  <p className="text-gray-600">
                    {searchQuery ? (
                      <>
                        Không tìm thấy thông báo nào với từ khóa "<strong>{searchQuery}</strong>".
                        <br />
                        <button 
                          onClick={clearSearch}
                          className="text-blue-600 hover:text-blue-700 underline mt-2 inline-block"
                        >
                          Xóa tìm kiếm
                        </button>
                      </>
                    ) : (
                      activeFilter === 'unread' 
                        ? "Bạn đã xem hết! Không có thông báo chưa đọc."
                        : activeFilter === 'read'
                          ? "Không có thông báo đã đọc."
                          : "Bạn chưa có thông báo nào."
                    )}
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
                        
                        {/* Hiển thị FULL content ở trang notifications với date đã format */}
                        <p className="text-gray-700 text-sm mb-3 whitespace-pre-wrap break-words">
                          {formatContentDates(notification.content)}
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
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t pt-6">
                <div className="text-sm text-gray-600">
                  Trang {currentPage} / {totalPages}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Trước
                  </Button>
                  
                  {/* Page numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Hiển thị: trang đầu, trang cuối, trang hiện tại và 2 trang xung quanh
                        return page === 1 || 
                               page === totalPages || 
                               Math.abs(page - currentPage) <= 1;
                      })
                      .map((page, index, array) => {
                        // Thêm dấu ... nếu có khoảng cách
                        const prevPage = array[index - 1];
                        const showEllipsis = prevPage && page - prevPage > 1;
                        
                        return (
                          <div key={page} className="flex gap-1">
                            {showEllipsis && (
                              <span className="px-3 py-1 text-gray-400">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="min-w-[40px]"
                            >
                              {page}
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Sau
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Notifications;
