import { Filter, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FiltersSectionProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  sortOrder: 'newest' | 'oldest';
  onSortChange: (sort: 'newest' | 'oldest') => void;
}

const FiltersSection = ({ activeFilter, onFilterChange, sortOrder, onSortChange }: FiltersSectionProps) => {
  const filters = [
    { value: 'all', label: 'All Requests' },
    { value: 'pending', label: 'Pending' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex flex-col gap-4">
          {/* Filter by status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <Filter className="w-5 h-5 text-green-600" />
              <span>Filter by status:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                  <Button
                      key={filter.value}
                      onClick={() => onFilterChange(filter.value)}
                      variant={activeFilter === filter.value ? 'default' : 'outline'}
                      className={activeFilter === filter.value ? 'bg-green-600 hover:bg-green-700' : ''}
                      size="sm"
                  >
                    {filter.label}
                  </Button>
              ))}
            </div>
          </div>
          
          {/* Sort by date */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <ArrowUpDown className="w-5 h-5 text-green-600" />
              <span>Sort by date:</span>
            </div>

            <div className="flex gap-2">
              <Button
                  onClick={() => onSortChange('newest')}
                  variant={sortOrder === 'newest' ? 'default' : 'outline'}
                  className={sortOrder === 'newest' ? 'bg-green-600 hover:bg-green-700' : ''}
                  size="sm"
              >
                Newest First
              </Button>
              <Button
                  onClick={() => onSortChange('oldest')}
                  variant={sortOrder === 'oldest' ? 'default' : 'outline'}
                  className={sortOrder === 'oldest' ? 'bg-green-600 hover:bg-green-700' : ''}
                  size="sm"
              >
                Oldest First
              </Button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default FiltersSection;
