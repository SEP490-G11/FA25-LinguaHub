import React from 'react';
import { Bell } from 'lucide-react';

interface HeroSectionProps {
  totalNotifications: number;
  unreadCount: number;
}

const HeroSection = ({ totalNotifications, unreadCount }: HeroSectionProps) => {
  return (
    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl shadow-lg p-8 text-white mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center relative">
            <Bell className="w-8 h-8 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2">Notifications</h1>
            <p className="text-blue-100 text-lg">
              Stay updated with all your activities and announcements
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-sm text-blue-100 mb-1">Total</p>
            <p className="text-3xl font-bold">{totalNotifications}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-sm text-blue-100 mb-1">Unread</p>
            <p className="text-3xl font-bold text-amber-300">{unreadCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
