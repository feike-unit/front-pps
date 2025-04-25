import { Navigate, RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const Login = lazy(() => import('./pages/Login'));
const MainLayout = lazy(() => import('./layouts/MainLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const ProjectManagement = lazy(() => import('./pages/ProjectManagement'));
// 系统管理
const SystemUserManagement = lazy(() => import('./pages/system/UserManagement'));
const RoleManagement = lazy(() => import('./pages/system/RoleManagement'));
const MenuManagement = lazy(() => import('./pages/system/MenuManagement'));

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'users',
        element: <UserManagement />,
      },
      {
        path: 'projects',
        element: <ProjectManagement />,
      },
      // 系统管理路由
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
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]; 