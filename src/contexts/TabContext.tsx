import React, { createContext, useContext, useState, ReactNode } from 'react';

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

const TabContext = createContext<TabContextType | undefined>(undefined);

export const TabProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<TabItem[]>([
    { key: '/dashboard', label: '仪表盘', closable: false },
  ]);
  const [activeTab, setActiveTab] = useState('/dashboard');

  const addTab = (tab: TabItem) => {
    if (!tabs.find((t) => t.key === tab.key)) {
      setTabs([...tabs, tab]);
    }
    setActiveTab(tab.key);
  };

  const removeTab = (targetKey: string) => {
    const targetIndex = tabs.findIndex((tab) => tab.key === targetKey);
    const newTabs = tabs.filter((tab) => tab.key !== targetKey);
    
    if (newTabs.length && targetKey === activeTab) {
      const { key } = newTabs[targetIndex === newTabs.length ? targetIndex - 1 : targetIndex];
      setActiveTab(key);
    }
    setTabs(newTabs);
  };

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