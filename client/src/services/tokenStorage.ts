import { openDB } from 'idb';

const DB_NAME = 'auth-store';
const STORE_NAME = 'tokens';

class TokenStorage {
  private async getDB() {
    return openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }

  /**
   * Store access token in IndexedDB
   */
  async setTokens(accessToken: string) {
    const db = await this.getDB();
    await db.put(STORE_NAME, accessToken, 'accessToken');
  }

  /**
   * Retrieve access token from IndexedDB
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const db = await this.getDB();
      return db.get(STORE_NAME, 'accessToken');
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  }

  /**
   * Clear all tokens from IndexedDB
   */
  async clearTokens() {
    try {
      const db = await this.getDB();
      await db.clear(STORE_NAME);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }
}

export const tokenStorage = new TokenStorage();