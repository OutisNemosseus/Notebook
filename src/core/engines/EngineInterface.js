// engines/EngineInterface.js - 执行引擎接口定义
// 所有引擎必须实现此接口

/**
 * @interface IEngine
 * 
 * 所有执行引擎必须实现以下方法：
 * - load(): 加载引擎
 * - execute(code): 执行代码
 * - loadLibrary(lib): 加载库
 * - isReady(): 检查是否就绪
 * - dispose(): 销毁引擎
 */

/**
 * 引擎配置
 */
export const EngineConfig = {
  // 引擎状态
  Status: {
    IDLE: 'idle',
    LOADING: 'loading',
    READY: 'ready',
    RUNNING: 'running',
    ERROR: 'error'
  },
  
  // 执行结果类型
  ResultType: {
    TEXT: 'text',
    IMAGE: 'image',
    HTML: 'html',
    ERROR: 'error',
    BINARY: 'binary'
  }
};

/**
 * 执行结果标准格式
 */
export class ExecutionResult {
  constructor(type, content, metadata = {}) {
    this.type = type;           // ResultType
    this.content = content;     // 内容
    this.stdout = metadata.stdout || '';
    this.stderr = metadata.stderr || '';
    this.exitCode = metadata.exitCode ?? 0;
    this.executionTime = metadata.executionTime || 0;
  }
  
  static text(content, metadata = {}) {
    return new ExecutionResult(EngineConfig.ResultType.TEXT, content, metadata);
  }
  
  static image(content, metadata = {}) {
    return new ExecutionResult(EngineConfig.ResultType.IMAGE, content, metadata);
  }
  
  static error(message, metadata = {}) {
    return new ExecutionResult(EngineConfig.ResultType.ERROR, message, { ...metadata, exitCode: 1 });
  }
}

/**
 * 引擎基类 - 提供通用功能
 */
export class BaseEngine {
  constructor(name) {
    this.name = name;
    this.status = EngineConfig.Status.IDLE;
    this.loadedLibraries = new Set();
    this._onStatusChange = null;
  }
  
  // 状态管理
  setStatus(status) {
    this.status = status;
    if (this._onStatusChange) {
      this._onStatusChange(status);
    }
  }
  
  onStatusChange(callback) {
    this._onStatusChange = callback;
  }
  
  isReady() {
    return this.status === EngineConfig.Status.READY;
  }
  
  // 子类必须实现的方法
  async load() {
    throw new Error('Subclass must implement load()');
  }
  
  async execute(code) {
    throw new Error('Subclass must implement execute()');
  }
  
  async loadLibrary(libraryConfig) {
    throw new Error('Subclass must implement loadLibrary()');
  }
  
  dispose() {
    this.status = EngineConfig.Status.IDLE;
    this.loadedLibraries.clear();
  }
  
  // 辅助方法
  hasLibrary(name) {
    return this.loadedLibraries.has(name);
  }
}

/**
 * 引擎工厂方法类型定义
 */
export const EngineFactory = {
  /**
   * 创建引擎实例
   * @param {string} type - 引擎类型 ('python' | 'c' | 'cpp' | 'java')
   * @param {object} options - 引擎配置
   * @returns {BaseEngine}
   */
  create: null  // 由 index.js 实现
};
