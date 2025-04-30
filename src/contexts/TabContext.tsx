import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { db } from '../utils/db';
import { routeMetadata } from '../routes';

// 路由到标签页的映射配置
const routeToTabMap: Record<string, { label: string; closable?: boolean }> = {
  '/dashboard': { label: '仪表盘', closable: false },
  '/system/users': { label: '用户管理', closable: true },
  '/system/roles': { label: '角色管理', closable: true },
  '/system/menus': { label: '菜单管理', closable: true },
  '/system/departments': { label: '部门管理', closable: true },
  '/profile': { label: '个人信息', closable: true },
  // 在这里添加其他路由映射
};

// 初始化时打印当前路径
console.log('Current pathname:', window.location.pathname);

// 存储键名常量
const TAB_STORAGE_KEY = 'tabs';
const ACTIVE_TAB_STORAGE_KEY = 'activeTab';

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
  isLoading: boolean;
}

// 从数据库恢复标签页状态
const getStoredTabs = async (): Promise<TabItem[]> => {
  try {
    const storedTabs = await db.getTabs();
    console.log('从数据库获取的原始标签数据:', storedTabs);
    
    // 如果没有存储的标签，返回默认标签
    if (!storedTabs || storedTabs.length === 0) {
      console.log('没有存储的标签，返回默认标签');
      return [{ ...routeMetadata['/dashboard'], key: '/dashboard' }];
    }

    // 过滤掉没有对应 routeMetadata 的标签
    const validTabs = storedTabs.filter(tab => routeMetadata[tab.key]);
    console.log('过滤后的有效标签:', validTabs);

    return validTabs.map(tab => ({
      ...tab,
      icon: routeMetadata[tab.key]?.icon
    }));
  } catch (error) {
    console.error('从数据库读取标签失败:', error);
    return [{ ...routeMetadata['/dashboard'], key: '/dashboard' }];
  }
};

// 从数据库恢复当前活动标签页
const getStoredActiveTab = async (): Promise<string> => {
  try {
    const storedActiveTab = await db.getActiveTab();
    console.log('Retrieved active tab from database:', storedActiveTab);
    return storedActiveTab || '/dashboard';
  } catch (error) {
    console.error('Error reading active tab from database:', error);
    return '/dashboard';
  }
};

const TabContext = createContext<TabContextType | undefined>(undefined);

const DEFAULT_TAB: TabItem = { ...routeMetadata['/dashboard'], key: '/dashboard' };

export const TabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tabs, setTabs] = useState<TabItem[]>([DEFAULT_TAB]);
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB.key);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化加载
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const storedTabs = await getStoredTabs();
        const storedActiveTab = await getStoredActiveTab();
        
        // 确保当前路径的标签页存在
        const currentPath = location.pathname;
        const currentTab = getTabFromPath(currentPath);
        
        if (storedTabs.length > 0) {
          let newTabs = [...storedTabs];
          
          // 如果当前路径有对应的标签页配置且不在已存储的标签页中
          if (currentTab && !storedTabs.find(tab => tab.key === currentPath)) {
            newTabs = [...storedTabs, currentTab];
          }
          
          setTabs(newTabs);
          
          // 设置活动标签页
          if (currentTab) {
            setActiveTab(currentPath);
            await saveState(newTabs, currentPath);
          } else if (storedActiveTab && newTabs.find(tab => tab.key === storedActiveTab)) {
            setActiveTab(storedActiveTab);
            if (currentPath !== storedActiveTab) {
              navigate(storedActiveTab);
            }
          }
        } else {
          // 如果没有存储的标签页，初始化默认标签页
          const initialTabs = [DEFAULT_TAB];
          if (currentTab && currentPath !== '/dashboard') {
            initialTabs.push(currentTab);
          }
          setTabs(initialTabs);
          setActiveTab(currentPath === '/dashboard' ? '/dashboard' : currentPath);
          await saveState(initialTabs, currentPath);
        }
      } catch (error) {
        console.error('初始化标签页失败:', error);
        // 发生错误时设置默认状态
        setTabs([DEFAULT_TAB]);
        setActiveTab(DEFAULT_TAB.key);
      } finally {
        setIsInitialized(true);
        setIsLoading(false);
      }
    };
    
    init();
  }, []);

  // 获取标签页信息
  const getTabFromPath = (path: string): TabItem | null => {
    const metadata = routeMetadata[path];
    return metadata ? {
      key: path,
      ...metadata
    } : null;
  };

  // 保存状态到数据库
  const saveState = async (newTabs: TabItem[], newActiveTab: string) => {
    try {
      console.log('保存到数据库的标签数据:', newTabs);
      await Promise.all([
        db.saveTabs(newTabs),
        db.saveActiveTab(newActiveTab)
      ]);
      console.log('标签数据保存成功');
    } catch (error) {
      console.error('保存标签状态失败:', error);
    }
  };

  // 添加标签页
  const addTab = (tab: TabItem) => {
    if (!tabs.find(t => t.key === tab.key)) {
      const newTabs = [...tabs, tab];
      setTabs(newTabs);
      setActiveTab(tab.key);
      saveState(newTabs, tab.key);
    } else {
      setActiveTab(tab.key);
      saveState(tabs, tab.key);
    }
  };

  // 移除标签页
  const removeTab = async (targetKey: string) => {
    console.log('开始移除标签:', targetKey);
    const targetIndex = tabs.findIndex(tab => tab.key === targetKey);
    const newTabs = tabs.filter(tab => tab.key !== targetKey);

    if (newTabs.length === 0) {
      newTabs.push(DEFAULT_TAB);
    }

    // 如果删除的是当前标签页，需要切换到其他标签页
    let newActiveTab = activeTab;
    if (targetKey === activeTab) {
      newActiveTab = newTabs[targetIndex - 1]?.key || newTabs[0].key;
      setActiveTab(newActiveTab);
      navigate(newActiveTab);
    }
    
    console.log('更新后的标签列表:', newTabs);
    setTabs(newTabs);
    
    // 确保异步操作完成
    try {
      await saveState(newTabs, newActiveTab);
      console.log('标签移除并保存成功');
    } catch (error) {
      console.error('标签移除保存失败:', error);
    }
  };

  // 监听路由变化
  useEffect(() => {
    if (!isInitialized) return;

    const currentPath = location.pathname;
    const currentTab = getTabFromPath(currentPath);
    
    if (currentTab) {
      if (!tabs.find(tab => tab.key === currentPath)) {
        const newTabs = [...tabs, currentTab];
        setTabs(newTabs);
        setActiveTab(currentPath);
        saveState(newTabs, currentPath);
      } else {
        setActiveTab(currentPath);
        saveState(tabs, currentPath);
      }
    }
  }, [location.pathname, isInitialized]);

  if (isLoading) {
    return <div style={{ display: 'none' }} />; // 使用空的 div 而不是 null，避免闪烁
  }

  return (
    <TabContext.Provider value={{ tabs, activeTab, addTab, removeTab, setActiveTab, isLoading }}>
      {children}
    </TabContext.Provider>
  );
};

export const useTab = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTab must be used within a TabProvider');
  }
  return context;
}; 