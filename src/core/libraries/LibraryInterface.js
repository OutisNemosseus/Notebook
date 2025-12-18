// libraries/LibraryInterface.js - 预置库接口定义
// 职责：定义库的标准格式

/**
 * 库配置接口
 * 
 * @interface ILibrary
 * @property {string} name - 库名称
 * @property {string} language - 目标语言
 * @property {string} version - 版本号
 * @property {string[]} dependencies - 依赖的其他库
 * @property {function} setup - 安装/加载方法
 */

/**
 * 库类型
 */
export const LibraryType = {
  PACKAGE: 'package',       // 包管理器安装（pip, npm）
  SOURCE: 'source',         // 源代码注入
  BINARY: 'binary',         // 预编译二进制
  REMOTE: 'remote'          // 远程加载（CDN）
};

/**
 * 库配置基类
 */
export class LibraryConfig {
  constructor(config) {
    this.name = config.name;
    this.language = config.language;
    this.version = config.version || '1.0.0';
    this.description = config.description || '';
    this.type = config.type || LibraryType.PACKAGE;
    this.dependencies = config.dependencies || [];
    
    // 加载配置（根据类型不同）
    this.packages = config.packages || [];      // PACKAGE 类型
    this.sourceCode = config.sourceCode || '';  // SOURCE 类型
    this.binaryUrl = config.binaryUrl || '';    // BINARY 类型
    this.cdnUrl = config.cdnUrl || '';          // REMOTE 类型
    
    // 可选：初始化代码
    this.setupCode = config.setupCode || '';
  }
  
  /**
   * 获取加载此库所需的信息
   */
  getLoadInfo() {
    switch (this.type) {
      case LibraryType.PACKAGE:
        return { type: 'package', packages: this.packages };
      case LibraryType.SOURCE:
        return { type: 'source', code: this.sourceCode };
      case LibraryType.BINARY:
        return { type: 'binary', url: this.binaryUrl };
      case LibraryType.REMOTE:
        return { type: 'remote', url: this.cdnUrl };
      default:
        return null;
    }
  }
}

/**
 * 库集合（预设的库组合）
 */
export class LibraryBundle {
  constructor(name, libraries = []) {
    this.name = name;
    this.libraries = libraries;
  }
  
  add(library) {
    this.libraries.push(library);
    return this;
  }
  
  getAll() {
    return this.libraries;
  }
}
