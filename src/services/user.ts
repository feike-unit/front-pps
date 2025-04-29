import api from './api';
import { ApiResponse } from '../types/api';
import type { Department } from './department';

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
  pageNum: number;
  pageSize: number;
  total: number;
  pages: number;
  list: T[];
  first: boolean;
  last: boolean;
}

export interface UserInfo {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  status: number;
  roles: string[];
}

export interface UserProfileUpdateDto {
  name: string;
  email: string;
  phone: string;
}

export interface PasswordUpdateDto {
  oldPassword: string;
  newPassword: string;
}

// 获取用户列表（分页）
export const getUsers = async (params: { 
  pageNum: number; 
  pageSize: number; 
  keyword?: string;
  sortField?: string;
  sortOrder?: string;
  departmentStatus?: 'all' | 'in' | 'out';
}): Promise<PageResponse<User>> => {
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

// 批量删除用户
export const deleteUsers = async (ids: number[]) => {
  const response = await api.delete('/system/users/batch', { data: ids });
  return response.data;
};

// 修改密码
export const changePassword = async (oldPassword: string, newPassword: string) => {
  const response = await api.put('/system/users/password', { oldPassword, newPassword });
  return response.data;
};

// 重置用户密码
export const resetPassword = async (id: number, password: string) => {
  const response = await api.put(`/system/users/${id}/password/reset`, { newPassword: password });
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

/**
 * 获取当前用户个人信息
 */
export async function getUserInfo() {
  const response = await api.get<UserInfo>('/system/users/profile');
  return response;
}

/**
 * 更新当前用户个人信息
 */
export async function updateUserProfile(data: UserProfileUpdateDto) {
  const response = await api.put<UserInfo>('/system/users/profile', data);
  return response;
}

/**
 * 修改当前用户密码
 */
export async function updateUserPassword(data: PasswordUpdateDto) {
  const response = await api.put<void>('/system/users/profile/password', data);
  return response;
}

// 更新用户角色
export async function updateUserRoles(userId: number, roleIds: number[]): Promise<void> {
  return api.put(`/system/users/${userId}/roles`, { roleIds });
}

// 批量分配角色
export async function assignRolesBatch(userIds: number[], roleIds: number[]): Promise<void> {
  return api.put('/system/users/batch/roles', { userIds, roleIds });
}

// 获取用户所属部门
export async function getUserDepartments(userId: number): Promise<Department[]> {
  const response = await api.get<Department[]>(`/system/departments/users/${userId}/departments`);
  return response.data;
}