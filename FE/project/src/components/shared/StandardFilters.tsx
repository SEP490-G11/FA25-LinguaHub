import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  StandardFiltersProps,
  FilterConfig,
  DESIGN_TOKENS,
} from './types/standard-components';

/**
 * Custom hook for debouncing values
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 */
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * StandardFilters Component
 * 
 * A unified filters component with consistent styling across Admin and TutorPages.
 * Supports search inputs and select dropdowns with flexible configuration.
 * 
 * @param filters - Array of filter configurations
 * @param layout - Layout direction: 'horizontal' (default) or 'vertical'
 */
export const StandardFilters: React.FC<StandardFiltersProps> = ({
  filters,
  layout = 'horizontal',
}) => {
  return (
    <div
      className={cn(
        DESIGN_TOKENS.filters.container,
        layout === 'vertical' && 'flex-col'
      )}
      role="search"
      aria-label="Filters"
    >
      {filters.map((filter) => (
        <FilterItem key={filter.id} filter={filter} />
      ))}
    </div>
  );
};

/**
 * Individual filter item component
 */
const FilterItem: React.FC<{ filter: FilterConfig }> = ({ filter }) => {
  if (filter.type === 'search') {
    return <SearchFilter filter={filter} />;
  }
  
  if (filter.type === 'select') {
    return <SelectFilter filter={filter} />;
  }

  return null;
};

/**
 * Search input filter component with debounce support
 */
const SearchFilter: React.FC<{ filter: FilterConfig }> = ({ filter }) => {
  const [searchValue, setSearchValue] = useState(filter.value);
  const debouncedSearchValue = useDebounce(searchValue, 300);
  const isFirstRender = useRef(true);

  // Update local state when external value changes (e.g., reset filters)
  useEffect(() => {
    setSearchValue(filter.value);
  }, [filter.value]);

  // Call onChange when debounced value changes
  useEffect(() => {
    // Skip the first render to avoid calling onChange on mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Call onChange with the debounced value
    filter.onChange(debouncedSearchValue);
  }, [debouncedSearchValue]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  }, []);

  const SearchIcon = filter.icon || Search;

  return (
    <div
      className={cn(
        'relative flex-1',
        DESIGN_TOKENS.filters.searchMinWidth
      )}
    >
      <SearchIcon
        className={cn(
          DESIGN_TOKENS.filters.searchIconPosition,
          DESIGN_TOKENS.filters.searchIconSize
        )}
        aria-hidden="true"
      />
      <Input
        type="text"
        placeholder={filter.placeholder}
        value={searchValue}
        onChange={handleChange}
        className={cn(
          DESIGN_TOKENS.filters.searchPaddingLeft,
          DESIGN_TOKENS.borderRadius.input
        )}
        aria-label={filter.placeholder}
      />
    </div>
  );
};

/**
 * Select dropdown filter component
 */
const SelectFilter: React.FC<{ filter: FilterConfig }> = ({ filter }) => {
  const handleValueChange = useCallback((value: string) => {
    filter.onChange(value);
  }, [filter]);

  const SelectIcon = filter.icon;

  return (
    <div
      className={cn(
        filter.width || DESIGN_TOKENS.filters.selectWidth
      )}
    >
      <Select value={filter.value} onValueChange={handleValueChange}>
        <SelectTrigger
          className={cn(DESIGN_TOKENS.borderRadius.input)}
          aria-label={filter.placeholder}
        >
          {SelectIcon && (
            <SelectIcon className="w-4 h-4 mr-2" aria-hidden="true" />
          )}
          <SelectValue placeholder={filter.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {filter.options?.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default StandardFilters;
