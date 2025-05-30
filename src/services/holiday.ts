import api, { PageResponse } from './api';

/**
 * 节假日类型定义
 */
export interface Holiday {
  id?: number;
  holiday: string;
  holidayName: string;
  status: number;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 节假日更新类型定义
 */
export interface HolidayUpdate {
  holiday?: string;
  holidayName?: string;
  status?: number;
  remark?: string;
}

/**
 * 节假日查询参数
 */
export interface HolidayQuery {
  year?: number;
  month?: number;
  status?: number;
}

export interface HolidayPageRequest {
  pageNum: number;
  pageSize: number;
  keyword?: string;
  enabled?: boolean;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

// 查询节假日列表
export const query = async (params: HolidayQuery): Promise<Holiday[]> => {
  const response = await api.get<Holiday[]>('/production/holidays', { params });
  return response.data;
};

// 获取节假日详情
export const getById = async (id: number): Promise<Holiday> => {
  const response = await api.get<Holiday>(`/production/holidays/${id}`);
  return response.data;
};

// 创建节假日
export const create = async (holiday: Omit<Holiday, 'id' | 'createdAt' | 'updatedAt'>): Promise<Holiday> => {
  const response = await api.post<Holiday>('/production/holidays', holiday);
  return response.data;
};

// 更新节假日
export const update = async (id: number, holiday: HolidayUpdate): Promise<Holiday> => {
  const response = await api.put<Holiday>(`/production/holidays/${id}`, holiday);
  return response.data;
};

// 删除节假日
export const deleteHoliday = async (id: number): Promise<void> => {
  await api.delete(`/production/holidays/${id}`);
};

// 更新节假日状态
export const updateStatus = async (id: number, enabled: boolean): Promise<void> => {
  await api.patch(`/production/holidays/${id}/status`, null, {
    params: { enabled }
  });
};

// 导入节假日
export const importHolidays = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append('file', file);
  await api.post('/production/holidays/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// 下载节假日导入模板
export const downloadTemplate = () => {
  window.open('https://file.yj2025.com/%E8%8A%82%E5%81%87%E6%97%A5%E5%AF%BC%E5%85%A5%E6%A8%A1%E7%89%88.xls', '_blank');
};

// 分页查询节假日列表
export const getHolidayPage = async (params: HolidayPageRequest): Promise<PageResponse<Holiday>> => {
  const response = await api.get<PageResponse<Holiday>>('/production/holidays', { params });
  return response.data;
};

// 获取所有节假日列表
export const listHolidays = async (): Promise<Holiday[]> => {
  const response = await api.get<Holiday[]>('/production/holidays/all');
  return response.data;
};

// 批量更新节假日状态
export const updateHolidaysStatus = async (ids: number[], enabled: boolean): Promise<void> => {
  await api.patch('/production/holidays/batch-status', null, {
    params: { ids: ids.join(','), enabled }
  });
};

// 批量删除节假日
export const deleteHolidays = async (ids: number[]): Promise<void> => {
  await api.delete('/production/holidays/batch', {
    params: { ids: ids.join(',') }
  });
};

// 一键生成指定年度节假日
export const generateHolidays = async (year: number): Promise<Holiday[]> => {
  const response = await api.post<Holiday[]>(`/production/holidays/generate/${year}`);
  return response.data;
};

// 导出节假日
export const exportHolidays = async (params: Partial<HolidayPageRequest>): Promise<Blob> => {
  const response = await api.get('/production/holidays/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
};
