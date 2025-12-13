import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { dashboardApi } from '../api';

export const useDashboardData = (startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: ['tutor-dashboard', startDate, endDate],
    queryFn: () =>
      dashboardApi.getDashboardData({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};
