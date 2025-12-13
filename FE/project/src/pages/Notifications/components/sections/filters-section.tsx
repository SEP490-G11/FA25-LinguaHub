import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCheck } from 'lucide-react';

interface FiltersSectionProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onMarkAllAsRead: () => void;
}

const FiltersSection = ({ activeFilter, onFilterChange, onMarkAllAsRead }: FiltersSectionProps) => {
  const filters = [
    { id: 'all', label: 'All Notifications' },
    { id: 'unread', label: 'Unread' },
    { id: 'courses', label: 'Courses' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'messages', label: 'Messages' },
    { id: 'system', label: 'System' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? 'default' : 'outline'}
              onClick={() => onFilterChange(filter.id)}
              className="rounded-lg"
            >
              {filter.label}
            </Button>
          ))}
        </div>
        <Button
          onClick={onMarkAllAsRead}
          variant="outline"
          className="gap-2 whitespace-nowrap"
        >
          <CheckCheck className="w-4 h-4" />
          Mark All as Read
        </Button>
      </div>
    </div>
  );
};

export default FiltersSection;
