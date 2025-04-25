import api from './api';

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
  // 保存token到localStorage
  if (response.data && response.data.accessToken) {
    localStorage.setItem('token', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
  }
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  // 清除localStorage中的token
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  return response.data;
};

export const refreshToken = async (params: RefreshTokenParams) => {
  const response = await api.post('/auth/refresh', params);
  // 更新localStorage中的token
  if (response.data && response.data.accessToken) {
    localStorage.setItem('token', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
  }
  return response.data;
};

export const getUserInfo = async () => {
  const response = await api.get('/auth/userinfo');
  return response.data;
}; 