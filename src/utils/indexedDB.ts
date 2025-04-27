/**
 * IndexedDB 工具类
 */

interface DBConfig {
  dbName: string;
  version: number;
  stores: {
    name: string;
    keyPath: string;
    indexes?: { name: string; keyPath: string; options?: IDBIndexParameters }[];
  }[];
}

interface StoredItem<T> {
  key: string;
  value: T;
}

class IndexedDBUtil {
  private db: IDBDatabase | null = null;
  private readonly config: DBConfig;

  constructor(config: DBConfig) {
    this.config = config;
  }

  /**
   * 初始化数据库
   */
  public async init(): Promise<void> {
    if (this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => {
        reject(new Error('数据库打开失败'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        this.config.stores.forEach((store) => {
          if (!db.objectStoreNames.contains(store.name)) {
            const objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath });
            
            // 创建索引
            store.indexes?.forEach((index) => {
              objectStore.createIndex(index.name, index.keyPath, index.options);
            });
          }
        });
      };
    });
  }

  /**
   * 添加数据
   */
  public async add<T>(storeName: string, data: StoredItem<T>): Promise<IDBValidKey> {
    await this.checkDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('添加数据失败'));
    });
  }

  /**
   * 更新数据
   */
  public async put<T>(storeName: string, data: StoredItem<T>): Promise<IDBValidKey> {
    await this.checkDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('更新数据失败'));
    });
  }

  /**
   * 删除数据
   */
  public async delete(storeName: string, key: IDBValidKey): Promise<void> {
    await this.checkDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('删除数据失败'));
    });
  }

  /**
   * 查询数据
   */
  public async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    await this.checkDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const data = request.result as StoredItem<T> | undefined;
        resolve(data?.value);
      };
      request.onerror = () => reject(new Error('查询数据失败'));
    });
  }

  /**
   * 获取所有数据
   */
  public async getAll<T>(storeName: string): Promise<T[]> {
    await this.checkDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('获取所有数据失败'));
    });
  }

  /**
   * 清空存储对象
   */
  public async clear(storeName: string): Promise<void> {
    await this.checkDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('清空数据失败'));
    });
  }

  /**
   * 清空所有存储对象
   */
  public async clearAll(): Promise<void> {
    await this.checkDB();
    const promises = this.config.stores.map(store => this.clear(store.name));
    await Promise.all(promises);
  }

  /**
   * 关闭数据库连接
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * 关闭并删除数据库
   */
  public async deleteDatabase(): Promise<void> {
    this.close();
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.config.dbName);
      request.onerror = () => reject(new Error('删除数据库失败'));
      request.onsuccess = () => {
        this.db = null;
        resolve();
      };
    });
  }

  private async checkDB(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }
}

export default IndexedDBUtil; 