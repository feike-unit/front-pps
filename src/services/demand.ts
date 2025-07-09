import { ApiResponse } from './api';
import api from './api';
import dayjs from 'dayjs';

// 需求状态枚举
export enum DemandStatus {
  INCOMPLETE = 0,  // 未完成
  COMPLETED = 1,   // 已完成
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
  planQuantity?: number;
  changePurgeQuantity?: number;
  closePurgeQuantity?: number;
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
  changeStatus?: number;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
  children?: Demand[];
  deliveryDateTime?: string;
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

// 插单计划日期数量类型
export interface DateQuantity {
  insertOrderDate: string;
  quantity: number;
}

// 插单计划请求类型
export interface InsertOrderRequest {
  demandId: number;
  dateQuantityList: DateQuantity[];
  rePlanScope?: number;
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

// 根据业务标识批量删除需求
export const deleteDemandsByBusinessKeys = async (businessKeys: string[]): Promise<void> => {
  const response = await api.delete('/execution/demands', { 
    data: businessKeys,
    headers: {
      'Content-Type': 'application/json'
    }
  });
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

// 同步需求
export const syncDemands = async (): Promise<void> => {
  const response = await api.post('/execution/demands/sync');
  return response.data;
};

// 提交插单计划
export const submitInsertOrder = async (data: InsertOrderRequest): Promise<void> => {
  const response = await api.post('/execution/demands/insert-order', data);
  return response.data;
};

// 获取已排产但未完成的需求列表
export const getScheduledDemands = async (lineId: number, keyword?: string): Promise<Demand[]> => {
  const response = await api.get<Demand[]>('/execution/demands/scheduled', {
    params: {
      lineId,
      startDate: dayjs().format('YYYY-MM-DD'),
      keyword
    }
  });
  return response.data;
};

/**
 * 执行排产计划
 * @param demandIds 需求ID列表
 * @param lineId 生产拉线ID
 * @param coefficient 产能系数
 * @param afterDemandId 排在指定需求之后
 * @param rePlanScope 影响范围 0: 仅排产不影响其他计划, 1: 重新计算影响的其他计划
 */
export const schedulerDemands = async (
  demandIds: number[], 
  lineId: number, 
  coefficient: number = 1,
  afterDemandId?: number,
  rePlanScope: number = 0
): Promise<void> => {
  const response = await api.patch<void>('/execution/demands/scheduler', {
    demandIds,
    lineId,
    coefficient,
    afterDemandId,
    rePlanScope
  }, {
    timeout: 60000 // 设置排产接口超时时间为1分钟
  });
  return response.data;
}; 

/**
 * 执行插单计划
 * @param demandIds 需求ID列表
 * @param lineId 生产拉线ID
 * @param coefficient 产能系数
 * @param afterDemandId 排在指定需求之后
 * @param rePlanScope 影响范围 0: 仅插单不影响其他计划, 1: 重新计算影响的其他计划
 */
export const insertOrderDemands = async (
  demandIds: number[], 
  lineId: number, 
  coefficient: number = 1,
  afterDemandId?: number,
  rePlanScope: number = 0
): Promise<void> => {
  const response = await api.patch<void>('/execution/demands/insert-order', {
    demandIds,
    lineId,
    coefficient,
    afterDemandId,
    rePlanScope
  }, {
    timeout: 60000 // 设置插单接口超时时间为1分钟
  });
  return response.data;
}; 