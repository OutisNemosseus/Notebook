// engines/index.js - 引擎注册表
// 职责：管理所有引擎的注册和获取

import { EngineConfig, EngineFactory, ExecutionResult } from './EngineInterface.js';
import { PythonEngine, getPythonEngine } from './PythonEngine.js';
import { CEngine, getCEngine } from './CEngine.js';
import { JavaEngine, getJavaEngine } from './JavaEngine.js';

/**
 * 引擎注册表
 * 添加新引擎只需在这里注册
 */
const engineRegistry = {
  python: {
    Engine: PythonEngine,
    getInstance: getPythonEngine,
    extensions: ['.py'],
    mimeTypes: ['text/x-python'],
    displayName: 'Python'
  },
  
  c: {
    Engine: CEngine,
    getInstance: getCEngine,
    extensions: ['.c', '.h'],
    mimeTypes: ['text/x-csrc'],
    displayName: 'C'
  },
  
  cpp: {
    Engine: CEngine,  // 复用 C 引擎
    getInstance: (options) => getCEngine({ ...options, language: 'cpp' }),
    extensions: ['.cpp', '.cc', '.cxx', '.hpp'],
    mimeTypes: ['text/x-c++src'],
    displayName: 'C++'
  },
  
  java: {
    Engine: JavaEngine,
    getInstance: getJavaEngine,
    extensions: ['.java'],
    mimeTypes: ['text/x-java'],
    displayName: 'Java'
  }
  
  // 未来扩展：
  // javascript: { ... }
  // rust: { ... }
  // go: { ... }
};

/**
 * 获取引擎实例
 * @param {string} language - 语言类型
 * @param {object} options - 引擎配置
 */
export function getEngine(language, options = {}) {
  const entry = engineRegistry[language.toLowerCase()];
  if (!entry) {
    throw new Error(`Unknown engine: ${language}`);
  }
  return entry.getInstance(options);
}

/**
 * 创建新的引擎实例（非单例）
 */
export function createEngine(language, options = {}) {
  const entry = engineRegistry[language.toLowerCase()];
  if (!entry) {
    throw new Error(`Unknown engine: ${language}`);
  }
  return new entry.Engine(options);
}

/**
 * 检查语言是否支持
 */
export function isLanguageSupported(language) {
  return language.toLowerCase() in engineRegistry;
}

/**
 * 获取支持的语言列表
 */
export function getSupportedLanguages() {
  return Object.keys(engineRegistry);
}

/**
 * 根据文件扩展名获取语言
 */
export function getLanguageByExtension(ext) {
  const extension = ext.startsWith('.') ? ext : '.' + ext;
  for (const [lang, config] of Object.entries(engineRegistry)) {
    if (config.extensions.includes(extension)) {
      return lang;
    }
  }
  return null;
}

/**
 * 获取语言显示名称
 */
export function getLanguageDisplayName(language) {
  const entry = engineRegistry[language.toLowerCase()];
  return entry ? entry.displayName : language;
}

/**
 * 注册新引擎（运行时扩展）
 */
export function registerEngine(language, config) {
  if (engineRegistry[language]) {
    console.warn(`Engine ${language} already registered, overwriting`);
  }
  engineRegistry[language] = config;
}

// 实现 EngineFactory.create
EngineFactory.create = createEngine;

// 导出
export { 
  EngineConfig, 
  ExecutionResult,
  PythonEngine,
  CEngine,
  JavaEngine
};
