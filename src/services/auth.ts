import api from './api';
import { tokenStore } from '../utils/db';

interface LoginParams {
  username: string;
  password: string;
}

interface RefreshTokenParams {
  refreshToken: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
}

class AuthService {
  async login(params: LoginParams): Promise<AuthResponse> {
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', params);
      await tokenStore.setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      return data;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      // 无论请求是否成功，都清除本地token
      await tokenStore.clearTokens();
    }
  }

  async refreshToken(params: RefreshTokenParams): Promise<AuthResponse> {
    try {
      const { data } = await api.post<AuthResponse>('/auth/refresh', params);
      await tokenStore.setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      return data;
    } catch (error) {
      console.error('刷新token失败:', error);
      throw error;
    }
  }

}

export const authService = new AuthService(); 