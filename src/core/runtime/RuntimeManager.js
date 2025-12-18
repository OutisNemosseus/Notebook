// runtime/RuntimeManager.js - 统一运行时管理器
// 职责：协调引擎和库的加载/执行

import { getEngine, isLanguageSupported, EngineConfig } from '../engines/index.js';
import { getLibrary, getBundle, resolveLibraryDependencies, LibraryType } from '../libraries/index.js';

/**
 * 运行时配置
 */
export class RuntimeConfig {
  constructor(options = {}) {
    this.language = options.language || 'python';
    this.libraries = options.libraries || [];     // 库名称列表
    this.bundle = options.bundle || null;         // 预定义组合名
    this.setupCode = options.setupCode || '';     // 初始化代码
    this.onStatus = options.onStatus || (() => {});
  }
}

/**
 * 运行时实例
 */
export class Runtime {
  constructor(config) {
    this.config = config instanceof RuntimeConfig ? config : new RuntimeConfig(config);
    this.engine = null;
    this.initialized = false;
  }
  
  /**
   * 初始化运行时
   */
  async init() {
    if (this.initialized) return;
    
    const { language, libraries, bundle, setupCode, onStatus } = this.config;
    
    // 检查语言支持
    if (!isLanguageSupported(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }
    
    // 获取引擎
    onStatus(`Loading ${language} engine...`);
    this.engine = getEngine(language);
    await this.engine.load();
    
    // 收集需要加载的库
    let libsToLoad = [];
    
    // 从 bundle 获取
    if (bundle) {
      const bundleConfig = getBundle(language, bundle);
      if (bundleConfig) {
        libsToLoad = bundleConfig.getAll();
      }
    }
    
    // 添加单独指定的库
    if (libraries.length > 0) {
      const resolvedLibs = resolveLibraryDependencies(language, libraries);
      libsToLoad = [...libsToLoad, ...resolvedLibs];
    }
    
    // 去重
    const libNames = new Set();
    libsToLoad = libsToLoad.filter(lib => {
      if (libNames.has(lib.name)) return false;
      libNames.add(lib.name);
      return true;
    });
    
    // 加载库
    for (const lib of libsToLoad) {
      onStatus(`Loading library: ${lib.name}...`);
      await this._loadLibrary(lib);
    }
    
    // 执行初始化代码
    if (setupCode) {
      onStatus('Running setup code...');
      await this.engine.execute(setupCode);
    }
    
    this.initialized = true;
    onStatus('Ready');
  }
  
  /**
   * 加载单个库
   */
  async _loadLibrary(lib) {
    const loadInfo = lib.getLoadInfo();
    
    switch (loadInfo.type) {
      case 'package':
        // 使用引擎的包加载功能
        await this.engine.loadLibrary(lib);
        break;
        
      case 'source':
        // 执行源代码
        if (lib.sourceCode) {
          await this.engine.execute(lib.sourceCode);
        }
        break;
        
      case 'binary':
        // TODO: 加载二进制
        console.warn('Binary library loading not implemented');
        break;
        
      case 'remote':
        // TODO: 从 CDN 加载
        console.warn('Remote library loading not implemented');
        break;
    }
    
    // 执行库的 setupCode
    if (lib.setupCode) {
      await this.engine.execute(lib.setupCode);
    }
  }
  
  /**
   * 执行代码
   */
  async execute(code) {
    if (!this.initialized) {
      await this.init();
    }
    return await this.engine.execute(code);
  }
  
  /**
   * 获取引擎状态
   */
  getStatus() {
    return this.engine ? this.engine.status : EngineConfig.Status.IDLE;
  }
  
  /**
   * 是否就绪
   */
  isReady() {
    return this.initialized && this.engine && this.engine.isReady();
  }
  
  /**
   * 销毁运行时
   */
  dispose() {
    if (this.engine) {
      this.engine.dispose();
    }
    this.initialized = false;
  }
}

/**
 * 运行时管理器（管理多个运行时实例）
 */
class RuntimeManager {
  constructor() {
    this.runtimes = new Map();
  }
  
  /**
   * 获取或创建运行时
   */
  async getRuntime(config) {
    const key = this._getKey(config);
    
    if (this.runtimes.has(key)) {
      return this.runtimes.get(key);
    }
    
    const runtime = new Runtime(config);
    await runtime.init();
    this.runtimes.set(key, runtime);
    
    return runtime;
  }
  
  /**
   * 创建新的运行时（不缓存）
   */
  createRuntime(config) {
    return new Runtime(config);
  }
  
  /**
   * 生成缓存键
   */
  _getKey(config) {
    const c = config instanceof RuntimeConfig ? config : new RuntimeConfig(config);
    return `${c.language}:${c.bundle || ''}:${c.libraries.sort().join(',')}`;
  }
  
  /**
   * 清除所有运行时
   */
  dispose() {
    for (const runtime of this.runtimes.values()) {
      runtime.dispose();
    }
    this.runtimes.clear();
  }
}

// 导出单例
export const runtimeManager = new RuntimeManager();

// 便捷方法
export async function createPythonRuntime(options = {}) {
  return runtimeManager.createRuntime({
    language: 'python',
    ...options
  });
}

export async function createCRuntime(options = {}) {
  return runtimeManager.createRuntime({
    language: 'c',
    ...options
  });
}

export default RuntimeManager;
