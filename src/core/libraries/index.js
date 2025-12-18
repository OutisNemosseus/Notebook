// libraries/index.js - 库注册表
// 职责：统一管理所有语言的库

import { LibraryConfig, LibraryType, LibraryBundle } from './LibraryInterface.js';
import { pythonLibraries, pythonBundles } from './PythonLibraries.js';
import { cLibraries, cBundles } from './CLibraries.js';

/**
 * 库注册表 - 按语言分类
 */
const libraryRegistry = {
  python: {
    libraries: pythonLibraries,
    bundles: pythonBundles
  },
  c: {
    libraries: cLibraries,
    bundles: cBundles
  },
  cpp: {
    libraries: cLibraries,  // 复用 C 库
    bundles: cBundles
  },
  java: {
    libraries: {},
    bundles: {}
  }
};

/**
 * 获取指定语言的库
 */
export function getLibrary(language, name) {
  const entry = libraryRegistry[language.toLowerCase()];
  if (!entry) return null;
  return entry.libraries[name] || null;
}

/**
 * 获取指定语言的所有库
 */
export function getLibraries(language) {
  const entry = libraryRegistry[language.toLowerCase()];
  if (!entry) return {};
  return entry.libraries;
}

/**
 * 获取预定义的库组合
 */
export function getBundle(language, name) {
  const entry = libraryRegistry[language.toLowerCase()];
  if (!entry) return null;
  return entry.bundles[name] || null;
}

/**
 * 获取所有组合
 */
export function getBundles(language) {
  const entry = libraryRegistry[language.toLowerCase()];
  if (!entry) return {};
  return entry.bundles;
}

/**
 * 注册新库
 */
export function registerLibrary(language, library) {
  if (!libraryRegistry[language]) {
    libraryRegistry[language] = { libraries: {}, bundles: {} };
  }
  libraryRegistry[language].libraries[library.name] = library;
}

/**
 * 注册新组合
 */
export function registerBundle(language, bundle) {
  if (!libraryRegistry[language]) {
    libraryRegistry[language] = { libraries: {}, bundles: {} };
  }
  libraryRegistry[language].bundles[bundle.name] = bundle;
}

/**
 * 解析库依赖
 * @returns {LibraryConfig[]} 按依赖顺序排列的库列表
 */
export function resolveLibraryDependencies(language, libraryNames) {
  const allLibs = getLibraries(language);
  const resolved = [];
  const visited = new Set();
  
  function visit(name) {
    if (visited.has(name)) return;
    visited.add(name);
    
    const lib = allLibs[name];
    if (!lib) {
      console.warn(`Library not found: ${name}`);
      return;
    }
    
    // 先处理依赖
    for (const dep of lib.dependencies) {
      visit(dep);
    }
    
    resolved.push(lib);
  }
  
  for (const name of libraryNames) {
    visit(name);
  }
  
  return resolved;
}

// 导出
export {
  LibraryConfig,
  LibraryType,
  LibraryBundle,
  pythonLibraries,
  pythonBundles,
  cLibraries,
  cBundles
};
