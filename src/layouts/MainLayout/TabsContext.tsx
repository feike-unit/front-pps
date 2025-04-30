import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [tabs, setTabs] = useState<TabItem[]>([DEFAULT_TAB]);
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB.key);

  // 添加标签页
  const addTab = (tab: TabItem) => {
    setTabs(prevTabs => {
      const existingTab = prevTabs.find(t => t.key === tab.key);
      if (!existingTab) {
        return [...prevTabs, tab];
      }
      return prevTabs;
    });
    setActiveTab(tab.key);
  };

  // 移除标签页
  const removeTab = (targetKey: string) => {
    setTabs(prevTabs => {
      const targetIndex = prevTabs.findIndex(tab => tab.key === targetKey);
      const newTabs = prevTabs.filter(tab => tab.key !== targetKey);

      // 确保至少保留仪表盘标签
      if (newTabs.length === 0) {
        return [DEFAULT_TAB];
      }

      // 如果删除的是当前标签页，需要切换到其他标签页
      if (targetKey === activeTab) {
        const newActiveKey = newTabs[targetIndex - 1]?.key || newTabs[0].key;
        setActiveTab(newActiveKey);
        navigate(newActiveKey);
      }

      return newTabs;
    });
  };

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