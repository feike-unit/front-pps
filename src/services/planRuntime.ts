import api, { PageResponse } from './api';

/**
 * 计划任务类型定义
 */
export interface PlanRuntime {
  id: number;
  demandId: number;
  productId: number;
  lineId: number;
  batchCode: string;
  productType: number;
  taskQuantity: number;
  registeredQuantity: number;
  completionQuantity: number;
  taskStatus: number;
  startAt: string;
  endAt: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  
  // 附加字段
  productCode?: string;
  productName?: string;
  lineCode?: string;
  lineName?: string;
}

/**
 * 计划任务更新类型定义
 */
export interface PlanRuntimeUpdate {
  batchCode?: string;
  taskQuantity?: number;
  registeredQuantity?: number;
  completionQuantity?: number;
  taskStatus?: number;
  startAt?: string;
  endAt?: string;
}

/**
 * 计划任务分页请求参数
 */
export interface PlanRuntimePageRequest {
  pageNum: number;
  pageSize: number;
  demandId?: number;
  productId?: number;
  lineId?: number;
  batchCode?: string;
  productType?: number;
  taskStatus?: number;
  startAtBegin?: string;
  startAtEnd?: string;
  endAtBegin?: string;
  endAtEnd?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

// 货品类型枚举
export enum ProductType {
  PURCHASE = 1, // 采购件
  SELF_MADE = 2, // 自制件
  OUTSOURCED = 3, // 委外件
}

// 任务状态枚举
export enum TaskStatus {
  CONFIRMED = 2, // 已确认
  EXECUTING = 3, // 执行中
  COMPLETED = 4, // 已完成
  CANCELLED = 5, // 已取消
}

// 分页查询计划任务列表
export const getPlanRuntimePage = async (params: PlanRuntimePageRequest): Promise<PageResponse<PlanRuntime>> => {
  const response = await api.get<PageResponse<PlanRuntime>>('/execution/plan-runtimes', { params });
  return response.data;
};

// 创建计划任务
export const createPlanRuntime = async (planRuntime: PlanRuntime): Promise<PlanRuntime> => {
  const response = await api.post<PlanRuntime>('/execution/plan-runtimes', planRuntime);
  return response.data;
};

// 更新计划任务
export const updatePlanRuntime = async (id: number, planRuntime: PlanRuntimeUpdate): Promise<PlanRuntime> => {
  const response = await api.put<PlanRuntime>(`/execution/plan-runtimes/${id}`, planRuntime);
  return response.data;
};

// 删除计划任务
export const deletePlanRuntime = async (id: number): Promise<void> => {
  await api.delete(`/execution/plan-runtimes/${id}`);
};

// 获取计划任务详情
export const getPlanRuntimeById = async (id: number): Promise<PlanRuntime> => {
  const response = await api.get<PlanRuntime>(`/execution/plan-runtimes/${id}`);
  return response.data;
};

// 根据需求ID查询计划任务列表
export const getPlanRuntimesByDemandId = async (demandId: number): Promise<PlanRuntime[]> => {
  const response = await api.get<PlanRuntime[]>(`/execution/plan-runtimes/by-demand/${demandId}`);
  return response.data;
};

// 根据货品类型查询计划任务列表
export const getPlanRuntimesByProductType = async (productType: number): Promise<PlanRuntime[]> => {
  const response = await api.get<PlanRuntime[]>(`/execution/plan-runtimes/by-product-type/${productType}`);
  return response.data;
};

// 根据货品类型和任务状态查询计划任务列表
export const getPlanRuntimesByProductTypeAndStatus = async (productType: number, taskStatus: number): Promise<PlanRuntime[]> => {
  const response = await api.get<PlanRuntime[]>(`/execution/plan-runtimes/by-product-type-and-status`, { 
    params: { productType, taskStatus } 
  });
  return response.data;
};

// 更新计划任务状态
export const updatePlanRuntimeStatus = async (id: number, status: number): Promise<PlanRuntime> => {
  const response = await api.patch<PlanRuntime>(`/execution/plan-runtimes/${id}/status`, null, {
    params: { status }
  });
  return response.data;
}; 