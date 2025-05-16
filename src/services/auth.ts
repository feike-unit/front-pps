import api from './api';
import { tokenStorage, type TokenData } from '../utils/tokenStorage';

export interface LoginParams {
  username: string;
  password: string;
}

export interface RefreshTokenParams {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
}

export interface UserInfo {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  status: number;
  createdAt: string;
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

// 登录
export const login = async (params: LoginParams): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', params);
  tokenStorage.setTokens({
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
  });
  return response.data;
};

// 登出
export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } finally {
    // 无论请求是否成功，都清除本地token
    tokenStorage.clearTokens();
  }
};

// 刷新token
export const refreshToken = async (params: RefreshTokenParams): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/refresh', params);
  tokenStorage.setTokens({
    accessToken: response.data.accessToken,
    refreshToken: response.data.refreshToken,
  });
  return response.data;
};

// 获取用户信息
export const getProfile = async (): Promise<UserInfo> => {
  const response = await api.get<UserInfo>('/auth/profile');
  return response.data;
};

/**
 * 更新当前用户个人信息
 */
export async function updateUserProfile(data: UserProfileUpdateDto) {
  const response = await api.put<UserInfo>('/auth/profile', data);
  return response.data;
}

/**
 * 修改当前用户密码
 */
export async function updateUserPassword(data: PasswordUpdateDto) {
  const response = await api.put<void>('/auth/profile/password', data);
  return response;
}
