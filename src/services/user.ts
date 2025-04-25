import api from './api';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  status: number;
  roles?: string[];
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
  password?: string;
  roleIds?: number[];
}

// 获取用户列表
export const getUsers = async () => {
  const response = await api.get('/system/users');
  return response.data;
};

// 获取用户详情
export const getUser = async (id: number) => {
  const response = await api.get(`/system/users/${id}`);
  return response.data;
};

// 创建用户
export const createUser = async (params: UserCreateParams) => {
  const response = await api.post('/system/users', params);
  return response.data;
};

// 更新用户
export const updateUser = async (params: UserUpdateParams) => {
  const response = await api.put(`/system/users/${params.id}`, params);
  return response.data;
};

// 删除用户
export const deleteUser = async (id: number) => {
  const response = await api.delete(`/system/users/${id}`);
  return response.data;
};

// 重置用户密码
export const resetPassword = async (id: number, password: string) => {
  const response = await api.put(`/system/users/${id}/password`, { password });
  return response.data;
};

// 更新用户状态
export const updateUserStatus = async (id: number, status: number) => {
  const response = await api.put(`/system/users/${id}/status`, { status });
  return response.data;
};

// 获取用户的角色列表
export const getUserRoles = async (id: number) => {
  const response = await api.get(`/system/users/${id}/roles`);
  return response.data;
};

// 为用户分配角色
export const assignRolesToUser = async (id: number, roleIds: number[]) => {
  const response = await api.post(`/system/users/${id}/roles`, roleIds);
  return response.data;
};