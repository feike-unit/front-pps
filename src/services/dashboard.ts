import api from './api';
import type { ApiResponse } from './api';

export interface DashboardStats {
  totalDemands: number;
  pendingDemands: number;
  inProgressDemands: number;
  completedDemands: number;
  totalLines: number;
  activeLines: number;
  todayCompletionRate: number;
  weekCompletionRate: number;
  monthCompletionRate: number;
}

// 获取仪表盘统计数据
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
  return response.data.data;
}; 