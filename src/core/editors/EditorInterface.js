// editors/EditorInterface.js - 编辑器抽象接口
// 所有编辑器实现必须遵循此接口

/**
 * 编辑器接口定义
 * 
 * @interface IEditor
 * @property {function} getValue - 获取编辑器内容
 * @property {function} setValue - 设置编辑器内容
 * @property {function} getSelection - 获取选中内容
 * @property {function} setLanguage - 设置语言模式
 * @property {function} focus - 聚焦编辑器
 * @property {function} dispose - 销毁编辑器
 * @property {function} onDidChangeContent - 内容变化回调
 */

// 编辑器配置
export const EditorConfig = {
  // 主题
  theme: {
    DARK: 'dark',
    LIGHT: 'light'
  },
  
  // 默认配置
  defaults: {
    fontSize: 14,
    tabSize: 2,
    lineNumbers: true,
    wordWrap: true,
    minimap: false
  }
};

// 编辑器工厂 - 根据配置创建不同类型的编辑器
export async function createEditor(container, options = {}) {
  const { 
    type = 'textarea',  // 'textarea' | 'monaco' | 'codemirror'
    language = 'text',
    value = '',
    theme = EditorConfig.theme.DARK,
    ...restOptions 
  } = options;
  
  switch (type) {
    case 'monaco':
      return await createMonacoEditor(container, { language, value, theme, ...restOptions });
    case 'codemirror':
      return await createCodeMirrorEditor(container, { language, value, theme, ...restOptions });
    case 'textarea':
    default:
      return createTextareaEditor(container, { language, value, theme, ...restOptions });
  }
}

// ============================================================
// Textarea 编辑器（默认，轻量）
// ============================================================
function createTextareaEditor(container, options) {
  const { language, value, theme, onChange } = options;
  
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.spellcheck = false;
  textarea.style.cssText = `
    width: 100%;
    height: 300px;
    font-family: 'Fira Code', Consolas, Monaco, monospace;
    font-size: 0.85rem;
    padding: 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    resize: vertical;
    line-height: 1.5;
    tab-size: 2;
    background: ${theme === 'dark' ? '#1f2937' : '#fff'};
    color: ${theme === 'dark' ? '#e5e7eb' : '#1f2937'};
  `;
  
  // Tab 支持
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
    }
  });
  
  // 内容变化回调
  if (onChange) {
    textarea.addEventListener('input', () => onChange(textarea.value));
  }
  
  container.appendChild(textarea);
  
  // 返回标准接口
  return {
    type: 'textarea',
    element: textarea,
    
    getValue() {
      return textarea.value;
    },
    
    setValue(content) {
      textarea.value = content;
    },
    
    getSelection() {
      return textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    },
    
    setLanguage(lang) {
      // Textarea 不支持语法高亮，忽略
    },
    
    focus() {
      textarea.focus();
    },
    
    dispose() {
      textarea.remove();
    },
    
    onDidChangeContent(callback) {
      textarea.addEventListener('input', () => callback(textarea.value));
    },
    
    // 扩展方法
    setTheme(newTheme) {
      textarea.style.background = newTheme === 'dark' ? '#1f2937' : '#fff';
      textarea.style.color = newTheme === 'dark' ? '#e5e7eb' : '#1f2937';
    }
  };
}

// ============================================================
// Monaco 编辑器（未来实现）
// ============================================================
async function createMonacoEditor(container, options) {
  const { language, value, theme, onChange } = options;
  
  // 动态加载 Monaco
  if (!window.monaco) {
    await loadMonaco();
  }
  
  const editor = window.monaco.editor.create(container, {
    value,
    language: mapLanguageToMonaco(language),
    theme: theme === 'dark' ? 'vs-dark' : 'vs',
    fontSize: EditorConfig.defaults.fontSize,
    tabSize: EditorConfig.defaults.tabSize,
    lineNumbers: EditorConfig.defaults.lineNumbers ? 'on' : 'off',
    wordWrap: EditorConfig.defaults.wordWrap ? 'on' : 'off',
    minimap: { enabled: EditorConfig.defaults.minimap },
    automaticLayout: true,
    scrollBeyondLastLine: false
  });
  
  if (onChange) {
    editor.onDidChangeModelContent(() => onChange(editor.getValue()));
  }
  
  return {
    type: 'monaco',
    element: container,
    
    getValue() {
      return editor.getValue();
    },
    
    setValue(content) {
      editor.setValue(content);
    },
    
    getSelection() {
      return editor.getModel().getValueInRange(editor.getSelection());
    },
    
    setLanguage(lang) {
      window.monaco.editor.setModelLanguage(editor.getModel(), mapLanguageToMonaco(lang));
    },
    
    focus() {
      editor.focus();
    },
    
    dispose() {
      editor.dispose();
    },
    
    onDidChangeContent(callback) {
      editor.onDidChangeModelContent(() => callback(editor.getValue()));
    },
    
    setTheme(newTheme) {
      window.monaco.editor.setTheme(newTheme === 'dark' ? 'vs-dark' : 'vs');
    },
    
    // Monaco 特有方法
    getEditor() {
      return editor;
    }
  };
}

// 加载 Monaco
async function loadMonaco() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js';
    script.onload = () => {
      window.require.config({
        paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }
      });
      window.require(['vs/editor/editor.main'], resolve);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// 语言映射
function mapLanguageToMonaco(lang) {
  const map = {
    python: 'python',
    py: 'python',
    javascript: 'javascript',
    js: 'javascript',
    c: 'c',
    cpp: 'cpp',
    'c++': 'cpp',
    latex: 'latex',
    tex: 'latex',
    markdown: 'markdown',
    md: 'markdown',
    html: 'html',
    css: 'css',
    json: 'json'
  };
  return map[lang.toLowerCase()] || 'plaintext';
}

// ============================================================
// CodeMirror 编辑器（未来实现）
// ============================================================
async function createCodeMirrorEditor(container, options) {
  // TODO: 实现 CodeMirror 6 支持
  console.warn('CodeMirror editor not implemented yet, falling back to textarea');
  return createTextareaEditor(container, options);
}

// 导出
export { createTextareaEditor, createMonacoEditor };
