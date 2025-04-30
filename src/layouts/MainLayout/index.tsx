import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, theme, Avatar, Space, Dropdown, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
  MenuOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import styles from './index.module.css';
import { getProfile, logout } from '../../services/auth';
import { TabProvider, useTab } from '../../contexts/TabContext';
import TabNavigation from '../../components/TabNavigation';
import { db } from '../../utils/db';

interface Menu {
  id: number;
  name: string;
  path: string;
  component: string;
  icon: string;
  parentId: number;
  type: number;
  permission: string;
  sort: number;
  children?: Menu[];
}

interface UserInfo {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  status: number;
  createdAt: string;
  roles: string[];
}

const { Header, Sider, Content } = Layout;

const MainLayoutContent: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { addTab } = useTab();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const data = await getProfile();
      setUserInfo(data);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      navigate('/login');
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: 'system',
      icon: <SettingOutlined />,
      label: '系统管理',
      children: [
        {
          key: '/system/departments',
          icon: <ApartmentOutlined />,
          label: '部门管理',
        },
        {
          key: '/system/users',
          icon: <UserOutlined />,
          label: '用户管理',
        },
        {
          key: '/system/roles',
          icon: <TeamOutlined />,
          label: '角色管理',
        },
        {
          key: '/system/menus',
          icon: <MenuOutlined />,
          label: '菜单管理',
        },
      ],
    }
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key, domEvent }) => {
    // 获取菜单项的标签文本
    const menuItem = menuItems.flatMap(item => {
      if (item && 'children' in item) {
        return item.children || [];
      }
      return item;
    }).find(item => item?.key === key) as Required<MenuProps>['items'][number];
    
    if (menuItem && 'label' in menuItem && 'icon' in menuItem) {
      addTab({
        key: key as string,
        label: menuItem.label as string,
        icon: menuItem.icon,
        closable: key !== '/dashboard',
      });
    } else if (menuItem && 'label' in menuItem) {
      addTab({
        key: key as string,
        label: menuItem.label as string,
        closable: key !== '/dashboard',
      });
    }
    navigate(key);
  };

  const handleLogout = async () => {
    try {
      // 清除标签页存储
      await db.clearTabs();
      // 执行登出
      await logout();
      // 重定向到登录页
      navigate('/login');
    } catch (error) {
      console.error('登出失败:', error);
      message.error('登出失败');
    }
  };

  const userDropdownItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => {
        navigate('/profile');
      },
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className={styles.logo}>PPS</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['system']}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <Space className={styles.userInfo}>
            {userInfo && (
              <Dropdown menu={{ items: userDropdownItems }} placement="bottomRight">
                <Space style={{ cursor: 'pointer', padding: '0 24px' }}>
                  <Avatar icon={<UserOutlined />} />
                  <span style={{ color: 'rgba(0, 0, 0, 0.85)' }}>{userInfo.name || userInfo.username}</span>
                  {userInfo.roles?.length > 0 && (
                    <span style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '12px' }}>
                      ({userInfo.roles.join(', ')})
                    </span>
                  )}
                </Space>
              </Dropdown>
            )}
          </Space>
        </Header>
        <TabNavigation />
        <Content
          className={styles.contentWrapper}
          style={{
            margin: '24px 16px',
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

const MainLayout: React.FC = () => {
  return (
    <TabProvider>
      <MainLayoutContent />
    </TabProvider>
  );
};

export default MainLayout; 