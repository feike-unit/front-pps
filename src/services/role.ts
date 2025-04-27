import api from './api';
import type { PageResponse } from '../types/api';

export interface Role {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoleCreateParams {
  name: string;
  description?: string;
}

export interface RoleUpdateParams extends RoleCreateParams {
  id: number;
}

// 获取角色分页列表
export const getRolePage = async (params: {
  pageNum: number;
  pageSize: number;
  sortField?: string;
  sortOrder?: string;
  keyword?: string;
}) => {
  const response = await api.get<PageResponse<Role>>('/system/roles/page', { params });
  return response.data;
};

// 获取角色列表
export const getRoles = async () => {
  const response = await api.get<Role[]>('/system/roles');
  return response.data || [];
};

// 获取角色详情
export const getRole = async (id: number) => {
  const response = await api.get<Role>(`/system/roles/${id}`);
  return response.data;
};

// 创建角色
export const createRole = async (params: RoleCreateParams) => {
  const response = await api.post<Role>('/system/roles', params);
  return response.data;
};

// 更新角色
export const updateRole = async (params: RoleUpdateParams) => {
  const response = await api.put<Role>(`/system/roles/${params.id}`, params);
  return response.data;
};

// 删除角色
export const deleteRole = async (id: number) => {
  const response = await api.delete<void>(`/system/roles/${id}`);
  return response.data;
};

// 获取角色的菜单ID列表
export const getRoleMenuIds = async (id: number) => {
  const response = await api.get<number[]>(`/system/roles/${id}/menus`);
  return response.data || [];
};

// 分配菜单给角色
export const assignMenusToRole = async (roleId: number, menuIds: number[]) => {
  const response = await api.post<void>(`/system/roles/${roleId}/menus`, { menuIds });
  return response.data;
}; 