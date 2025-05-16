/**
 * Tab标签页存储管理工具
 * 使用localStorage实现标签页的持久化存储
 */

// 存储键名常量
const TAB_PREFIX = 'pps_tab';

// 定义TabItem接口
export interface TabItem {
  key: string;
  label: string;
  closable?: boolean;
}

/**
 * Tab标签页存储管理工具类
 */
class TabStorageManager {
  /**
   * 保存标签页列表
   * @param tabs 标签页列表
   * @param userId 用户ID
   */
  saveTabs(tabs: TabItem[], userId: number): void {
    try {
      const tabsToSave = tabs.map(tab => ({
        key: tab.key,
        label: tab.label,
        closable: tab.closable
      }));
      localStorage.setItem(`${TAB_PREFIX}:tabs:${userId}`, JSON.stringify(tabsToSave));
    } catch (error) {
      console.error('保存标签页失败:', error);
    }
  }

  /**
   * 获取标签页列表
   * @param userId 用户ID
   * @returns 标签页列表
   */
  getTabs(userId: number): TabItem[] {
    try {
      const tabsString = localStorage.getItem(`${TAB_PREFIX}:tabs:${userId}`);
      return tabsString ? JSON.parse(tabsString) : [];
    } catch (error) {
      console.error('获取标签页失败:', error);
      return [];
    }
  }

  /**
   * 保存当前激活的标签页
   * @param activeTab 当前激活的标签页key
   * @param userId 用户ID
   */
  saveActiveTab(activeTab: string, userId: number): void {
    try {
      localStorage.setItem(`${TAB_PREFIX}:activeTab:${userId}`, activeTab);
    } catch (error) {
      console.error('保存激活标签页失败:', error);
    }
  }

  /**
   * 获取当前激活的标签页
   * @param userId 用户ID
   * @returns 当前激活的标签页key，如果没有则返回null
   */
  getActiveTab(userId: number): string | null {
    try {
      return localStorage.getItem(`${TAB_PREFIX}:activeTab:${userId}`);
    } catch (error) {
      console.error('获取激活标签页失败:', error);
      return null;
    }
  }

  /**
   * 清除所有标签页数据
   */
  clearTabs(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(TAB_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('清除标签页数据失败:', error);
    }
  }
}

// 导出单例
export const tabStorage = new TabStorageManager(); 