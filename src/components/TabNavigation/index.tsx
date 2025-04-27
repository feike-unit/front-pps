import React from 'react';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { useTab } from '../../contexts/TabContext';
import { useNavigate } from 'react-router-dom';
import styles from './index.module.css';

const TabNavigation: React.FC = () => {
  const { tabs, activeTab, removeTab, setActiveTab } = useTab();
  const navigate = useNavigate();

  const onChange = (key: string) => {
    setActiveTab(key);
    navigate(key);
  };

  const onEdit: TabsProps['onEdit'] = (targetKey, action) => {
    if (action === 'remove' && typeof targetKey === 'string') {
      removeTab(targetKey);
    }
  };

  return (
    <div className={styles.tabNavigation}>
      <Tabs
        hideAdd
        onChange={onChange}
        activeKey={activeTab}
        type="editable-card"
        onEdit={onEdit}
        items={tabs}
      />
    </div>
  );
};

export default TabNavigation; 