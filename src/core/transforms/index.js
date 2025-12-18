// transforms/index.js - 代码转换/执行注册表
// 职责：将代码转换为输出结果

import { getEngine, ExecutionResult } from '../engines/index.js';

// ============================================================
// Markdown 渲染器（含 MathJax 支持）
// ============================================================

let markedLoaded = false;
let mathjaxLoaded = false;

async function loadMarked() {
  if (markedLoaded) return;
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.0/marked.min.js');
  markedLoaded = true;
  window.marked.setOptions({ breaks: true, gfm: true });
}

async function loadMathJax() {
  if (mathjaxLoaded) return;
  window.MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
    },
    svg: { fontCache: 'global' },
    startup: { typeset: false }
  };
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.min.js');
  mathjaxLoaded = true;
}

export async function renderMarkdown(code) {
  await loadMarked();
  await loadMathJax();
  let html = window.marked.parse(code);
  return {
    type: 'html',
    content: html,
    needsMathJax: code.includes('$') || code.includes('\\(') || code.includes('\\[')
  };
}

// ============================================================
// LaTeX/MathJax 渲染器
// ============================================================

export async function renderLatex(code) {
  await loadMathJax();
  const wrappedCode = code.trim().startsWith('\\') ? code : `$$${code}$$`;
  return {
    type: 'html',
    content: `<div class="latex-output">${escapeHtml(wrappedCode)}</div>`,
    needsMathJax: true
  };
}

// ============================================================
// Python 执行器（使用新引擎系统）
// ============================================================

export async function executePython(code) {
  try {
    const engine = getEngine('python');
    
    if (!engine.isReady()) {
      await engine.load();
    }
    
    const result = await engine.execute(code);
    
    // 转换为旧格式（兼容现有代码）
    return {
      type: result.type,
      content: result.content
    };
  } catch (error) {
    return { type: 'error', content: error.message };
  }
}

// ============================================================
// C 执行器（预留）
// ============================================================

export async function executeC(code) {
  try {
    const engine = getEngine('c');
    
    if (!engine.isReady()) {
      await engine.load();
    }
    
    const result = await engine.execute(code);
    return { type: result.type, content: result.content };
  } catch (error) {
    return { type: 'error', content: error.message };
  }
}

// ============================================================
// Java 执行器（预留）
// ============================================================

export async function executeJava(code) {
  try {
    const engine = getEngine('java');
    
    if (!engine.isReady()) {
      await engine.load();
    }
    
    const result = await engine.execute(code);
    return { type: result.type, content: result.content };
  } catch (error) {
    return { type: 'error', content: error.message };
  }
}

// ============================================================
// HTML 预览
// ============================================================

export async function renderHTML(code) {
  return { type: 'html', content: code, needsMathJax: false };
}

// ============================================================
// Transform 注册表
// ============================================================

const transforms = {
  python: {
    name: 'Python',
    execute: executePython,
    outputType: 'console'
  },
  c: {
    name: 'C',
    execute: executeC,
    outputType: 'console'
  },
  cpp: {
    name: 'C++',
    execute: executeC,  // 复用 C 引擎
    outputType: 'console'
  },
  java: {
    name: 'Java',
    execute: executeJava,
    outputType: 'console'
  },
  markdown: {
    name: 'Markdown',
    execute: renderMarkdown,
    outputType: 'html'
  },
  latex: {
    name: 'LaTeX',
    execute: renderLatex,
    outputType: 'html'
  },
  html: {
    name: 'HTML',
    execute: renderHTML,
    outputType: 'html'
  }
};

export function getTransform(language) {
  return transforms[language] || null;
}

export function getSupportedTransforms() {
  return Object.keys(transforms);
}

export async function executeTransform(language, code) {
  const transform = transforms[language];
  if (!transform) {
    throw new Error(`Unsupported language: ${language}`);
  }
  return await transform.execute(code);
}

// ============================================================
// 辅助函数
// ============================================================

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
