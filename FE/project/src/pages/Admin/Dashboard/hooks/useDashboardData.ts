import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { adminDashboardApi } from '../api';

export const useDashboardData = (startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: ['admin-dashboard', startDate, endDate],
    queryFn: () =>
      adminDashboardApi.getDashboardData({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};
