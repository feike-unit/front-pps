import axios from 'axios';
import { message } from 'antd';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    message.error('请求配置错误：' + error.message);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const { data } = response;
    // 检查响应数据中是否包含错误信息
    if (data && data.code && data.code !== 200) {
      message.error(data.message || '操作失败');
      return Promise.reject(data);
    }
    return data;
  },
  (error) => {
    // 确保错误信息显示在控制台，方便调试
    console.error('API Error:', error);

    debugger
    if (error.response) {
      const { status, data } = error.response;
      
      // 获取服务器返回的错误信息
      let errorMessage = '未知错误';
      if (data) {
        errorMessage = data.message || (typeof data === 'string' ? data : JSON.stringify(data));
      }
      
      // 处理不同状态码
      switch (status) {
        case 400:
          message.error(errorMessage || '请求参数错误');
          break;
        case 401:
          message.error(errorMessage || '未授权，请重新登录');
          // 未授权，清除token并跳转到登录页
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          message.error(errorMessage || '没有权限执行此操作');
          break;
        case 404:
          message.error(errorMessage || '请求的资源不存在');
          break;
        case 500:
          message.error(errorMessage || '服务器内部错误');
          break;
        default:
          message.error(errorMessage || `请求失败 (${status})`);
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      message.error('网络错误，无法连接到服务器');
    } else {
      // 请求设置时触发的错误
      message.error(`请求错误: ${error.message}`);
    }
    
    // 返回一个被拒绝的Promise，这样调用方可以继续处理错误
    return Promise.reject(error);
  }
);

export default api; 