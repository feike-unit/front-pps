import React, { useState, useEffect } from 'react';
import { Avatar, Space, message, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { PageContainer, ProLayout, ProCard } from '@ant-design/pro-components';
import {
  LogoutOutlined,
  UserOutlined,
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

  // 处理用户头像点击事件
  const handleAvatarClick = () => {
    navigate('/profile');
    addTab({
      key: '/profile',
      label: '个人信息',
      icon: <UserOutlined />,
      closable: true,
    });
  };

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
          onClick: handleAvatarClick,
          render: (props, dom) => (
            <Tooltip title="个人信息">
              <div className={styles.userInfo} onClick={handleAvatarClick}>
                {dom}
              </div>
            </Tooltip>
          ),
        }}
        actionsRender={(props) => {
          if (props.isMobile) return [];
          return [
            <Tooltip key="logout" title="退出登录">
              <LogoutOutlined 
                className={styles.actionIcon}
                onClick={handleLogout}
              />
            </Tooltip>,
          ];
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
          title={false}
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