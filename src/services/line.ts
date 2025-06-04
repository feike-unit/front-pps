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
  sortOrder?: string;
}

// 状态枚举
export enum LineStatus {
  Disabled = 0,
  Enabled = 1
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