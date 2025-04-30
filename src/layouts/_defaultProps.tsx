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

// 将路由配置转换为 ProLayout 所需的格式
const convertRoutesToProLayoutFormat = (routes: any[]) => {
  return routes.map(route => {
    if (route.metadata?.hideInMenu) {
      return null;
    }

    const result: any = {
      path: route.path,
      name: route.metadata?.label,
      icon: route.metadata?.icon,
    };

    if (route.children) {
      const children = convertRoutesToProLayoutFormat(route.children).filter(Boolean);
      if (children.length > 0) {
        result.routes = children;
      }
    }

    return result;
  }).filter(Boolean);
};

// 获取主布局下的路由
const mainLayoutRoute = routes.find(route => route.path === '/');
const layoutRoutes = mainLayoutRoute?.children || [];

export default {
  route: {
    path: '/',
    routes: convertRoutesToProLayoutFormat(layoutRoutes),
  },
  location: {
    pathname: '/',
  },
  title: 'PPS 管理系统',
  logo: 'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg',
}; 