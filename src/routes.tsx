import { Navigate, RouteObject } from 'react-router-dom';
import { lazy } from 'react';

// 使用React.lazy懒加载各个页面组件
// 登录页面
const Login = lazy(() => import('./pages/Login'));
// 主布局组件
const MainLayout = lazy(() => import('./layouts/MainLayout'));
// 仪表盘页面
const Dashboard = lazy(() => import('./pages/Dashboard'));
// 项目管理页面
const ProjectManagement = lazy(() => import('./pages/ProjectManagement'));
// 系统管理相关页面
const SystemUserManagement = lazy(() => import('./pages/system/UserManagement'));
const RoleManagement = lazy(() => import('./pages/system/RoleManagement'));
const MenuManagement = lazy(() => import('./pages/system/MenuManagement'));
// 个人信息页面
const Profile = lazy(() => import('./pages/Profile'));

// 路由配置数组
export const routes: RouteObject[] = [
  // 登录路由
  {
    path: '/login',
    element: <Login />,
  },
  // 主应用路由
  {
    path: '/',
    element: <MainLayout />,
    children: [
      // 根路径重定向到仪表盘
      {
        path: '',
        element: <Navigate to="/dashboard" replace />,
      },
      // 仪表盘路由
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      // 项目管理路由
      {
        path: 'projects',
        element: <ProjectManagement />,
      },
      // 系统管理模块路由
      {
        path: 'system/users',
        element: <SystemUserManagement />,
      },
      {
        path: 'system/roles',
        element: <RoleManagement />,
      },
      {
        path: 'system/menus',
        element: <MenuManagement />,
      },
      // 个人信息路由
      {
        path: 'profile',
        element: <Profile />,
      },
    ],
  },
  // 404路由处理 - 重定向到首页
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]; 