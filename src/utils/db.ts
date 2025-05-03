import IndexedDBUtil from './indexedDB';
import type { TabItem } from '../contexts/TabContext';

// 存储键名常量
const STORE_NAMES = {
  TOKENS: 'tokens',
  TABS: 'tabs'
} as const;

const KEY_NAMES = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  TABS: 'tabs',
  ACTIVE_TAB: 'activeTab'
} as const;

// 数据库配置
const dbConfig = {
  dbName: 'ppsDB',
  version: 1,
  stores: [
    {
      name: STORE_NAMES.TOKENS,
      keyPath: 'key',
      indexes: [
        { name: 'key', keyPath: 'key', options: { unique: true } }
      ]
    },
    {
      name: STORE_NAMES.TABS,
      keyPath: 'key',
      indexes: [
        { name: 'key', keyPath: 'key', options: { unique: true } }
      ]
    }
  ],
};

export interface TokenData {
  accessToken: string;
  refreshToken: string;
}

class Database {
  private db: IndexedDBUtil;
  private static instance: Database;

  private constructor() {
    this.db = new IndexedDBUtil(dbConfig);
    this.init();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private async init() {
    await this.db.init();
  }

  // Token 相关方法
  async setTokens({ accessToken, refreshToken }: TokenData): Promise<void> {
    try {
      await Promise.all([
        this.db.put(STORE_NAMES.TOKENS, { key: KEY_NAMES.ACCESS_TOKEN, value: accessToken }),
        this.db.put(STORE_NAMES.TOKENS, { key: KEY_NAMES.REFRESH_TOKEN, value: refreshToken })
      ]);
    } catch (error) {
      console.error('Error setting tokens:', error);
      throw error;
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      const token = await this.db.get<string>(STORE_NAMES.TOKENS, KEY_NAMES.ACCESS_TOKEN);
      return token ?? null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      const token = await this.db.get<string>(STORE_NAMES.TOKENS, KEY_NAMES.REFRESH_TOKEN);
      return token ?? null;
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  async clearTokens(): Promise<void> {
    try {
      await this.db.clear(STORE_NAMES.TOKENS);
    } catch (error) {
      console.error('Error clearing tokens:', error);
      throw error;
    }
  }

  // Tab 相关方法
  async saveTabs(tabs: TabItem[], userId: number): Promise<void> {
    try {
      const tabsToSave = tabs.map(tab => ({
        key: tab.key,
        label: tab.label,
        closable: tab.closable
      }));
      await this.db.put(STORE_NAMES.TABS, { key: KEY_NAMES.TABS + '|' + userId, value: tabsToSave });
    } catch (error) {
      console.error('Error saving tabs:', error);
      throw error;
    }
  }

  async getTabs(userId: number): Promise<TabItem[]> {
    try {
      const tabs = await this.db.get<TabItem[]>(STORE_NAMES.TABS, KEY_NAMES.TABS + '|' + userId);
      return tabs ?? [];
    } catch (error) {
      console.error('Error getting tabs:', error);
      return [];
    }
  }

  async saveActiveTab(activeTab: string, userId: number): Promise<void> {
    try {
      await this.db.put(STORE_NAMES.TABS, { key: KEY_NAMES.ACTIVE_TAB + '|' + userId , value: activeTab});
    } catch (error) {
      console.error('Error saving active tab:', error);
      throw error;
    }
  }

  async getActiveTab(userId: number): Promise<string | null> {
    try {
      const activeTab = await this.db.get<string>(STORE_NAMES.TABS, KEY_NAMES.ACTIVE_TAB + '|' + userId);
      return activeTab ?? null;
    } catch (error) {
      console.error('Error getting active tab:', error);
      return null;
    }
  }

  async clearTabs(): Promise<void> {
    try {
      await this.db.clear(STORE_NAMES.TABS);
    } catch (error) {
      console.error('Error clearing tabs:', error);
      throw error;
    }
  }
}

// 导出单例
export const db = Database.getInstance(); 