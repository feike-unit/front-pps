import api, { PageResponse } from './api';

/**
 * 生产计划类型定义
 */
export interface ProductionPlan {
  id: number;
  planCode: string;
  demandCode: string;
  productName: string;
  lineCode: string;
  lineName: string;
  planQuantity: number;
  completedQuantity: number;
  startDate: string;
  endDate: string;
  status: number;
  remark?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 生产计划更新类型定义
 */
export interface ProductionPlanUpdate {
  planCode?: string;
  demandCode?: string;
  productName?: string;
  lineCode?: string;
  lineName?: string;
  planQuantity?: number;
  completedQuantity?: number;
  startDate?: string;
  endDate?: string;
  status?: number;
  remark?: string;
}

/**
 * 生产计划分页请求参数
 */
export interface ProductionPlanPageRequest {
  pageNum: number;
  pageSize: number;
  planCode?: string;
  demandCode?: string;
  lineCode?: string;
  status?: number;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

// 状态枚举
export enum ProductionPlanStatus {
  DRAFT = 1,      // 草稿
  CONFIRMED = 2,  // 已确认
  EXECUTING = 3,  // 执行中
  COMPLETED = 4,  // 已完成
  CANCELLED = 5,  // 已取消
}

// 分页查询生产计划列表
export const getProductionPlanPage = async (params: ProductionPlanPageRequest): Promise<PageResponse<ProductionPlan>> => {
  const response = await api.get<PageResponse<ProductionPlan>>('/execution/production-plans', { params });
  return response.data;
};

// 创建生产计划
export const createProductionPlan = async (plan: ProductionPlan): Promise<ProductionPlan> => {
  const response = await api.post<ProductionPlan>('/execution/production-plans', plan);
  return response.data;
};

// 更新生产计划
export const updateProductionPlan = async (id: number, plan: ProductionPlanUpdate): Promise<ProductionPlan> => {
  const response = await api.put<ProductionPlan>(`/execution/production-plans/${id}`, plan);
  return response.data;
};

// 删除生产计划
export const deleteProductionPlan = async (id: number): Promise<void> => {
  await api.delete(`/execution/production-plans/${id}`);
};

// 获取生产计划详情
export const getProductionPlanById = async (id: number): Promise<ProductionPlan> => {
  const response = await api.get<ProductionPlan>(`/execution/production-plans/${id}`);
  return response.data;
};

// 更新生产计划状态
export const updateProductionPlanStatus = async (id: number, status: number): Promise<ProductionPlan> => {
  const response = await api.patch<ProductionPlan>(`/execution/production-plans/${id}/status`, null, {
    params: { status }
  });
  return response.data;
};