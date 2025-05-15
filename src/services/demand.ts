import { ApiResponse } from './api';
import api from './api';

// 需求状态枚举
export enum DemandStatus {
  DRAFT = 1,      // 草稿
  CONFIRMED = 2,  // 已确认
  EXECUTING = 3,  // 执行中
  COMPLETED = 4,  // 已完成
  CANCELLED = 5,  // 已取消
}

// 需求实体类型
export interface Demand {
  id?: number;
  parentId?: number;
  productId: number;
  productCode?: string;
  productName?: string;
  productType: number;
  deliveryDate: string;
  demandQuantity: number;
  purgeQuantity?: number;
  registeredQuantity?: number;
  completionQuantity?: number;
  businessKey?: string;
  businessType?: string;
  businessDocNo?: string;
  customerOrderDocNo?: string;
  customerCode?: string;
  customerName?: string;
  bomId?: string;
  parentBomId?: string;
  status: number;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
  children?: Demand[];
}

// 分页响应类型
export interface PageResponse<T> {
  pageNum: number;
  pageSize: number;
  total: number;
  pages: number;
  list: T[];
  isFirst: boolean;
  isLast: boolean;
}

// 分页请求参数
export interface DemandPageRequest {
  pageNum?: number;
  pageSize?: number;
  productId?: number;
  status?: DemandStatus;
  deliveryDate?: string;
  deliveryDateStart?: string;
  deliveryDateEnd?: string;
  keyword?: string;
  sortField?: string;
  sortOrder?: string;
}

// 获取需求分页列表
export const getDemandPage = async (params: DemandPageRequest): Promise<PageResponse<Demand>> => {
  const response = await api.get('/execution/demands', { params });
  return response.data;
};

// 创建需求
export const createDemand = async (data: Omit<Demand, 'id' | 'createdAt' | 'updatedAt'>): Promise<Demand> => {
  const response = await api.post('/execution/demands', data);
  return response.data;
};

// 更新需求
export const updateDemand = async (id: number, data: Partial<Demand>): Promise<Demand> => {
  const response = await api.put(`/execution/demands/${id}`, data);
  return response.data;
};

// 删除需求
export const deleteDemand = async (id: number): Promise<void> => {
  const response = await api.delete(`/execution/demands/${id}`);
  return response.data;
};

// 获取需求详情
export const getDemandById = async (id: number): Promise<Demand> => {
  const response = await api.get(`/execution/demands/${id}`);
  return response.data;
};

// 更新需求状态
export const updateDemandStatus = async (id: number, status: DemandStatus): Promise<Demand> => {
  const response = await api.patch(`/execution/demands/${id}/status?status=${status}`);
  return response.data;
};

// 确认执行需求
export const confirmAndExecuteDemand = async (id: number): Promise<Demand> => {
  const response = await api.patch(`/execution/demands/${id}/confirm-execute`);
  return response.data;
};

// 同步需求
export const syncDemands = async (): Promise<void> => {
  const response = await api.post('/execution/demands/sync');
  return response.data;
}; 