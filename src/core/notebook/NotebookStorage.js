// notebook/NotebookStorage.js - 本地存储管理
// 支持 localStorage, IndexedDB, 文件系统

import { Notebook } from './NotebookModel.js';

/**
 * 存储后端类型
 */
export const StorageBackend = {
  LOCAL_STORAGE: 'localStorage',
  INDEXED_DB: 'indexedDB',
  FILE: 'file'
};

/**
 * LocalStorage 存储（简单，小型 notebook）
 */
export class LocalStorageAdapter {
  constructor(prefix = 'notebook_') {
    this.prefix = prefix;
  }
  
  save(notebook) {
    const key = this.prefix + notebook.id;
    localStorage.setItem(key, notebook.serialize());
    this._updateIndex(notebook.id, notebook.title);
  }
  
  load(id) {
    const key = this.prefix + id;
    const data = localStorage.getItem(key);
    if (!data) return null;
    return Notebook.deserialize(data);
  }
  
  delete(id) {
    const key = this.prefix + id;
    localStorage.removeItem(key);
    this._removeFromIndex(id);
  }
  
  list() {
    const indexKey = this.prefix + '_index';
    const index = JSON.parse(localStorage.getItem(indexKey) || '{}');
    return Object.entries(index).map(([id, title]) => ({ id, title }));
  }
  
  _updateIndex(id, title) {
    const indexKey = this.prefix + '_index';
    const index = JSON.parse(localStorage.getItem(indexKey) || '{}');
    index[id] = title;
    localStorage.setItem(indexKey, JSON.stringify(index));
  }
  
  _removeFromIndex(id) {
    const indexKey = this.prefix + '_index';
    const index = JSON.parse(localStorage.getItem(indexKey) || '{}');
    delete index[id];
    localStorage.setItem(indexKey, JSON.stringify(index));
  }
}

/**
 * IndexedDB 存储（大型 notebook，带图片）
 */
export class IndexedDBAdapter {
  constructor(dbName = 'NotebookDB', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }
  
  async init() {
    if (this.db) return;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Notebooks store
        if (!db.objectStoreNames.contains('notebooks')) {
          const store = db.createObjectStore('notebooks', { keyPath: 'id' });
          store.createIndex('title', 'title', { unique: false });
          store.createIndex('updatedAt', 'metadata.updatedAt', { unique: false });
        }
        
        // Assets store (images, files)
        if (!db.objectStoreNames.contains('assets')) {
          const assetStore = db.createObjectStore('assets', { keyPath: 'id' });
          assetStore.createIndex('notebookId', 'notebookId', { unique: false });
        }
      };
    });
  }
  
  async save(notebook) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('notebooks', 'readwrite');
      const store = tx.objectStore('notebooks');
      const request = store.put(notebook.toJSON());
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async load(id) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('notebooks', 'readonly');
      const store = tx.objectStore('notebooks');
      const request = store.get(id);
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(Notebook.fromJSON(request.result));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
  
  async delete(id) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('notebooks', 'readwrite');
      const store = tx.objectStore('notebooks');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async list() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('notebooks', 'readonly');
      const store = tx.objectStore('notebooks');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const notebooks = request.result.map(nb => ({
          id: nb.id,
          title: nb.title,
          updatedAt: nb.metadata?.updatedAt
        }));
        resolve(notebooks);
      };
      request.onerror = () => reject(request.error);
    });
  }
  
  // Asset 管理
  async saveAsset(notebookId, assetId, data, mimeType) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('assets', 'readwrite');
      const store = tx.objectStore('assets');
      const request = store.put({
        id: assetId,
        notebookId,
        data,
        mimeType,
        createdAt: Date.now()
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async loadAsset(assetId) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('assets', 'readonly');
      const store = tx.objectStore('assets');
      const request = store.get(assetId);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

/**
 * 统一存储管理器
 */
export class NotebookStorage {
  constructor(backend = StorageBackend.LOCAL_STORAGE) {
    this.backend = backend;
    
    switch (backend) {
      case StorageBackend.INDEXED_DB:
        this.adapter = new IndexedDBAdapter();
        break;
      case StorageBackend.LOCAL_STORAGE:
      default:
        this.adapter = new LocalStorageAdapter();
    }
  }
  
  async save(notebook) {
    return await this.adapter.save(notebook);
  }
  
  async load(id) {
    return await this.adapter.load(id);
  }
  
  async delete(id) {
    return await this.adapter.delete(id);
  }
  
  async list() {
    return await this.adapter.list();
  }
  
  // 自动保存功能
  startAutoSave(notebook, interval = 30000) {
    this.stopAutoSave();
    
    this._autoSaveTimer = setInterval(async () => {
      await this.save(notebook);
      console.log('Auto-saved notebook:', notebook.id);
    }, interval);
  }
  
  stopAutoSave() {
    if (this._autoSaveTimer) {
      clearInterval(this._autoSaveTimer);
      this._autoSaveTimer = null;
    }
  }
}

/**
 * 文件导入导出
 */
export class FileStorage {
  static async importFile(file) {
    const text = await file.text();
    return Notebook.deserialize(text);
  }
  
  static exportFile(notebook, filename) {
    const json = notebook.serialize();
    const blob = new Blob([json], { type: 'application/json' });
    
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename || `${notebook.title}.notebook`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  
  // 打开文件选择对话框
  static openFilePicker() {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.notebook,.json';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            const notebook = await this.importFile(file);
            resolve(notebook);
          } catch (err) {
            reject(err);
          }
        }
      };
      
      input.click();
    });
  }
}

export default NotebookStorage;
