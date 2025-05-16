/**
 * Token存储管理工具
 * 使用localStorage实现token的持久化存储
 */

// 存储键名常量
const TOKEN_PREFIX = 'pps_token';
const ACCESS_TOKEN_KEY = `${TOKEN_PREFIX}:accessToken`;
const REFRESH_TOKEN_KEY = `${TOKEN_PREFIX}:refreshToken`;

export interface TokenData {
  accessToken: string;
  refreshToken: string;
}

/**
 * Token存储管理工具类
 */
class TokenStorageManager {
  /**
   * 保存tokens
   * @param tokens 包含access token和refresh token的对象
   */
  setTokens({ accessToken, refreshToken }: TokenData): void {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch (error) {
      console.error('保存tokens失败:', error);
    }
  }

  /**
   * 获取access token
   * @returns access token，如果没有则返回null
   */
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('获取access token失败:', error);
      return null;
    }
  }

  /**
   * 获取refresh token
   * @returns refresh token，如果没有则返回null
   */
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('获取refresh token失败:', error);
      return null;
    }
  }

  /**
   * 清除所有tokens
   */
  clearTokens(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('清除tokens失败:', error);
    }
  }
}

// 导出单例
export const tokenStorage = new TokenStorageManager(); 