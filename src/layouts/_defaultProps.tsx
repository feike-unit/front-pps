import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  MenuOutlined,
  BankOutlined,
  UserSwitchOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { routes } from '../routes';
import { getCurrentUserMenus } from '../services/menu';
import type { Menu } from '../services/menu';

// 检查路径是否匹配用户菜单
const isPathInUserMenus = (path: string, userMenus: Menu[]): boolean => {
  // 确保路径以/开头
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  // 首页和仪表盘不做过滤
  if (path === '/' || path === '/dashboard') {
    return true;
  }

  // 递归检查路径是否在用户菜单中
  const checkPath = (menus: Menu[]): boolean => {
    return menus.some(menu => {
      // 检查当前菜单的路径
      if (!menu.path) {
        // console.log(`Menu without path:`, menu);
        return false;
      }

      // 将路径标准化（移除末尾的斜杠）
      const normalizedMenuPath = menu.path.replace(/\/$/, '');

      // console.log(`Comparing paths - Menu: ${normalizedMenuPath}, Current: ${path}`);

      // 1. 完全匹配
      if (normalizedMenuPath === path) {
        console.log(`Exact match found for ${path}`);
        return true;
      }

      // 2. 检查是否是父路径
      if (path.startsWith(normalizedMenuPath + '/')) {
        // console.log(`Parent path match found: ${normalizedMenuPath} is parent of ${path}`);
        return true;
      }

      // 3. 检查子菜单
      if (menu.children && menu.children.length > 0) {
        const childMatch = checkPath(menu.children);
        if (childMatch) {
          // console.log(`Child menu match found for ${path}`);
        }
        return childMatch;
      }

      return false;
    });
  };

  const result = checkPath(userMenus);
  // console.log(`Final result for path ${path}: ${result}`);
  return result;
};

// 将路由配置转换为 ProLayout 所需的格式
const convertRoutesToProLayoutFormat = async (routes: any[]) => {
  // 获取用户菜单权限
  let userMenus: Menu[] = [];
  try {
    userMenus = await getCurrentUserMenus();
    console.log('Received user menus:', userMenus);
  } catch (error) {
    console.error('获取用户菜单失败:', error);
    return [];
  }

  // 如果没有获取到用户菜单，返回空数组
  if (!userMenus || userMenus.length === 0) {
    console.log('No user menus available');
    return [];
  }

  const convert = (routes: any[]) => {
    return routes.map(route => {
      // 跳过隐藏的菜单
      if (route.metadata?.hideInMenu) {
        // console.log(`Skipping hidden menu: ${route.path}`);
        return null;
      }

      // 检查路径是否在用户菜单中
      const hasPermission = isPathInUserMenus(route.path, userMenus);
      console.log(`Route ${route.path} permission check: ${hasPermission}`);

      if (!hasPermission) {
        console.log(`No permission for route: ${route.path}`);
        return null;
      }

      const result: any = {
        path: route.path,
        name: route.metadata?.label,
        icon: route.metadata?.icon,
      };

      // 处理子路由
      if (route.children) {
        // console.log(`Processing children for route: ${route.path}`);
        const children = convert(route.children).filter(Boolean);
        if (children.length > 0) {
          result.routes = children;
          // console.log(`Added ${children.length} children to route: ${route.path}`);
        }
      }

      console.log(`Converted route:`, result);
      return result;
    }).filter(Boolean);
  };

  const convertedRoutes = convert(routes);
  console.log('Final converted routes:', convertedRoutes);
  return convertedRoutes;
};

// 获取主布局下的路由
const mainLayoutRoute = routes.find(route => route.path === '/');
const layoutRoutes = mainLayoutRoute?.children || [];

// 由于 convertRoutesToProLayoutFormat 现在是异步的，我们需要一个函数来获取配置
export const getDefaultProps = async () => {
  const menuRoutes = await convertRoutesToProLayoutFormat(layoutRoutes);
  console.log('Final menu routes:', menuRoutes);
  return {
    route: {
      path: '/',
      routes: menuRoutes,
    },
    location: {
      pathname: '/',
    },
    title: '计划管理系统',
    logo: 'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg',
  };
};

// 导出一个默认的空配置，在异步加载完成前使用
export default {
  route: {
    path: '/',
    routes: [],
  },
  location: {
    pathname: '/',
  },
  title: '计划管理系统',
  logo: 'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg',
}; 