import { Navigate, RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import React from 'react';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  MenuOutlined,
  BankOutlined,
  UserSwitchOutlined
} from '@ant-design/icons';

// 路由元数据类型
type RouteMetadata = {
  label: string;
  icon: React.ReactNode;
  closable?: boolean;
};

// 扩展路由对象类型
type ExtendedRouteObject = RouteObject & {
  metadata?: RouteMetadata;
  children?: ExtendedRouteObject[];
};

// 路由配置数组
export const routes: ExtendedRouteObject[] = [
  {
    path: '/login',
    element: <Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/Login')))}</Suspense>
  },
  {
    path: '/',
    element: <Suspense fallback={null}>{React.createElement(lazy(() => import('./layouts/MainLayout')))}</Suspense>,
    children: [
      {
        path: '',
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/Dashboard')))}</Suspense>,
        metadata: {
          label: '仪表盘',
          icon: <DashboardOutlined />,
          closable: false
        }
      },
      {
        path: 'system/departments',
        element: <Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/system/DepartmentManagement')))}</Suspense>,
        metadata: {
          label: '部门管理',
          icon: <BankOutlined />,
          closable: true
        }
      },
      {
        path: 'system/users',
        element: <Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/system/UserManagement')))}</Suspense>,
        metadata: {
          label: '用户管理',
          icon: <UserOutlined />,
          closable: true
        }
      },
      {
        path: 'system/roles',
        element: <Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/system/RoleManagement')))}</Suspense>,
        metadata: {
          label: '角色管理',
          icon: <TeamOutlined />,
          closable: true
        }
      },
      {
        path: 'system/menus',
        element: <Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/system/MenuManagement')))}</Suspense>,
        metadata: {
          label: '菜单管理',
          icon: <MenuOutlined />,
          closable: true
        }
      },
      {
        path: 'profile',
        element: <Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/Profile')))}</Suspense>,
        metadata: {
          label: '个人信息',
          icon: <UserSwitchOutlined />,
          closable: true
        }
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
];

// 生成路由元数据
export const routeMetadata = routes.reduce((acc, route) => {
  if (route.children) {
    route.children.forEach(child => {
      if (child.metadata && child.path) {
        acc[`/${child.path}`] = child.metadata;
      }
    });
  }
  return acc;
}, {} as Record<string, RouteMetadata>); 