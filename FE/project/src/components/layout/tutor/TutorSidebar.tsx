import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Calendar,
  MessageSquare,
  CreditCard,
  Package,
  CalendarCheck,
  DollarSign,
  History,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { ROUTES } from '@/constants/routes';

interface TutorSidebarProps {
  isOpen: boolean;
}

interface MenuItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const menuItems: MenuItem[] = [
  {
    title: 'Tổng quan',
    href: ROUTES.TUTOR_DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    title: 'Khóa học của tôi',
    href: ROUTES.TUTOR_COURSES,
    icon: BookOpen,
  },
  {
    title: 'Học viên',
    href: ROUTES.TUTOR_STUDENTS,
    icon: Users,
  },
  {
    title: 'Lịch dạy',
    href: ROUTES.TUTOR_SCHEDULE,
    icon: Calendar,
  },
  {
    title: 'Lịch đã đặt',
    href: ROUTES.TUTOR_BOOKED_SLOTS,
    icon: CalendarCheck,
  },
  {
    title: 'Gói dịch vụ',
    href: ROUTES.TUTOR_PACKAGES,
    icon: Package,
  },
  {
    title: 'Tin nhắn',
    href: ROUTES.TUTOR_MESSAGES,
    icon: MessageSquare,
  },
  {
    title: 'Quản lý thanh toán',
    href: ROUTES.PAYMENTS,
    icon: CreditCard,
  },
  {
    title: 'Rút tiền',
    href: ROUTES.WITHDRAWAL,
    icon: DollarSign,
  },
  {
    title: 'Lịch sử rút tiền',
    href: ROUTES.WITHDRAWAL_HISTORY,
    icon: History,
  },
  // {
  //   title: 'Tài nguyên',
  //   href: '/resources',
  //   icon: FileText,
  // },
  // {
  //   title: 'Cài đặt',
  //   href: '/settings',
  //   icon: Settings,
  // },
];

const TutorSidebar: React.FC<TutorSidebarProps> = ({ isOpen }) => {
  const location = useLocation();

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 shadow-sm overflow-y-auto z-40">
      <nav className="p-4 space-y-2 pb-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200',
                'hover:bg-accent hover:text-accent-foreground group',
                active
                  ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                  : 'text-muted-foreground'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default TutorSidebar;
