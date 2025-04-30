import React, { useState, useEffect } from 'react';
import { Avatar, Space, Dropdown, message } from 'antd';
import type { MenuProps } from 'antd';
import { PageContainer, ProLayout, ProCard } from '@ant-design/pro-components';
import {
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import styles from './index.module.css';
import { getProfile, logout } from '../../services/auth';
import { TabsProvider, useTabs } from './TabsContext';
import defaultProps from '../_defaultProps';

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

const MainLayoutContent: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { addTab, activeTab, tabs, removeTab } = useTabs();
  const [pathname, setPathname] = useState(location.pathname);

  // 监听路由变化，更新 pathname
  useEffect(() => {
    setPathname(location.pathname);
  }, [location.pathname]);

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

  const handleLogout = async () => {
    try {
      await logout();
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
    <div
      style={{
        height: '100vh',
      }}
    >
      <ProLayout
        {...defaultProps}
        location={{
          pathname,
        }}
        avatarProps={{
          src: 'https://gw.alipayobjects.com/zos/antfincdn/efFD%24IOql2/weixintupian_20170331104822.jpg',
          size: 'small',
          title: userInfo?.name || userInfo?.username,
          render: (props, dom) => {
            return (
              <Dropdown menu={{ items: userDropdownItems }}>
                <Space className={styles.userInfo}>
                  {dom}
                </Space>
              </Dropdown>
            );
          },
        }}
        menuItemRender={(item, dom) => (
          <div
            onClick={() => {
              const path = item.path || '/dashboard';
              setPathname(path);
              // 从路由元数据中获取标签信息
              if (item.name) {
                addTab({
                  key: path,
                  label: item.name,
                  icon: item.icon,
                  closable: true,
                });
              }
              navigate(path);
            }}
          >
            {dom}
          </div>
        )}
      >
        <PageContainer
          tabList={tabs.map(tab => ({
            key: tab.key,
            tab: (
              <Space>
                {tab.icon}
                {tab.label}
              </Space>
            ),
            closable: tab.closable,
          }))}
          tabProps={{
            activeKey: activeTab,
            onChange: (key) => {
              setPathname(key); // 更新 pathname 以同步菜单选中状态
              navigate(key);
            },
            onEdit: (targetKey, action) => {
              if (action === 'remove' && typeof targetKey === 'string') {
                removeTab(targetKey);
              }
            },
            type: 'editable-card',
            hideAdd: true,
          }}
        >
          <ProCard>
            <Outlet />
          </ProCard>
        </PageContainer>
      </ProLayout>
    </div>
  );
};

const MainLayout: React.FC = () => {
  return (
    <TabsProvider>
      <MainLayoutContent />
    </TabsProvider>
  );
};

export default MainLayout; 