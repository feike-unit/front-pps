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
    targetDateMark?: number;
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
    purgeQuantity?: number;
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

export const revokeDemandsByBusinessKeyAndRePlanScope = async (businessKey: string, rePlanScope: Number): Promise<void> => {
    const response = await api.delete(`/execution/demands/revoke/${businessKey}/${rePlanScope}`);
    return response.data;
};

// 获取需求详情
export const getDemandById = async (id: number): Promise<Demand> => {
    const response = await api.get(`/execution/demands/${id}`);
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

// 回写交期
export const callbackDeliveryTime = async (syncDate: string): Promise<void> => {
    const response = await api.post('/execution/demands/callback-delivery-time', null, {
        params: {syncDate},
        timeout: 60000 * 5 // 设置超时时间为5分钟
    });
    return response.data;
};

// 获取已排产但未完成的需求列表
export const getScheduledDemands = async (lineId: number, planMonth?: string, keyword?: string, planDateStart?: string): Promise<Demand[]> => {
    const response = await api.get<Demand[]>('/execution/demands/scheduled', {
        params: {
            lineId,
            planMonth,
            keyword,
            planDateStart: planDateStart ? dayjs(planDateStart).format('YYYY-MM-DD') : undefined
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
 * @param planMonth 排产月份
 */
export const schedulerDemands = async (
    {demandIds, lineId, coefficient = 1, beforeDemandId, planMonth}: {
        demandIds: number[],
        lineId: number,
        coefficient?: number,
        beforeDemandId?: number,
        planMonth?: string
    }
): Promise<void> => {
    const response = await api.patch<void>('/execution/demands/scheduler', {
        demandIds,
        lineId,
        coefficient,
        beforeDemandId,
        planMonth: planMonth ? dayjs(planMonth).format('YYYY-MM') : undefined
    }, {
        timeout: 60000 * 5 // 设置排产接口超时时间为5分钟
    });
    return response.data;
};

export const schedulerDemandsByTargetDate = async (
    {demandIds, lineId, coefficient = 1, targetPlanDate, beforeDemandId}: {
        demandIds: number[],
        lineId: number,
        coefficient?: number,
        targetPlanDate: string,
        beforeDemandId?: number
    }
): Promise<void> => {
    const response = await api.patch<void>('/execution/demands/scheduler-by-date', {
        demandIds,
        lineId,
        coefficient,
        targetPlanDate: dayjs(targetPlanDate).format('YYYY-MM-DD'),
        beforeDemandId
    }, {
        timeout: 60000 * 5
    });
    return response.data;
};

/**
 * 执行插单计划
 * @param demandIds 需求ID列表
 * @param lineId 生产拉线ID
 * @param coefficient 产能系数
 * @param beforeDemandId 排在指定需求之前
 * @param planMonth 排产月份
 */
export const insertOrderDemands = async (
    {demandIds, lineId, coefficient = 1, beforeDemandId, planMonth}: {
        demandIds: number[],
        lineId: number,
        coefficient?: number,
        beforeDemandId?: number,
        planMonth?: string
    }
): Promise<void> => {
    const response = await api.post<void>('/execution/demands/insert-order', {
        demandIds,
        lineId,
        coefficient,
        beforeDemandId,
        planMonth: planMonth ? dayjs(planMonth).format('YYYY-MM') : undefined
    }, {
        timeout: 60000 * 5 // 设置插单接口超时时间为5分钟
    });
    return response.data;
}; 
