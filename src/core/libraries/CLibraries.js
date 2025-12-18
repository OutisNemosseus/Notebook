// libraries/CLibraries.js - C 预置库配置
// 职责：定义可用的 C 库（预留接口）

import { LibraryConfig, LibraryType, LibraryBundle } from './LibraryInterface.js';

/**
 * 标准库（通常内置）
 */
export const stdio = new LibraryConfig({
  name: 'stdio',
  language: 'c',
  version: 'builtin',
  description: 'Standard I/O library',
  type: LibraryType.PACKAGE,
  packages: []  // 内置
});

export const stdlib = new LibraryConfig({
  name: 'stdlib',
  language: 'c',
  version: 'builtin',
  description: 'Standard library',
  type: LibraryType.PACKAGE,
  packages: []
});

export const math = new LibraryConfig({
  name: 'math',
  language: 'c',
  version: 'builtin',
  description: 'Math library',
  type: LibraryType.PACKAGE,
  packages: [],
  // 编译时需要 -lm
  compilerFlags: ['-lm']
});

/**
 * 第三方库（预编译 WASM）
 */
export const opengl = new LibraryConfig({
  name: 'opengl',
  language: 'c',
  version: '1.0.0',
  description: 'OpenGL ES bindings for WebGL',
  type: LibraryType.BINARY,
  binaryUrl: '/libs/opengl.wasm'  // 需要预编译
});

/**
 * 自定义辅助代码
 */
export const ioHelper = new LibraryConfig({
  name: 'ioHelper',
  language: 'c',
  version: '1.0.0',
  description: 'Custom I/O helper for web environment',
  type: LibraryType.SOURCE,
  sourceCode: `
// 输出到浏览器控制台
#include <emscripten.h>

void web_log(const char* msg) {
    EM_ASM({
        console.log(UTF8ToString($0));
    }, msg);
}
`
});

/**
 * 预定义组合
 */
export const StandardBundle = new LibraryBundle('standard')
  .add(stdio)
  .add(stdlib)
  .add(math);

/**
 * 所有可用的 C 库
 */
export const cLibraries = {
  stdio,
  stdlib,
  math,
  opengl,
  ioHelper
};

export const cBundles = {
  standard: StandardBundle
};

export default cLibraries;
