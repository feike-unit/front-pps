import api from './api';

// 类型定义
export interface TimeRange {
    id?: number;
    startTime: string;
    endTime: string;
    periodName: string;
}

export interface CapacityCalendar {
    id?: number;
    lineId: number;
    startDateTime: string;
    endDateTime: string;
    coefficient: number;
    name: string;
    remark?: string;
}

// 查询产能日历
export const queryCapacityCalendars = async (lineId?: number, year?: number, month?: number): Promise<CapacityCalendar[]> => {
    const response = await api.get<CapacityCalendar[]>('/production/capacity-calendar', {
        params: { lineId, year, month }
    });
    return response.data;
};

// 创建产能日历
export const createCapacityCalendar = async (data: Omit<CapacityCalendar, 'id'>): Promise<CapacityCalendar> => {
    const response = await api.post<CapacityCalendar>('/production/capacity-calendar', data);
    return response.data;
};

// 更新产能日历
export const updateCapacityCalendar = async (id: number, data: Omit<CapacityCalendar, 'id'>): Promise<CapacityCalendar> => {
    const response = await api.put<CapacityCalendar>(`/production/capacity-calendar/${id}`, data);
    return response.data;
};

// 删除产能日历
export const deleteCapacityCalendar = async (id: number): Promise<void> => {
    await api.delete(`/production/capacity-calendar/${id}`);
}; 