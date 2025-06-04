import api, { PageResponse } from './api';

/**
 * 生产拉线类型定义
 */
export interface Line {
  id: number;
  lineCode: string;
  lineName: string;
  startDate: string;
  worksHour: number;
  deptId: number;
  deptName?: string;
  status: number;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 生产拉线更新类型定义
 */
export interface LineUpdate {
  lineCode?: string;
  lineName?: string;
  startDate?: string; // 投产日期
  worksHour?: number; // 一天工时数(默认24小时)
  deptId?: number;
  status?: number;
  remark?: string;
}

export interface LinePageRequest {
  pageNum: number;
  pageSize: number;
  keyword?: string;
  deptId?: number;
  status?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

// 状态枚举
export enum LineStatus {
  DISABLED = 0, // 禁用
  ENABLED = 1, // 启用
}

// 拉线系数接口
export interface LineCoefficient {
  id?: number;
  lineId: number;
  dayDate: string;
  coefficient: number;
}

// 分页查询拉线列表
export const getLinePage = async (params: LinePageRequest): Promise<PageResponse<Line>> => {
  const response = await api.get<PageResponse<Line>>('/production/lines', { params });
  return response.data;
};

// 创建拉线
export const createLine = async (line: Line): Promise<Line> => {
  const response = await api.post<Line>('/production/lines', line);
  return response.data;
};

// 更新拉线
export const updateLine = async (id: number, line: LineUpdate): Promise<Line> => {
  const response = await api.put<Line>(`/production/lines/${id}`, line);
  return response.data;
};

// 删除拉线
export const deleteLine = async (id: number): Promise<void> => {
  await api.delete(`/production/lines/${id}`);
};

// 获取拉线详情
export const getLineById = async (id: number): Promise<Line> => {
  const response = await api.get<Line>(`/production/lines/${id}`);
  return response.data;
};

// 更新拉线状态
export const updateLineStatus = async (id: number, status: number): Promise<Line> => {
  const response = await api.patch<Line>(`/production/lines/${id}/status`, null, {
    params: { status }
  });
  return response.data;
};

// 根据关键字搜索拉线
export const searchLines = async (keyword: string): Promise<Line[]> => {
  const response = await api.get<Line[]>('/production/capacity-rules/lines/search', {
    params: { keyword }
  });
  return response.data;
};

// 获取拉线系数列表
export const getLineCoefficientsByLineId = async (lineId: number): Promise<LineCoefficient[]> => {
  const response = await api.get<LineCoefficient[]>(`/production/lines/${lineId}/coefficients`);
  return response.data;
};

// 创建拉线系数
export const createLineCoefficient = async (params: Omit<LineCoefficient, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
  await api.post(`/production/lines/${params.lineId}/coefficients`, params);
};

// 更新拉线系数
export const updateLineCoefficient = async (id: number, params: Partial<Omit<LineCoefficient, 'id' | 'lineId' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  await api.put(`/production/lines/coefficients/${id}`, params);
};

// 删除拉线系数
export const deleteLineCoefficient = async (id: number): Promise<void> => {
  await api.delete(`/production/lines/coefficients/${id}`);
};

// 获取所有拉线
export const getAllLines = async (): Promise<Line[]> => {
  const response = await api.get<Line[]>('/production/lines');
  return response.data;
};

// 获取所有启用的拉线
export const getAllEnabledLines = async (): Promise<Line[]> => {
  const response = await api.get<Line[]>('/production/lines/enabled');
  return response.data;
}; 