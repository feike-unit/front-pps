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
    startDate: string;
    endDate: string;
    coefficient: number;
    remark?: string;
    timeRanges: TimeRange[];
}

// 查询产能日历
export const queryCapacityCalendars = async (lineId: number | undefined, year: number): Promise<CapacityCalendar[]> => {
    console.log('调用产能日历查询接口:', { lineId, year });
    const url = lineId 
        ? `/production/capacity-calendar?lineId=${lineId}&year=${year}`
        : `/production/capacity-calendar?year=${year}`;
    const response = await api.get<CapacityCalendar[]>(url);
    console.log('产能日历查询接口返回:', response.data);
    return response.data;
};

// 创建产能日历
export const createCapacityCalendar = async (data: Omit<CapacityCalendar, 'id'>): Promise<CapacityCalendar> => {
    console.log('调用创建产能日历接口:', data);
    const response = await api.post<CapacityCalendar>('/production/capacity-calendar', data);
    console.log('创建产能日历接口返回:', response.data);
    return response.data;
};

// 更新产能日历
export const updateCapacityCalendar = async (id: number, data: Omit<CapacityCalendar, 'id'>): Promise<CapacityCalendar> => {
    console.log('调用更新产能日历接口:', { id, data });
    const response = await api.put<CapacityCalendar>(`/production/capacity-calendar/${id}`, data);
    console.log('更新产能日历接口返回:', response.data);
    return response.data;
};

// 删除产能日历
export const deleteCapacityCalendar = async (id: number): Promise<void> => {
    console.log('调用删除产能日历接口:', id);
    const response = await api.delete<void>(`/production/capacity-calendar/${id}`);
    console.log('删除产能日历接口返回:', response.data);
    return response.data;
}; 