import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileCheck,
  UserCheck,
  CreditCard,
  UserCog,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    title: 'Dashboard',
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
    title: 'Quản lý thanh toán',
    href: '/admin/payments',
    icon: CreditCard,
  },
  {
    title: 'Quản lý hoàn tiền',
    href: '/admin/refund-management',
    icon: DollarSign,
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
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                'hover:bg-gray-100 group',
                active
                  ? 'bg-purple-50 text-purple-600 font-medium'
                  : 'text-gray-700 hover:text-gray-900'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-colors',
                  active ? 'text-purple-600' : 'text-gray-500 group-hover:text-gray-700'
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
