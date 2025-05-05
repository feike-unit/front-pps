import api from './api';

export interface Product {
  id: number;
  productCode: string;
  productName: string;
  model: string;
  unit: string;
  productType: number;
  deliveryCycle: number;
  status: number;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductResponse {
  data: Product[];
  total: number;
}

/**
 * 获取货品列表
 */
export const getProducts = async (params: any): Promise<ProductResponse> => {
  const response = await api.get<ProductResponse>('/production/products', { params });
  return response.data;
};

/**
 * 创建货品
 */
export const createProduct = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
  const response = await api.post<Product>('/production/products', data);
  return response.data;
};

/**
 * 更新货品
 */
export const updateProduct = async (id: number, data: Partial<Product>): Promise<Product> => {
  const response = await api.put<Product>(`/production/products/${id}`, data);
  return response.data;
};

/**
 * 删除货品
 */
export const deleteProduct = async (id: number): Promise<void> => {
  await api.delete(`/production/products/${id}`);
};

/**
 * 更新货品状态
 */
export const updateProductStatus = async (id: number, status: number): Promise<Product> => {
  const response = await api.patch<Product>(`/production/products/${id}/status`, { status });
  return response.data;
}; 