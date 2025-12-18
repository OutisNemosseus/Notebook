// highlighters/index.js - 语法高亮注册表
// 解耦设计：添加新语言只需在这里注册

let hljs = null;
let loadedLanguages = new Set();

// 语言注册表 - 添加新语言只需在这里添加
const languageConfig = {
  python: {
    aliases: ['py'],
    loader: async (hljs) => {
      // highlight.js 默认已包含 python
    }
  },
  javascript: {
    aliases: ['js'],
    loader: async (hljs) => {}
  },
  c: {
    aliases: [],
    loader: async (hljs) => {}
  },
  cpp: {
    aliases: ['c++', 'cxx'],
    loader: async (hljs) => {}
  },
  latex: {
    aliases: ['tex'],
    loader: async (hljs) => {}
  },
  markdown: {
    aliases: ['md'],
    loader: async (hljs) => {}
  },
  html: {
    aliases: ['xml'],
    loader: async (hljs) => {}
  },
  css: {
    aliases: [],
    loader: async (hljs) => {}
  },
  json: {
    aliases: [],
    loader: async (hljs) => {}
  }
};

// 加载 highlight.js 核心
async function loadHighlightJS() {
  if (hljs) return hljs;
  
  // 检查是否已通过 CDN 加载
  if (window.hljs) {
    hljs = window.hljs;
    return hljs;
  }
  
  // 动态加载 CDN
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js');
  await loadCSS('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css');
  
  hljs = window.hljs;
  return hljs;
}

// 高亮代码
export async function highlight(code, language) {
  await loadHighlightJS();
  
  if (!language || !hljs.getLanguage(language)) {
    return escapeHtml(code);
  }
  
  try {
    return hljs.highlight(code, { language }).value;
  } catch (e) {
    return escapeHtml(code);
  }
}

// 获取支持的语言列表
export function getSupportedLanguages() {
  return Object.keys(languageConfig);
}

// 检查语言是否支持
export function isLanguageSupported(language) {
  const lang = language.toLowerCase();
  if (languageConfig[lang]) return true;
  
  // 检查别名
  for (const [key, config] of Object.entries(languageConfig)) {
    if (config.aliases.includes(lang)) return true;
  }
  return false;
}

// 辅助函数
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

function loadCSS(href) {
  return new Promise((resolve) => {
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = resolve;
    document.head.appendChild(link);
  });
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export { loadHighlightJS };
