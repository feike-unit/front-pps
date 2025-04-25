import api from './api';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  status: number; // 0-禁用，1-启用
  roles?: string[];
  roleIds?: number[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserCreateParams {
  username: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  status: number;
  roleIds: number[];
}

export interface UserUpdateParams {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  status?: number;
  roleIds?: number[];
}

export interface PageResponse<T> {
  total: number;
  list: T[];
}

// 获取用户列表（分页）
export const getUsers = async (params: { pageNum: number; pageSize: number }) => {
  const response = await api.get<PageResponse<User>>('/system/users', { params });
  return response.data;
};

// 获取用户详情
export const getUser = async (id: number) => {
  const response = await api.get<User>(`/system/users/${id}`);
  return response.data;
};

// 创建用户
export const createUser = async (params: UserCreateParams) => {
  const response = await api.post<User>('/system/users', params);
  return response.data;
};

// 更新用户
export const updateUser = async (params: UserUpdateParams) => {
  const response = await api.put<User>(`/system/users/${params.id}`, params);
  return response.data;
};

// 删除用户
export const deleteUser = async (id: number) => {
  const response = await api.delete(`/system/users/${id}`);
  return response.data;
};

// 修改密码
export const changePassword = async (oldPassword: string, newPassword: string) => {
  const response = await api.put('/system/users/password', { oldPassword, newPassword });
  return response.data;
};

// 重置用户密码
export const resetPassword = async (id: number, password: string) => {
  const response = await api.put(`/system/users/${id}/password/reset`, { password });
  return response.data;
};

// 更新用户状态
export const updateUserStatus = async (id: number, status: number) => {
  const response = await api.put<User>(`/system/users/${id}/status`, { status });
  return response.data;
};

// 获取用户的角色列表
export const getUserRoles = async (id: number) => {
  const response = await api.get<string[]>(`/system/users/${id}/roles`);
  return response.data;
};

// 为用户分配角色
export const assignRolesToUser = async (id: number, roleIds: number[]) => {
  const response = await api.post<string[]>(`/system/users/${id}/roles`, { roleIds });
  return response.data;
};