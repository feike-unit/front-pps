import { PageResponse } from './api';
import api from './api';

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

export interface ProductPageRequest {
  pageNum: number;
  pageSize: number;
  productCode?: string;
  productName?: string;
  productType?: number;
  status?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

// 产品类型枚举
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

// 分页查询产品列表
export const getProductPage = async (params: ProductPageRequest): Promise<PageResponse<Product>> => {
  const response = await api.get<PageResponse<Product>>('/production/products', { params });
  return response.data;
};

// 创建产品
export const createProduct = async (product: Product): Promise<Product> => {
  const response = await api.post<Product>('/production/products', product);
  return response.data;
};

// 更新产品
export const updateProduct = async (id: number, product: Product): Promise<Product> => {
  const response = await api.put<Product>(`/production/products/${id}`, product);
  return response.data;
};

// 删除产品
export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete(`/production/products/${id}`);
};

// 获取产品详情
export const getProductById = async (id: number): Promise<Product> => {
  const response = await api.get<Product>(`/production/products/${id}`);
  return response.data;
};

// 获取所有产品
export const getAllProducts = async (): Promise<Product[]> => {
  const response = await api.get<Product[]>(`/production/products/all`);
  return response.data;
};

// 根据产品类型获取产品列表
export const getProductsByType = async (productType: number): Promise<Product[]> => {
  const response = await api.get<Product[]>(`/production/products/by-type/${productType}`);
  return response.data;
};

// 更新产品状态
export const updateProductStatus = async (id: number, status: number): Promise<Product> => {
  const response = await api.patch<Product>(`/production/products/${id}/status`, null, {
    params: { status }
  });
  return response.data;
}; 