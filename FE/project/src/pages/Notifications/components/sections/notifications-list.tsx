import React from 'react';
import { Bell, BookOpen, Calendar, MessageSquare, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface Notification {
  id: string;
  type: 'courses' | 'bookings' | 'messages' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
}

interface NotificationsListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onNotificationClick: (notification: Notification) => void;
}

const NotificationsList = ({ notifications, onMarkAsRead, onNotificationClick }: NotificationsListProps) => {
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'courses':
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'bookings':
        return <Calendar className="w-5 h-5 text-green-600" />;
      case 'messages':
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      case 'system':
        return <Info className="w-5 h-5 text-amber-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  const getNotificationBgColor = (type: Notification['type'], read: boolean) => {
    if (read) return 'bg-slate-50';

    switch (type) {
      case 'courses':
        return 'bg-blue-50';
      case 'bookings':
        return 'bg-green-50';
      case 'messages':
        return 'bg-purple-50';
      case 'system':
        return 'bg-amber-50';
      default:
        return 'bg-slate-50';
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Bell className="w-10 h-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No notifications</h3>
        <p className="text-slate-600">You're all caught up! No new notifications at the moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={cn(
            "rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all cursor-pointer",
            getNotificationBgColor(notification.type, notification.read)
          )}
          onClick={() => onNotificationClick(notification)}
        >
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
              notification.read ? 'bg-white' : 'bg-white shadow-sm'
            )}>
              {getNotificationIcon(notification.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className={cn(
                  "text-lg font-bold",
                  notification.read ? 'text-slate-700' : 'text-slate-900'
                )}>
                  {notification.title}
                  {!notification.read && (
                    <span className="ml-2 inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                  )}
                </h3>
                <span className="text-sm text-slate-500 whitespace-nowrap">
                  {notification.time}
                </span>
              </div>

              <p className={cn(
                "text-sm mb-3",
                notification.read ? 'text-slate-600' : 'text-slate-700'
              )}>
                {notification.message}
              </p>

              <div className="flex items-center gap-2">
                {!notification.read && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead(notification.id);
                    }}
                    className="gap-2"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Mark as Read
                  </Button>
                )}
                {notification.actionUrl && (
                  <Button
                    variant={notification.read ? 'outline' : 'default'}
                    size="sm"
                    className="gap-2"
                  >
                    View Details
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationsList;
