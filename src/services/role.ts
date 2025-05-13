import api, {PageResponse} from './api';

export interface Role {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  status: number;  // 1: 启用, 0: 禁用
}

export interface RoleCreateParams {
  name: string;
  description?: string;
}

export interface RoleUpdateParams extends RoleCreateParams {
  id: number;
}

export interface RolePageRequest {
  pageNum: number;
  pageSize: number;
  keyword?: string;
  sortField?: string;
  sortOrder?: string;
}

// 获取角色分页列表
export const getRolePage = async (params: RolePageRequest): Promise<PageResponse<Role>> => {
  const response = await api.get<PageResponse<Role>>('/system/roles/page', { params });
  return response.data;
};

// 获取角色列表
export const getRoles = async (): Promise<Role[]> => {
  const response = await api.get<Role[]>('/system/roles');
  return response.data;
};

// 获取角色详情
export const getRole = async (id: number): Promise<Role> => {
  const response = await api.get<Role>(`/system/roles/${id}`);
  return response.data;
};

// 创建角色
export const createRole = async (params: RoleCreateParams): Promise<Role> => {
  const response = await api.post<Role>('/system/roles', params);
  return response.data;
};

// 更新角色
export const updateRole = async (params: RoleUpdateParams): Promise<Role> => {
  const response = await api.put<Role>(`/system/roles/${params.id}`, params);
  return response.data;
};

// 删除角色
export const deleteRole = async (id: number): Promise<void> => {
  const response = await api.delete<void>(`/system/roles/${id}`);
  return response.data;
};

// 获取角色的菜单ID列表
export const getRoleMenuIds = async (id: number): Promise<number[]> => {
  const response = await api.get<number[]>(`/system/roles/${id}/menus`);
  return response.data;
};

// 为角色分配菜单
export const assignMenusToRole = async (roleId: number, menuIds: number[]): Promise<void> => {
  const response = await api.post<void>(`/system/roles/${roleId}/menus`, { menuIds });
  return response.data;
};

// 更新角色状态
export const updateRoleStatus = async (roleId: number, status: number): Promise<void> => {
  const response = await api.put<void>(`/system/roles/${roleId}/status?status=${status}`);
  return response.data;
};