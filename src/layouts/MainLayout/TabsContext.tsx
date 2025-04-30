import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../utils/db';
import { routeMetadata } from '../../routes';

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

export const TabsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
      label: metadata?.label || tab.label,
      closable: metadata?.closable ?? tab.closable
    };
  };

  // 初始化：从数据库加载标签页状态
  useEffect(() => {
    const initTabs = async () => {
      try {
        const storedTabs = await db.getTabs();
        const storedActiveTab = await db.getActiveTab();
        
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
      db.saveActiveTab(location.pathname);
    }
  }, [location.pathname, tabs, isInitialized]);

  // 添加标签页
  const addTab = async (tab: TabItem) => {
    setTabs(prevTabs => {
      const existingTab = prevTabs.find(t => t.key === tab.key);
      if (!existingTab) {
        const newTabs = [...prevTabs, tab];
        // 保存到数据库时只保存必要的信息
        db.saveTabs(newTabs.map(({ key, label, closable }) => ({ key, label, closable })));
        return newTabs;
      }
      return prevTabs;
    });
    setActiveTab(tab.key);
    db.saveActiveTab(tab.key);
  };

  // 移除标签页
  const removeTab = async (targetKey: string) => {
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
        db.saveActiveTab(newActiveKey);
      }

      // 保存到数据库时只保存必要的信息
      db.saveTabs(newTabs.map(({ key, label, closable }) => ({ key, label, closable })));
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