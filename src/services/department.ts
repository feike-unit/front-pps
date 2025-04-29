import api from './api';
import type { ApiResponse } from './api';

export interface Department {
  id: number;
  name: string;
  parentId: number;
  sort: number;
  status: number; // 0-禁用，1-启用
  createdAt?: string;
  updatedAt?: string;
  children?: Department[];
}

export interface DepartmentCreateDto {
  name: string;
  parentId: number;
  sort: number;
  status: number;
}

export interface DepartmentUpdateDto {
  name?: string;
  parentId?: number;
  sort?: number;
  status?: number;
}

// 获取所有部门（平铺结构）
export const getAllDepartments = async (): Promise<Department[]> => {
  const response = await api.get<Department[]>('/system/departments');
  return response.data;
};

// 根据ID获取部门
export const getDepartmentById = async (id: number): Promise<Department> => {
  const response = await api.get<Department>(`/system/departments/${id}`);
  return response.data;
};

// 创建部门
export const createDepartment = async (params: DepartmentCreateDto): Promise<Department> => {
  const response = await api.post<Department>('/system/departments', params);
  return response.data;
};

// 更新部门
export const updateDepartment = async (id: number, params: DepartmentUpdateDto): Promise<Department> => {
  const response = await api.put<Department>(`/system/departments/${id}`, params);
  return response.data;
};

// 删除部门
export const deleteDepartment = async (id: number): Promise<string> => {
  const response = await api.delete<string>(`/system/departments/${id}`);
  return response.data;
};

// 更新部门状态
export const updateDepartmentStatus = async (id: number, status: number): Promise<Department> => {
  const response = await api.put<Department>(`/system/departments/${id}/status`, { status });
  return response.data;
};

// 获取部门的用户列表
export const getDepartmentUsers = async (id: number): Promise<number[]> => {
  const response = await api.get<number[]>(`/system/departments/${id}/users`);
  return response.data;
};

// 分配用户到部门
export const assignUsersToDepartment = async (id: number, userIds: number[]): Promise<void> => {
  const response = await api.put<void>(`/system/departments/${id}/users`, userIds);
  return response.data;
}; 