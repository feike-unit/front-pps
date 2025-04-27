import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface TokenDBSchema extends DBSchema {
  tokens: {
    key: string;
    value: string;
  };
}

interface TokenData {
  accessToken: string;
  refreshToken: string;
}

class TokenStore {
  private dbName = 'ppsDB';
  private version = 1;
  private db: IDBPDatabase<TokenDBSchema> | null = null;

  private async getDB() {
    if (!this.db) {
      this.db = await openDB<TokenDBSchema>(this.dbName, this.version, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('tokens')) {
            db.createObjectStore('tokens');
          }
        },
      });
    }
    return this.db;
  }

  async setTokens({ accessToken, refreshToken }: TokenData): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('tokens', 'readwrite');
    await Promise.all([
      tx.store.put(accessToken, 'accessToken'),
      tx.store.put(refreshToken, 'refreshToken'),
      tx.done,
    ]);
  }

  async getAccessToken(): Promise<string | null> {
    const db = await this.getDB();
    const token = await db.get('tokens', 'accessToken');
    return token ?? null;
  }

  async getRefreshToken(): Promise<string | null> {
    const db = await this.getDB();
    const token = await db.get('tokens', 'refreshToken');
    return token ?? null;
  }

  async clearTokens(): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction('tokens', 'readwrite');
    await Promise.all([
      tx.store.delete('accessToken'),
      tx.store.delete('refreshToken'),
      tx.done,
    ]);
  }
}

export const tokenStore = new TokenStore(); 