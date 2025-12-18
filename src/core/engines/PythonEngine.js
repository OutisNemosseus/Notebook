// engines/PythonEngine.js - Python 执行引擎 (Pyodide)
// 职责：仅负责 Python 代码执行，不涉及 UI

import { BaseEngine, EngineConfig, ExecutionResult } from './EngineInterface.js';

export class PythonEngine extends BaseEngine {
  constructor() {
    super('python');
    this.pyodide = null;
  }
  
  /**
   * 加载 Pyodide 引擎
   */
  async load() {
    if (this.pyodide) return;
    
    this.setStatus(EngineConfig.Status.LOADING);
    
    try {
      // 检查全局 loadPyodide
      if (typeof loadPyodide === 'undefined') {
        throw new Error('Pyodide not loaded. Include pyodide script first.');
      }
      
      this.pyodide = await loadPyodide();
      this.setStatus(EngineConfig.Status.READY);
    } catch (error) {
      this.setStatus(EngineConfig.Status.ERROR);
      throw error;
    }
  }
  
  /**
   * 执行 Python 代码
   * @param {string} code - Python 代码
   * @returns {ExecutionResult}
   */
  async execute(code) {
    if (!this.isReady()) {
      return ExecutionResult.error('Engine not ready');
    }
    
    this.setStatus(EngineConfig.Status.RUNNING);
    const startTime = performance.now();
    
    try {
      // 捕获 stdout/stderr
      await this.pyodide.runPythonAsync(`
import sys
from io import StringIO
__stdout_capture__ = StringIO()
__stderr_capture__ = StringIO()
__old_stdout__ = sys.stdout
__old_stderr__ = sys.stderr
sys.stdout = __stdout_capture__
sys.stderr = __stderr_capture__
`);

      let result;
      let error = null;
      
      try {
        result = await this.pyodide.runPythonAsync(code);
      } catch (e) {
        error = e;
      }
      
      // 获取输出
      const stdout = await this.pyodide.runPythonAsync('__stdout_capture__.getvalue()');
      const stderr = await this.pyodide.runPythonAsync('__stderr_capture__.getvalue()');
      
      // 恢复
      await this.pyodide.runPythonAsync(`
sys.stdout = __old_stdout__
sys.stderr = __old_stderr__
`);

      const executionTime = performance.now() - startTime;
      this.setStatus(EngineConfig.Status.READY);
      
      if (error) {
        return ExecutionResult.error(error.message, { stdout, stderr, executionTime });
      }
      
      // 检查输出类型
      const output = stdout.trim() || (result !== undefined && result !== null ? String(result) : '');
      
      // 检测图片
      if (output.includes('data:image/png;base64,')) {
        const match = output.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/);
        if (match) {
          return ExecutionResult.image(match[0], { stdout, stderr, executionTime });
        }
      }
      
      return ExecutionResult.text(output || '(No output)', { stdout, stderr, executionTime });
      
    } catch (error) {
      this.setStatus(EngineConfig.Status.READY);
      return ExecutionResult.error(error.message, { executionTime: performance.now() - startTime });
    }
  }
  
  /**
   * 加载 Python 库
   * @param {object} libraryConfig - 库配置 { name, packages }
   */
  async loadLibrary(libraryConfig) {
    if (!this.isReady()) {
      throw new Error('Engine not ready');
    }
    
    const { name, packages = [] } = libraryConfig;
    
    if (this.hasLibrary(name)) {
      return; // 已加载
    }
    
    if (packages.length > 0) {
      await this.pyodide.loadPackage(packages);
    }
    
    this.loadedLibraries.add(name);
  }
  
  /**
   * 执行预置代码（用于加载自定义函数）
   */
  async executeSetup(setupCode) {
    if (!this.isReady()) {
      throw new Error('Engine not ready');
    }
    await this.pyodide.runPythonAsync(setupCode);
  }
  
  /**
   * 获取 Python 全局变量
   */
  getGlobal(name) {
    if (!this.pyodide) return null;
    return this.pyodide.globals.get(name);
  }
  
  dispose() {
    super.dispose();
    this.pyodide = null;
  }
}

// 单例
let instance = null;

export function getPythonEngine() {
  if (!instance) {
    instance = new PythonEngine();
  }
  return instance;
}

export default PythonEngine;
