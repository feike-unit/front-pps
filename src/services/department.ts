import api from './api';
import { ApiResponse } from '../types/api';

export interface Department {
  id: number;
  name: string;
  parentId: number;
  sort: number;
  status: number; // 0-禁用，1-启用
  children?: Department[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DepartmentCreateParams {
  name: string;
  parentId: number;
  sort?: number;
  status: number;
}

export interface DepartmentUpdateParams {
  id: number;
  name: string;
  parentId?: number;
  sort?: number;
  status?: number;
}

// 获取部门树结构
export const getDepartmentTree = async () => {
  const response = await api.get<ApiResponse<Department[]>>('/system/departments/tree');
  return response.data;
};

// 创建部门
export const createDepartment = async (params: DepartmentCreateParams) => {
  const response = await api.post<ApiResponse<Department>>('/system/departments', params);
  return response.data;
};

// 更新部门
export const updateDepartment = async (id: number, params: DepartmentUpdateParams) => {
  const response = await api.put<ApiResponse<Department>>(`/system/departments/${id}`, params);
  return response.data;
};

// 删除部门
export const deleteDepartment = async (id: number) => {
  const response = await api.delete<ApiResponse<void>>(`/system/departments/${id}`);
  return response.data;
};

// 更新部门状态
export const updateDepartmentStatus = async (id: number, status: number) => {
  const response = await api.put<ApiResponse<Department>>(`/system/departments/${id}/status`, { status });
  return response.data;
};

// 分配用户到部门
export const assignUsersToDepartment = async (departmentId: number, userIds: number[]) => {
  const response = await api.put<ApiResponse<void>>(`/system/departments/${departmentId}/users`, { userIds });
  return response.data;
}; 