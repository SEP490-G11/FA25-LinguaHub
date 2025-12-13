import axios from '@/config/axiosConfig';
import { DashboardData, DashboardParams } from './types';

export const dashboardApi = {
  getDashboardData: async (params: DashboardParams): Promise<DashboardData> => {
    try {
      const response = await axios.get('/tutor/dashboard', { params });
      return response.data.result;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },
};
