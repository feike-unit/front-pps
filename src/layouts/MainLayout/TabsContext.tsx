import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tabStorage } from '../../utils/tabStorage';
import { routeMetadata } from '../../routes';
import type { UserInfo } from '../../services/user';

// 扩展TabItem类型，添加icon属性
export interface TabItem {
  key: string;
  label: string;
  icon?: ReactNode;
  closable?: boolean;
}

interface TabsContextType {
  tabs: TabItem[];
  activeTab: string;
  addTab: (tab: TabItem) => void;
  removeTab: (targetKey: string) => void;
  setActiveTab: (key: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

const DEFAULT_TAB: TabItem = {
  key: '/dashboard',
  label: '仪表盘',
  closable: false
};

export const TabsProvider: React.FC<{ children: ReactNode, userInfo: UserInfo }> = ({ children, userInfo }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tabs, setTabs] = useState<TabItem[]>([DEFAULT_TAB]);
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB.key);
  const [isInitialized, setIsInitialized] = useState(false);

  // 从路由元数据中恢复图标
  const restoreTabWithMetadata = (tab: TabItem): TabItem => {
    const metadata = routeMetadata[tab.key];
    return {
      ...tab,
      icon: metadata?.icon,
      // 优先使用存储的标签名称，而不是路由元数据中的名称
      label: tab.label || metadata?.label || tab.key.split('/').pop() || '未知页面',
      closable: metadata?.closable ?? tab.closable
    };
  };

  // 初始化：从存储加载标签页状态
  useEffect(() => {
    const initTabs = () => {
      try {
        const storedTabs = tabStorage.getTabs(userInfo.id);
        const storedActiveTab = tabStorage.getActiveTab(userInfo.id);
        
        if (storedTabs.length > 0) {
          // 恢复标签页时添加图标
          const restoredTabs = storedTabs.map(restoreTabWithMetadata);
          setTabs(restoredTabs);
          
          if (storedActiveTab) {
            setActiveTab(storedActiveTab);
            // 如果当前路径不是激活的标签页，则导航到激活的标签页
            if (location.pathname !== storedActiveTab) {
              navigate(storedActiveTab);
            }
          }
        } else {
          // 如果没有存储的标签页，使用默认标签页
          setTabs([restoreTabWithMetadata(DEFAULT_TAB)]);
          if (location.pathname !== DEFAULT_TAB.key) {
            navigate(DEFAULT_TAB.key);
          }
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load tabs:', error);
        setIsInitialized(true);
      }
    };

    initTabs();
  }, []);

  // 监听路由变化，更新激活的标签页
  useEffect(() => {
    if (!isInitialized) return;

    const currentTab = tabs.find(tab => tab.key === location.pathname);
    if (currentTab) {
      setActiveTab(location.pathname);
      tabStorage.saveActiveTab(location.pathname, userInfo.id);
    }
  }, [location.pathname, tabs, isInitialized]);

  // 添加标签页
  const addTab = (tab: TabItem) => {
    setTabs(prevTabs => {
      const existingTab = prevTabs.find(t => t.key === tab.key);
      if (!existingTab) {
        const newTabs = [...prevTabs, tab];
        // 保存到存储时只保存必要的信息
        tabStorage.saveTabs(newTabs.map(({ key, label, closable }) => ({ key, label, closable })), userInfo.id);
        return newTabs;
      }
      return prevTabs;
    });
    setActiveTab(tab.key);
    tabStorage.saveActiveTab(tab.key, userInfo.id);
  };

  // 移除标签页
  const removeTab = (targetKey: string) => {
    setTabs(prevTabs => {
      const targetIndex = prevTabs.findIndex(tab => tab.key === targetKey);
      const newTabs = prevTabs.filter(tab => tab.key !== targetKey);

      // 确保至少保留仪表盘标签
      if (newTabs.length === 0) {
        return [restoreTabWithMetadata(DEFAULT_TAB)];
      }

      // 如果删除的是当前标签页，需要切换到其他标签页
      if (targetKey === activeTab) {
        const newActiveKey = newTabs[targetIndex - 1]?.key || newTabs[0].key;
        setActiveTab(newActiveKey);
        navigate(newActiveKey);
        tabStorage.saveActiveTab(newActiveKey, userInfo.id);
      }

      // 保存到存储时只保存必要的信息
      tabStorage.saveTabs(newTabs.map(({ key, label, closable }) => ({ key, label, closable })), userInfo.id);
      return newTabs;
    });
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <TabsContext.Provider value={{ tabs, activeTab, addTab, removeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
};

export const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabs must be used within a TabsProvider');
  }
  return context;
}; 