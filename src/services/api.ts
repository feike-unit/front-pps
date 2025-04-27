import axios from 'axios';

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
  (error) => {
    // 确保错误信息显示在控制台，方便调试
    console.log('API Error:', error);

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
          console.log('请求参数错误：', errorMessage);
          break;
        case 401:
          // 如果是登录接口，则跳过token清除和重定向
          if (error.config.url !== '/auth/login') {
            console.log('未授权，请重新登录：', errorMessage);
            // 未授权，清除token并跳转到登录页
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
          break;
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