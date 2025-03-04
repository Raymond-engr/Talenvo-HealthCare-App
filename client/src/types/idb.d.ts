// idb.d.ts
declare module 'idb' {
    interface IDBDatabase {
      name: string;
      version: number;
      objectStoreNames: DOMStringList;
      createObjectStore(name: string, options?: { keyPath: string; autoIncrement: boolean }): IDBObjectStore;
      deleteObjectStore(name: string): void;
      transaction(storeNames: string | string[], mode: 'readonly' | 'readwrite'): IDBTransaction;
    }
  
    interface IDBObjectStore {
      name: string;
      keyPath: string | string[];
      autoIncrement: boolean;
      add(value: any, key?: IDBKeyRange): IDBRequest;
      put(value: any, key?: IDBKeyRange): IDBRequest;
      delete(key: IDBKeyRange): IDBRequest;
      get(key: IDBKeyRange): IDBRequest;
      getAll(): IDBRequest;
      getAll(key: IDBKeyRange): IDBRequest;
      openCursor(range?: IDBKeyRange, direction?: 'next' | 'nextunique' | 'prev' | 'prevunique'): IDBRequest;
      openKeyCursor(range?: IDBKeyRange, direction?: 'next' | 'nextunique' | 'prev' | 'prevunique'): IDBRequest;
    }
  
    interface IDBTransaction {
      db: IDBDatabase;
      mode: 'readonly' | 'readwrite';
      objectStoreNames: DOMStringList;
      objectStore(name: string): IDBObjectStore;
      abort(): void;
    }
  
    interface IDBRequest {
      readyState: 'pending' | 'done';
      result: any;
      error: DOMException | null;
      source: IDBObjectStore | IDBIndex | IDBTransaction;
      transaction: IDBTransaction;
      onsuccess: (event: Event) => void;
      onerror: (event: Event) => void;
    }
  
    interface IDBKeyRange {
      lower: any;
      upper: any;
      lowerOpen: boolean;
      upperOpen: boolean;
      includes(key: any): boolean;
    }
  
    interface IDBIndex {
      name: string;
      keyPath: string | string[];
      multiEntry: boolean;
      unique: boolean;
      objectStore: IDBObjectStore;
      get(key: IDBKeyRange): IDBRequest;
      getAll(): IDBRequest;
      getAll(key: IDBKeyRange): IDBRequest;
      openCursor(range?: IDBKeyRange, direction?: 'next' | 'nextunique' | 'prev' | 'prevunique'): IDBRequest;
      openKeyCursor(range?: IDBKeyRange, direction?: 'next' | 'nextunique' | 'prev' | 'prevunique'): IDBRequest;
    }
  
    function openDB(name: string, version: number, callback: (db: IDBDatabase) => void): IDBDatabase;
    function deleteDB(name: string, callback: (db: IDBDatabase) => void): void;
  }
  
  export = idb;