import api, { PageResponse } from './api';

export interface CapacityRule {
  id?: number;
  lineId: number;
  lineCode?: string;
  lineName?: string;
  productId: number;
  productCode?: string;
  productName?: string;
  worksHourCapacity: number;
  status?: number;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CapacityRuleUpdateDto {
  lineId: number;
  productId: number;
  worksHourCapacity: number;
  status?: number;
  remark?: string;
}

export interface CapacityRulePageRequest {
  lineId?: number;
  productId?: number;
  pageNum: number;
  pageSize: number;
  status?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

// 获取产能规则分页列表
export const getCapacityRulePage = async (params: CapacityRulePageRequest): Promise<PageResponse<CapacityRule>> => {
  const response = await api.get<PageResponse<CapacityRule>>('/production/capacity-rules', { params });
  return response.data;
};

// 创建产能规则
export const createCapacityRule = async (data: CapacityRule): Promise<CapacityRule> => {
  const response = await api.post<CapacityRule>('/production/capacity-rules', data);
  return response.data;
};

// 更新产能规则
export const updateCapacityRule = async (id: number, data: CapacityRuleUpdateDto): Promise<CapacityRule> => {
  const response = await api.put<CapacityRule>(`/production/capacity-rules/${id}`, data);
  return response.data;
};

// 删除产能规则
export const deleteCapacityRule = async (id: number): Promise<void> => {
  await api.delete(`/production/capacity-rules/${id}`);
};

// 获取产能规则详情
export const getCapacityRuleById = async (id: number): Promise<CapacityRule> => {
  const response = await api.get<CapacityRule>(`/production/capacity-rules/${id}`);
  return response.data;
};

// 获取所有产能规则
export const getAllCapacityRules = async (): Promise<CapacityRule[]> => {
  const response = await api.get<CapacityRule[]>('/production/capacity-rules/all');
  return response.data;
};

// 根据拉线ID获取产能规则列表
export const getCapacityRulesByLineId = async (lineId: number): Promise<CapacityRule[]> => {
  const response = await api.get<CapacityRule[]>(`/production/capacity-rules/by-line/${lineId}`);
  return response.data;
};

// 根据货品ID获取产能规则列表
export const getCapacityRulesByProductId = async (productId: number): Promise<CapacityRule[]> => {
  const response = await api.get<CapacityRule[]>(`/production/capacity-rules/by-product/${productId}`);
  return response.data;
};

// 更新产能规则状态
export const updateCapacityRuleStatus = async (id: number, status: number): Promise<void> => {
  await api.patch(`/production/capacity-rules/${id}/status?status=${status}`);
}; 