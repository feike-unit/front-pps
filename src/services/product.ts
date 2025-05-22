import api, { PageResponse } from './api';

/**
 * 货品类型定义
 */
export interface Product {
  id?: number;
  productCode: string;
  productName: string;
  model?: string;
  unit?: string;
  productType: number;
  deliveryCycle?: number;
  status: number;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 货品更新类型定义
 */
export interface ProductUpdate {
  productCode?: string;
  productName?: string;
  model?: string;
  unit?: string;
  productType?: number;
  deliveryCycle?: number;
  status?: number;
  remark?: string;
}

export interface ProductPageRequest {
  pageNum: number;
  pageSize: number;
  keyword?: string;
  productType?: number;
  status?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

// 货品类型枚举
export enum ProductType {
  PURCHASE = 1, // 采购件
  SELF_MADE = 2, // 自制件
  OUTSOURCED = 3, // 委外件
}

// 状态枚举
export enum ProductStatus {
  DISABLED = 0, // 禁用
  ENABLED = 1, // 启用
}

// 分页查询货品列表
export const getProductPage = async (params: ProductPageRequest): Promise<PageResponse<Product>> => {
  const response = await api.get<PageResponse<Product>>('/production/products', { params });
  return response.data;
};

// 创建货品
export const createProduct = async (product: Product): Promise<Product> => {
  const response = await api.post<Product>('/production/products', product);
  return response.data;
};

// 更新货品
export const updateProduct = async (id: number, product: ProductUpdate): Promise<Product> => {
  const response = await api.put<Product>(`/production/products/${id}`, product);
  return response.data;
};

// 删除货品
export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete(`/production/products/${id}`);
};

// 获取货品详情
export const getProductById = async (id: number): Promise<Product> => {
  const response = await api.get<Product>(`/production/products/${id}`);
  return response.data;
};


// 根据货品类型获取货品列表
export const getProductsByType = async (productType: number): Promise<Product[]> => {
  const response = await api.get<Product[]>(`/production/products/by-type/${productType}`);
  return response.data;
};

// 更新货品状态
export const updateProductStatus = async (id: number, status: number): Promise<Product> => {
  const response = await api.patch<Product>(`/production/products/${id}/status`, null, {
    params: { status }
  });
  return response.data;
};

// 同步货品
export const syncProducts = async (syncDate: string): Promise<void> => {
  await api.post('/production/products/sync', null, {
    params: { syncDate }
  });
};

// 根据关键字搜索产品
export const searchProducts = async (keyword: string): Promise<Product[]> => {
  const response = await api.get<Product[]>('/production/capacity-rules/products/search', {
    params: { keyword }
  });
  return response.data;
}; 