import api, {PageResponse} from './api';

/**
 * 计划任务类型定义
 */
export interface PlanRuntime {
    id: number;
    demandId: number;
    productId: number;
    lineId: number;
    batchCode: string;
    productType: number;
    taskQuantity: number;
    registeredQuantity: number;
    completionQuantity: number;
    onlineTime: string;
    completionTime: string;
    createdBy: number;
    createdAt: string;
    updatedAt: string;

    // 附加字段
    productCode?: string;
    productName?: string;
    lineCode?: string;
    lineName?: string;

    // 关联需求的信息
    businessType?: string;
    businessDocNo?: string;
    customerOrderDocNo?: string;
    customerCode?: string;
}

/**
 * 月度排产占用情况类型定义
 */
export interface MonthlyPlanOccupancy {
    date: string;
    hasPlan: number;
    lineCount: number;
    demandCount: number;
    totalQuantity: number;
    statusDesc: string;
}

/**
 * 计划任务更新类型定义
 */
export interface PlanRuntimeUpdate {
    batchCode?: string;
    taskQuantity?: number;
    registeredQuantity?: number;
    completionQuantity?: number;
    deliveryDateTime?: string;
}

/**
 * 计划任务分页请求参数
 */
export interface PlanRuntimePageRequest {
    pageNum: number;
    pageSize: number;
    demandId?: number;
    productId?: number;
    lineId?: number;
    batchCode?: string;
    productType?: number;
    startAtBegin?: string;
    startAtEnd?: string;
    endAtBegin?: string;
    endAtEnd?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    status?: number
}

// 货品类型枚举
export enum ProductType {
    PURCHASE = 1, // 采购件
    SELF_MADE = 2, // 自制件
    OUTSOURCED = 3, // 委外件
}

// 分页查询计划任务列表
export const getPlanRuntimePage = async (params: PlanRuntimePageRequest): Promise<PageResponse<PlanRuntime>> => {
    const response = await api.get<PageResponse<PlanRuntime>>('/execution/plan-runtimes', {params});
    return response.data;
};

// 创建计划任务
export const createPlanRuntime = async (planRuntime: PlanRuntime): Promise<PlanRuntime> => {
    const response = await api.post<PlanRuntime>('/execution/plan-runtimes', planRuntime);
    return response.data;
};

// 更新计划任务
export const updatePlanRuntime = async (id: number, planRuntime: PlanRuntimeUpdate): Promise<PlanRuntime> => {
    const response = await api.put<PlanRuntime>(`/execution/plan-runtimes/${id}`, planRuntime);
    return response.data;
};

// 删除计划任务
export const deletePlanRuntime = async (id: number): Promise<void> => {
    await api.delete(`/execution/plan-runtimes/${id}`);
};

// 获取计划任务详情
export const getPlanRuntimeById = async (id: number): Promise<PlanRuntime> => {
    const response = await api.get<PlanRuntime>(`/execution/plan-runtimes/${id}`);
    return response.data;
};

// 根据需求ID查询计划任务列表
export const getPlanRuntimesByDemandId = async (demandId: number): Promise<PlanRuntime[]> => {
    const response = await api.get<PlanRuntime[]>(`/execution/plan-runtimes/by-demand/${demandId}`);
    return response.data;
};

// 根据货品类型查询计划任务列表
export const getPlanRuntimesByProductType = async (productType: number): Promise<PlanRuntime[]> => {
    const response = await api.get<PlanRuntime[]>(`/execution/plan-runtimes/by-product-type/${productType}`);
    return response.data;
};

// 查询指定月份的排产占用情况
export const getMonthlyPlanOccupancy = async (year: number, month: number): Promise<MonthlyPlanOccupancy[]> => {
    const response = await api.get<MonthlyPlanOccupancy[]>('/execution/plan-runtimes/monthly-occupancy', {
        params: {year, month}
    });
    return response.data;
};
