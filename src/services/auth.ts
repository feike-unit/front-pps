import api from './api';
import { tokenDB } from '../utils/db';

interface LoginParams {
  username: string;
  password: string;
}

interface RefreshTokenParams {
  refreshToken: string;
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

export const login = async (params: LoginParams) => {
  const response = await api.post('/auth/login', params);
  // 保存token到IndexedDB
  if (response.data && response.data.accessToken) {
    await tokenDB.setTokens({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken
    });
  }
  return response;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  // 清除IndexedDB中的token
  await tokenDB.clearTokens();
  return response;
};

export const refreshToken = async (params: RefreshTokenParams) => {
  const response = await api.post('/auth/refresh', params);
  // 更新IndexedDB中的token
  if (response.data && response.data.accessToken) {
    await tokenDB.setTokens({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken
    });
  }
  return response;
};

export const getUserInfo = async () => {
  const response = await api.get('/auth/userinfo');
  return response.data;
}; 