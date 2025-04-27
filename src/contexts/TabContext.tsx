import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import IndexedDBUtil from '../utils/indexedDB';

// 路由到标签页的映射配置
const routeToTabMap: Record<string, { label: string; closable?: boolean }> = {
  '/dashboard': { label: '仪表盘', closable: false },
  '/system/users': { label: '用户管理', closable: true },
  '/system/roles': { label: '角色管理', closable: true },
  '/system/menus': { label: '菜单管理', closable: true },
  '/profile': { label: '个人信息', closable: true },
  // 在这里添加其他路由映射
};

// 初始化时打印当前路径
console.log('Current pathname:', window.location.pathname);

// 创建 IndexedDB 实例
export const indexedDB = new IndexedDBUtil({
  dbName: 'tabsDB',
  version: 1,
  stores: [
    {
      name: 'tabs',
      keyPath: 'key'
    }
  ]
});

// 初始化 IndexedDB
let dbInitPromise = indexedDB.init();

export interface TabItem {
  key: string;
  label: string;
  icon?: ReactNode;
  closable?: boolean;
}

interface TabContextType {
  tabs: TabItem[];
  activeTab: string;
  addTab: (tab: TabItem) => void;
  removeTab: (targetKey: string) => void;
  setActiveTab: (key: string) => void;
}

const TAB_STORAGE_KEY = 'tabs';
const ACTIVE_TAB_STORAGE_KEY = 'activeTab';

// 从 IndexedDB 恢复标签页状态
const getStoredTabs = async (): Promise<TabItem[]> => {
  try {
    const storedTabs = await indexedDB.get<TabItem[]>('tabs', TAB_STORAGE_KEY);
    console.log('Retrieved tabs from IndexedDB:', storedTabs);
    return storedTabs || [{ key: '/dashboard', label: '仪表盘', closable: false }];
  } catch (error) {
    console.error('Error reading tabs from IndexedDB:', error);
    return [{ key: '/dashboard', label: '仪表盘', closable: false }];
  }
};

// 从 IndexedDB 恢复当前活动标签页
const getStoredActiveTab = async (): Promise<string> => {
  try {
    const storedActiveTab = await indexedDB.get<string>('tabs', ACTIVE_TAB_STORAGE_KEY);
    console.log('Retrieved active tab from IndexedDB:', storedActiveTab);
    return storedActiveTab || '/dashboard';
  } catch (error) {
    console.error('Error reading active tab from IndexedDB:', error);
    return '/dashboard';
  }
};

const TabContext = createContext<TabContextType | undefined>(undefined);

export const TabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tabs, setTabs] = useState<TabItem[]>([{ key: '/dashboard', label: '仪表盘', closable: false }]);
  const [activeTab, setActiveTab] = useState('/dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 根据路由路径获取标签页信息
  const getTabFromPath = (path: string): TabItem | null => {
    console.log('Getting tab for path:', path); // 调试日志
    const tabInfo = routeToTabMap[path];
    if (!tabInfo) {
      console.log('No tab info found for path:', path); // 调试日志
      return null;
    }
    return {
      key: path,
      label: tabInfo.label,
      closable: tabInfo.closable
    };
  };

  // 初始化时从 IndexedDB 加载数据
  useEffect(() => {
    const initTabs = async () => {
      try {
        setIsLoading(true);
        await dbInitPromise;
        console.log('Current location:', location.pathname); // 调试日志
        
        const [storedTabs, storedActiveTab] = await Promise.all([
          getStoredTabs(),
          getStoredActiveTab()
        ]);

        console.log('Stored tabs:', storedTabs); // 调试日志
        console.log('Stored active tab:', storedActiveTab); // 调试日志

        // 获取当前路由对应的标签页
        const currentPath = location.pathname;
        const currentTab = getTabFromPath(currentPath);
        
        if (currentTab) {
          // 如果当前路由有对应的标签页配置
          let existingTabs = storedTabs || [{ key: '/dashboard', label: '仪表盘', closable: false }];
          
          // 确保当前路由对应的标签页存在
          if (!existingTabs.find(tab => tab.key === currentPath)) {
            existingTabs = [...existingTabs, currentTab];
          }
          
          console.log('Setting tabs to:', existingTabs); // 调试日志
          setTabs(existingTabs);
          setActiveTab(currentPath);
        } else if (storedTabs && storedTabs.length > 0) {
          // 如果当前路由没有对应的标签页配置，但有存储的标签页
          setTabs(storedTabs);
          // 确保要设置的 activeTab 存在于 tabs 中
          const validActiveTab = storedTabs.find(tab => tab.key === storedActiveTab)
            ? storedActiveTab
            : storedTabs[0].key;
          setActiveTab(validActiveTab);
          if (currentPath !== validActiveTab) {
            navigate(validActiveTab);
          }
        }
      } catch (error) {
        console.error('Error initializing tabs:', error);
      } finally {
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    initTabs();
  }, [location.pathname, navigate]);

  // 监听路由变化
  useEffect(() => {
    if (!isInitialized) return;

    const currentPath = location.pathname;
    console.log('Route changed to:', currentPath); // 调试日志
    
    const currentTab = getTabFromPath(currentPath);
    if (currentTab) {
      if (!tabs.find(tab => tab.key === currentPath)) {
        console.log('Adding new tab for path:', currentPath); // 调试日志
        setTabs(prev => [...prev, currentTab]);
      }
      setActiveTab(currentPath);
    }
  }, [location.pathname, isInitialized, tabs]);

  // 保存标签页状态到 IndexedDB
  useEffect(() => {
    if (!isInitialized) return;

    const saveTabs = async () => {
      try {
        console.log('Saving tabs to IndexedDB:', tabs); // 调试日志
        await indexedDB.put('tabs', { key: TAB_STORAGE_KEY, value: tabs });
      } catch (error) {
        console.error('Error saving tabs to IndexedDB:', error);
      }
    };

    saveTabs();
  }, [tabs, isInitialized]);

  // 保存当前活动标签页到 IndexedDB
  useEffect(() => {
    if (!isInitialized) return;

    const saveActiveTab = async () => {
      try {
        console.log('Saving active tab to IndexedDB:', activeTab); // 调试日志
        await indexedDB.put('tabs', { key: ACTIVE_TAB_STORAGE_KEY, value: activeTab });
      } catch (error) {
        console.error('Error saving active tab to IndexedDB:', error);
      }
    };

    saveActiveTab();
  }, [activeTab, isInitialized]);

  const addTab = (tab: TabItem) => {
    console.log('Adding tab:', tab); // 调试日志
    if (!tabs.find((t) => t.key === tab.key)) {
      setTabs(prev => [...prev, tab]);
    }
    setActiveTab(tab.key);
    navigate(tab.key);
  };

  const removeTab = (targetKey: string) => {
    console.log('Removing tab:', targetKey); // 调试日志
    const targetIndex = tabs.findIndex((tab) => tab.key === targetKey);
    const newTabs = tabs.filter((tab) => tab.key !== targetKey);
    
    if (newTabs.length && targetKey === activeTab) {
      const { key } = newTabs[targetIndex === newTabs.length ? targetIndex - 1 : targetIndex];
      setActiveTab(key);
      navigate(key);
    }
    setTabs(newTabs);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <TabContext.Provider value={{ tabs, activeTab, addTab, removeTab, setActiveTab }}>
      {children}
    </TabContext.Provider>
  );
};

export const useTab = () => {
  const context = useContext(TabContext);
  if (context === undefined) {
    throw new Error('useTab must be used within a TabProvider');
  }
  return context;
}; 