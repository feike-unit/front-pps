import axios from 'axios';
import { refreshToken } from './auth';
import { tokenDB } from '../utils/db';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 标记是否正在刷新token
let isRefreshing = false;
// 存储等待token刷新的请求
let refreshSubscribers: ((token: string) => void)[] = [];

// 执行被挂起的请求
const onRefreshed = (token: string) => {
  refreshSubscribers.map(cb => cb(token));
  refreshSubscribers = [];
};

// 添加被挂起的请求
const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// 请求拦截器
api.interceptors.request.use(
  async (config) => {
    const token = await tokenDB.getAccessToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.log('请求配置错误：', error.message);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const { data } = response;
    // 检查响应数据中是否包含错误信息
    if (data && data.code && data.code !== 200) {
      console.log('操作失败：', data.message || '未知错误');
      return Promise.reject(data);
    }
    return data;
  },
  async (error) => {
    // 确保错误信息显示在控制台，方便调试
    console.log('API Error:', error);

    if (error.response) {
      const { status, data, config } = error.response;
      
      // 获取服务器返回的错误信息
      let errorMessage = '未知错误';
      if (data) {
        errorMessage = data.message || (typeof data === 'string' ? data : JSON.stringify(data));
      }
      
      // 处理不同状态码
      switch (status) {
        case 400:
          console.log('请求参数错误：', errorMessage);
          break;
        case 401:
          // 如果是登录或刷新token接口，则直接返回错误
          if (config.url === '/auth/login' || config.url === '/auth/refresh') {
            console.log('认证失败：', errorMessage);
            await tokenDB.clearTokens();
            window.location.href = '/login';
            return Promise.reject(error);
          }

          // 如果正在刷新token，则将请求添加到队列中
          if (isRefreshing) {
            return new Promise((resolve) => {
              addRefreshSubscriber((token: string) => {
                config.headers['Authorization'] = `Bearer ${token}`;
                resolve(api(config));
              });
            });
          }

          isRefreshing = true;

          try {
            // 尝试刷新token
            const refreshTokenStr = await tokenDB.getRefreshToken();
            if (!refreshTokenStr) {
              throw new Error('No refresh token available');
            }

            const response = await refreshToken({ refreshToken: refreshTokenStr });
            const { accessToken } = response.data;

            // 更新token后重试所有等待的请求
            onRefreshed(accessToken);

            // 重试当前请求
            config.headers['Authorization'] = `Bearer ${accessToken}`;
            return api(config);
          } catch (refreshError) {
            console.log('Token刷新失败：', refreshError);
            await tokenDB.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        case 403:
          console.log('没有权限执行此操作：', errorMessage);
          break;
        case 404:
          console.log('请求的资源不存在：', errorMessage);
          break;
        case 500:
          console.log('服务器内部错误：', errorMessage);
          break;
        default:
          console.log(`请求失败 (${status}): ${errorMessage}`);
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.log('网络错误，无法连接到服务器');
    } else {
      // 请求设置时触发的错误
      console.log('请求错误:', error.message);
    }
    
    // 返回一个被拒绝的Promise，这样调用方可以继续处理错误
    return Promise.reject(error);
  }
);

export default api; 