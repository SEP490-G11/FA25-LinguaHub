import { Badge } from '@/components/ui/badge';

interface ChangeItemProps {
  field: string;
  oldValue: string;
  newValue: string;
}

/**
 * ChangeItem component displays a single field change with old and new values
 * Handles null/empty values and formats values appropriately based on data type
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export function ChangeItem({ field, oldValue, newValue }: ChangeItemProps) {
  // Format value based on data type
  const formatValue = (value: string): React.ReactNode => {
    if (!value || value === 'null' || value === 'undefined') {
      return <span className="text-gray-400 italic">(empty)</span>;
    }

    // Handle numeric values
    if (!isNaN(Number(value)) && value.trim() !== '') {
      const num = Number(value);
      // Format as currency if it looks like a price (large number)
      if (num >= 1000) {
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(num);
      }
      return value;
    }

    // Handle date strings (ISO format)
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      } catch {
        // If date parsing fails, return original value
      }
    }

    // Handle URLs
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline break-all"
        >
          {value}
        </a>
      );
    }

    // Handle boolean values
    if (value === 'true' || value === 'false') {
      return (
        <Badge variant={value === 'true' ? 'default' : 'secondary'} className="text-xs">
          {value}
        </Badge>
      );
    }

    // Default: return as text
    return value;
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline" className="text-xs">
          {field}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-50 p-3 rounded border border-red-200">
          <p className="text-xs text-red-600 font-medium mb-1">Old Value</p>
          <p className="text-sm text-gray-900 break-words">
            {formatValue(oldValue)}
          </p>
        </div>

        <div className="bg-green-50 p-3 rounded border border-green-200">
          <p className="text-xs text-green-600 font-medium mb-1">New Value</p>
          <p className="text-sm text-gray-900 break-words">
            {formatValue(newValue)}
          </p>
        </div>
      </div>
    </div>
  );
}
