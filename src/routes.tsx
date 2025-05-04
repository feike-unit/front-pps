import { Navigate, RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import React from 'react';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  MenuOutlined,
  BankOutlined,
  UserSwitchOutlined,
  SettingOutlined,
  ToolOutlined,
  ApartmentOutlined,
  ShoppingOutlined,
  ProfileOutlined,
  ControlOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

// 路由元数据类型
interface RouteMetadata {
  label?: string;
  icon?: React.ReactNode;
  closable?: boolean;
  hideInMenu?: boolean;
}

// 扩展路由对象类型
export type ExtendedRouteObject = Omit<RouteObject, 'children'> & {
  metadata?: RouteMetadata;
  children?: ExtendedRouteObject[];
};

// 路由配置数组
export const routes: ExtendedRouteObject[] = [
  {
    path: '/login',
    element: <Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/Login')))}</Suspense>,
    metadata: {
      hideInMenu: true
    }
  },
  {
    path: '/',
    element: <Suspense fallback={null}>{React.createElement(lazy(() => import('./layouts/MainLayout')))}</Suspense>,
    metadata: {
      hideInMenu: true
    },
    children: [
      {
        path: '',
        element: <Navigate to="/dashboard" replace />,
        metadata: {
          hideInMenu: true
        }
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
        path: 'production',
        metadata: {
          label: '生产管理',
          icon: <ToolOutlined />
        },
        children: [
          {
            path: 'lines',
            element: <Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/production/LineManagement')))}</Suspense>,
            metadata: {
              label: '拉线管理',
              icon: <ApartmentOutlined />,
              closable: true
            }
          },
          {
            path: 'products',
            element: <Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/production/ProductManagement')))}</Suspense>,
            metadata: {
              label: '货品管理',
              icon: <ShoppingOutlined />,
              closable: true
            }
          },
          {
            path: 'boms',
            element: <Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/production/BomManagement')))}</Suspense>,
            metadata: {
              label: 'BOM管理',
              icon: <ProfileOutlined />,
              closable: true
            }
          },
          {
            path: 'capacity-rules',
            element: <Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/production/CapacityRuleManagement')))}</Suspense>,
            metadata: {
              label: '产能规则',
              icon: <ControlOutlined />,
              closable: true
            }
          }
        ]
      },
      {
        path: 'system',
        metadata: {
          label: '系统管理',
          icon: <SettingOutlined />
        },
        children: [
          {
            path: 'departments',
            element: <Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/system/DepartmentManagement')))}</Suspense>,
            metadata: {
              label: '部门管理',
              icon: <BankOutlined />,
              closable: true
            }
          },
          {
            path: 'users',
            element: <Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/system/UserManagement')))}</Suspense>,
            metadata: {
              label: '用户管理',
              icon: <UserOutlined />,
              closable: true
            }
          },
          {
            path: 'roles',
            element: <Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/system/RoleManagement')))}</Suspense>,
            metadata: {
              label: '角色管理',
              icon: <TeamOutlined />,
              closable: true
            }
          },
          {
            path: 'menus',
            element: <Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/system/MenuManagement')))}</Suspense>,
            metadata: {
              label: '菜单管理',
              icon: <MenuOutlined />,
              closable: true
            }
          }
        ]
      },
      {
        path: 'profile',
        element: <Suspense fallback={null}>{React.createElement(lazy(() => import('./pages/Profile')))}</Suspense>,
        metadata: {
          label: '个人信息',
          icon: <UserSwitchOutlined />,
          closable: true,
          hideInMenu: true
        }
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
    metadata: {
      hideInMenu: true
    }
  }
];

// 生成路由元数据映射
export const generateRouteMetadata = (routes: ExtendedRouteObject[]): Record<string, RouteMetadata> => {
  const metadata: Record<string, RouteMetadata> = {};

  const processRoute = (route: ExtendedRouteObject, parentPath: string = '') => {
    if (!route.path) return;

    // 构建完整路径
    let fullPath = '';
    if (route.path.startsWith('/')) {
      fullPath = route.path;
    } else if (parentPath) {
      fullPath = parentPath === '/' ? `/${route.path}` : `${parentPath}/${route.path}`;
    } else {
      fullPath = `/${route.path}`;
    }

    // 保存元数据
    if (route.metadata) {
      metadata[fullPath] = route.metadata;
    }

    // 处理子路由
    if (route.children) {
      route.children.forEach(child => processRoute(child, fullPath));
    }
  };

  routes.forEach(route => processRoute(route));
  return metadata;
};

// 将路由配置转换为菜单项
export const convertRoutesToMenuItems = (routes: ExtendedRouteObject[]): MenuProps['items'] => {
  const processRoute = (route: ExtendedRouteObject, parentPath: string = ''): any => {
    if (!route.metadata || route.metadata.hideInMenu) return null;
    if (!route.path) return null;

    // 构建完整路径
    let fullPath = '';
    if (route.path.startsWith('/')) {
      fullPath = route.path;
    } else if (parentPath) {
      fullPath = parentPath === '/' ? `/${route.path}` : `${parentPath}/${route.path}`;
    } else {
      fullPath = `/${route.path}`;
    }

    const menuItem: any = {
      key: fullPath,
      icon: route.metadata.icon,
      label: route.metadata.label,
    };

    if (route.children) {
      const childrenItems = route.children
        .map(child => processRoute(child, fullPath))
        .filter(Boolean);

      if (childrenItems.length > 0) {
        menuItem.children = childrenItems;
      }
    }
    return menuItem;
  };

  return routes
    .map(route => processRoute(route))
    .filter(Boolean);
};

export const routeMetadata = generateRouteMetadata(routes); 