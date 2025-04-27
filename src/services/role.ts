import api from './api';

export interface Role {
  id: number;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleCreateParams {
  name: string;
  description: string;
}

export interface RoleUpdateParams {
  id: number;
  name?: string;
  description?: string;
}

// 获取角色列表
export const getRoles = async () => {
  const response = await api.get('/system/roles');
  return response.data || [];
};

// 获取角色详情
export const getRole = async (id: number) => {
  const response = await api.get(`/system/roles/${id}`);
  return response.data;
};

// 创建角色
export const createRole = async (params: RoleCreateParams) => {
  const response = await api.post('/system/roles', params);
  return response.data;
};

// 更新角色
export const updateRole = async (params: RoleUpdateParams) => {
  const response = await api.put(`/system/roles/${params.id}`, params);
  return response.data;
};

// 删除角色
export const deleteRole = async (id: number) => {
  const response = await api.delete(`/system/roles/${id}`);
  return response.data;
};

// 获取角色的菜单ID列表
export const getRoleMenuIds = async (id: number) => {
  const response = await api.get(`/system/roles/${id}/menus`);
  return response.data || [];
};

// 为角色分配菜单
export const assignMenusToRole = async (id: number, menuIds: number[]) => {
  const response = await api.post(`/system/roles/${id}/menus`, menuIds);
  return response.data;
}; 