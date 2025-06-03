import api from './api';

export interface DemandStats {
  totalCount: number;
  inProgressCount: number;
  completedCount: number;
  delayedCount: number;
  completionRate: number;
}

export interface PlanStats {
  totalCount: number;
  onScheduleCount: number;
  delayedCount: number;
  completionRate: number;
}

export interface PullLineStats {
  totalLines: number;
  activeLines: number;
  productTypes: number;
  totalPlannedQuantity: number;
}

export interface TodayDemand {
  id: number;
  businessDocNo: string;
  customerName: string;
  productName: string;
  demandQuantity: number;
  completionQuantity: number;
  deliveryDate: string;
  status: number;
}

export interface TodayPlan {
  id: number;
  batchCode: string;
  lineName: string;
  productName: string;
  taskQuantity: number;
  completionQuantity: number;
  startDate: string;
  endDate: string;
  status: number;
}

export interface TrendData {
  date: string;
  value: number;
}

// 获取需求统计数据
export const getDemandStats = async (): Promise<DemandStats> => {
  const response = await api.get<DemandStats>('/execution/dashboard/demand-stats');
  return response.data;
};

// 获取计划统计数据
export const getPlanStats = async (): Promise<PlanStats> => {
  const response = await api.get<PlanStats>('/execution/dashboard/plan-stats');
  return response.data;
};

// 获取拉线统计数据
export const getPullLineStats = async (): Promise<PullLineStats> => {
  const response = await api.get<PullLineStats>('/execution/dashboard/pull-line-stats');
  return response.data;
};

// 获取今日需求列表
export const getTodayDemands = async (): Promise<TodayDemand[]> => {
  const response = await api.get<TodayDemand[]>('/execution/dashboard/today-demands');
  return response.data;
};

// 获取今日计划列表
export const getTodayPlans = async (): Promise<TodayPlan[]> => {
  const response = await api.get<TodayPlan[]>('/execution/dashboard/today-plans');
  return response.data;
};

// 获取需求趋势数据
export const getDemandTrend = async (): Promise<TrendData[]> => {
  const response = await api.get<TrendData[]>('/execution/dashboard/demand-trend');
  return response.data;
};

// 获取计划趋势数据
export const getPlanTrend = async (): Promise<TrendData[]> => {
  const response = await api.get<TrendData[]>('/execution/dashboard/plan-trend');
  return response.data;
}; 