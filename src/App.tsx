import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { routes } from './routes';
import './App.css';

// 创建路由
const router = createBrowserRouter(routes);

// 加载指示器
const LoadingIndicator = () => (
  <div className="loading-container">
    <Spin size="large" />
  </div>
);

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <Suspense fallback={<LoadingIndicator />}>
        <RouterProvider router={router} />
      </Suspense>
    </ConfigProvider>
  );
};

export default App; 