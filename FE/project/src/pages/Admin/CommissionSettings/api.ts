import axios from '@/config/axiosConfig';
import { CommissionSettings, CommissionFormData } from './types';

export const commissionSettingsApi = {
  getSettings: async (): Promise<CommissionSettings> => {
    try {
      const response = await axios.get('/admin/setting');
      return response.data.result || response.data;
    } catch (error: any) {
      if (error.response) {
        const message = error.response.data?.message;
        throw new Error(message || 'Không thể tải cài đặt hoa hồng');
      }
      throw new Error('Không thể kết nối đến server');
    }
  },

  updateSettings: async (data: CommissionFormData): Promise<CommissionSettings> => {
    try {
      const response = await axios.put('/admin/setting', data);
      return response.data.result || response.data;
    } catch (error: any) {
      if (error.response) {
        const message = error.response.data?.message;
        throw new Error(message || 'Không thể cập nhật cài đặt hoa hồng');
      }
      throw new Error('Không thể kết nối đến server');
    }
  },
};
