import api, { PageResponse } from './api';

export interface Line {
    id?: number;
    lineCode: string;
    lineName: string;
    leader?: string;
    phone?: string;
    status: number;
    remark?: string;
    createdAt?: string;
    updatedAt?: string;
  }
  
  export interface LinePageRequest {
    pageNum: number;
    pageSize: number;
    lineCode?: string;
    lineName?: string;
    leader?: string;
    status?: number;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  }
  
  // 状态枚举
  export enum LineStatus {
    DISABLED = 0, // 禁用
    ENABLED = 1, // 启用
  } 

// 分页查询下拉线列表
export const getLinePage = async (params: LinePageRequest): Promise<PageResponse<Line>> => {
  const response = await api.get<PageResponse<Line>>('/production/lines', { params });
  return response.data;
};

// 创建下拉线
export const createLine = async (line: Line): Promise<Line> => {
  const response = await api.post<Line>('/production/lines', line);
  return response.data;
};

// 更新下拉线
export const updateLine = async (id: number, line: Line): Promise<Line> => {
  const response = await api.put<Line>(`/production/lines/${id}`, line);
  return response.data;
};

// 删除下拉线
export const deleteLine = async (id: number): Promise<void> => {
  await api.delete(`/production/lines/${id}`);
};

// 获取下拉线详情
export const getLineById = async (id: number): Promise<Line> => {
  const response = await api.get<Line>(`/production/lines/${id}`);
  return response.data;
};

// 获取所有下拉线
export const getAllLines = async (): Promise<Line[]> => {
  const response = await api.get<Line[]>(`/production/lines/all`);
  return response.data;
};

// 更新下拉线状态
export const updateLineStatus = async (id: number, status: number): Promise<Line> => {
  const response = await api.patch<Line>(`/production/lines/${id}/status`, null, {
    params: { status }
  });
  return response.data;
}; 