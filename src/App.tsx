// 导入必要的React组件和依赖
import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { routes } from './routes';
import './App.css';

// 创建路由实例，使用预定义的路由配置
const router = createBrowserRouter(routes);

// 全局加载指示器组件
// 当路由组件正在加载时显示居中的加载动画
const LoadingIndicator = () => (
  <div className="loading-container">
    <Spin size="large" />
  </div>
);

// 应用程序主组件
// 配置全局的Ant Design中文语言包
// 使用Suspense实现路由懒加载
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