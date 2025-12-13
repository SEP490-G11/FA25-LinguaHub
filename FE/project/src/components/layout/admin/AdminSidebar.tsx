import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileCheck,
  UserCheck,
  CreditCard,
  UserCog,
  RefreshCcw,
  Tags,
  Languages,
  DollarSign,
  Settings,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface AdminSidebarProps {
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
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },

  {
    title: 'Quản lý người dùng',
    href: '/admin/user-management',
    icon: UserCog,
  },
  {
    title: 'Quản lý khóa học',
    href: '/admin/courses',
    icon: BookOpen,
  },
  {
    title: 'Duyệt khóa học',
    href: '/admin/course-approval',
    icon: FileCheck,
  },
  {
    title: 'Duyệt đơn',
    href: '/admin/tutor-approval',
    icon: UserCheck,
  },
  {
    title: 'Quản lý danh mục',
    href: '/admin/categories',
    icon: Tags,
  },
  {
    title: 'Quản lý ngôn ngữ',
    href: '/admin/languages',
    icon: Languages,
  },
  {
    title: 'Quản lý thanh toán',
    href: '/admin/payments',
    icon: CreditCard,
  },
  {
    title: 'Yêu cầu rút tiền',
    href: '/admin/withdraw-requests',
    icon: DollarSign,
  },
  {
    title: 'Cài đặt hoa hồng',
    href: '/admin/commission-settings',
    icon: Settings,
  },
  {
    title: 'Quản lý hoàn tiền',
    href: '/admin/refund-management',
    icon: RefreshCcw,
  },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen }) => {
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
              <span className="text-sm">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
