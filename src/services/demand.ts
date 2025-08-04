import api from './api';
import dayjs from 'dayjs';

// 需求状态枚举
export enum DemandStatus {
    INCOMPLETE = 0,  // 未完成
    COMPLETED = 1,   // 已完成
}

// 需求实体类型
export interface Demand {
    completionStatus: number;
    sortNo: number;
    id?: number;
    parentId?: number;
    productId: number;
    productCode?: string;
    productName?: string;
    productType: number;
    deliveryDate: string;
    onlineTime: string;
    completionTime: string;
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
    bomId?: string;
    parentBomId?: string;
    status: number;
    changeStatus?: number;
    remark?: string;
    createdAt?: string;
    updatedAt?: string;
    children?: Demand[];
    materialStatus?: string;
    totalProductCount?: number;
    totalCompletionCount?: number;
    lineSortNo?: string;
    lineCode?: string;
    lineName?: string;
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
    const response = await api.get('/execution/demands', {params});
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

// 根据业务标识批量撤回排产需求
export const revokeDemandsByBusinessKeys = async (businessKeys: string[]): Promise<void> => {
    const response = await api.delete('/execution/demands/revoke', {
        data: businessKeys,
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.data;
};

export const revokeDemandsByBusinessKeyAndRePlanScope = async (businessKey: string, rePlanScope: Number): Promise<void> => {
    const response = await api.delete(`/execution/demands/revoke/${businessKey}/${rePlanScope}`);
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

// 初始化需求
export const initDemands = async (syncDate: string): Promise<void> => {
    const response = await api.post('/execution/demands/init-demand', null, {
        params: {syncDate},
        timeout: 60000 * 5 // 设置超时时间为5分钟
    });
    return response.data;
};

// 同步需求
export const syncDemands = async (syncDate: string): Promise<void> => {
    const response = await api.post('/execution/demands/sync-change-demand', null, {
        params: {syncDate},
        timeout: 60000 * 5 // 设置超时时间为5分钟
    });
    return response.data;
};

// 同步数量
export const syncCallbackQty = async (syncDate: string): Promise<void> => {
    const response = await api.post('/execution/demands/sync-callback-qty', null, {
        params: {syncDate},
        timeout: 60000 * 5 // 设置超时时间为5分钟
    });
    return response.data;
};

// 会写交期
export const callbackDeliveryTime = async (syncDate: string): Promise<void> => {
    const response = await api.post('/execution/demands/sync-change-demand', null, {
        params: {syncDate},
        timeout: 60000 * 5 // 设置超时时间为5分钟
    });
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
 * @param beforeDemandId 排在指定需求之前
 * @param rePlanScope 影响范围 0: 仅排产不影响其他计划, 1: 重新计算影响的其他计划
 */
export const schedulerDemands = async (
    demandIds: number[],
    lineId: number,
    coefficient: number = 1,
    beforeDemandId?: number,
    rePlanScope: number = 0
): Promise<void> => {
    const response = await api.patch<void>('/execution/demands/scheduler', {
        demandIds,
        lineId,
        coefficient,
        beforeDemandId,
        rePlanScope
    }, {
        timeout: 60000 * 5 // 设置排产接口超时时间为5分钟
    });
    return response.data;
};

/**
 * 执行插单计划
 * @param demandIds 需求ID列表
 * @param lineId 生产拉线ID
 * @param coefficient 产能系数
 * @param beforeDemandId 排在指定需求之前
 * @param rePlanScope 影响范围 0: 仅插单不影响其他计划, 1: 重新计算影响的其他计划
 */
export const insertOrderDemands = async (
    demandIds: number[],
    lineId: number,
    coefficient: number = 1,
    beforeDemandId?: number,
    rePlanScope: number = 0
): Promise<void> => {
    const response = await api.post<void>('/execution/demands/insert-order', {
        demandIds,
        lineId,
        coefficient,
        beforeDemandId,
        rePlanScope
    }, {
        timeout: 60000 * 5 // 设置插单接口超时时间为5分钟
    });
    return response.data;
}; 