// UniversalEditorGUI.js - 统一编辑器组件
// 支持多种语言和输出类型，通过 protocol 配置
// 支持多种编辑器后端（textarea, Monaco, CodeMirror）

import { createEditor, EditorConfig } from '../editors/index.js';

let instanceId = 0;

export async function UniversalEditorGUI(container, protocol, updateOutput) {
  const { 
    code = '', 
    language = 'text',
    transform,           // (code) => Promise<{type, content}>
    runButtonText = '▶ Run',
    placeholder = '',
    editorType = 'textarea'  // 'textarea' | 'monaco' | 'codemirror'
  } = protocol;
  
  const id = ++instanceId;
  
  let lastOutput = { type: 'text', content: '' };
  
  // 创建工具栏
  const toolbar = document.createElement('div');
  toolbar.className = 'editor-toolbar';
  toolbar.style.cssText = 'margin-bottom:0.5rem;display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap';
  toolbar.innerHTML = `
    <button class="run-btn" style="padding:0.4rem 1rem;background:#10b981;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:500">
      ${runButtonText}
    </button>
    <button class="reset-btn" style="padding:0.4rem 0.8rem;background:#f3f4f6;border:1px solid #d1d5db;border-radius:4px;cursor:pointer">
      ↺ Reset
    </button>
    <button class="clear-btn" style="padding:0.4rem 0.8rem;background:#f3f4f6;border:1px solid #d1d5db;border-radius:4px;cursor:pointer">
      🗑️ Clear Output
    </button>
    <span class="language-badge" style="padding:0.2rem 0.5rem;background:#e5e7eb;border-radius:4px;font-size:0.75rem;text-transform:uppercase">${language}</span>
    <span class="status" style="color:#666;font-size:0.85rem;margin-left:auto"></span>
  `;
  container.appendChild(toolbar);
  
  // 创建编辑器容器
  const editorContainer = document.createElement('div');
  editorContainer.className = 'editor-container';
  container.appendChild(editorContainer);
  
  // 使用 Editor 接口创建编辑器
  const editor = await createEditor(editorContainer, {
    type: editorType,
    language,
    value: code,
    theme: EditorConfig.theme.DARK
  });

  const runBtn = toolbar.querySelector('.run-btn');
  const resetBtn = toolbar.querySelector('.reset-btn');
  const clearBtn = toolbar.querySelector('.clear-btn');
  const statusEl = toolbar.querySelector('.status');

  // Ctrl/Cmd + Enter 快捷键
  if (editor.element) {
    editor.element.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runBtn.click();
      }
    });
  }

  // Run 按钮
  runBtn.addEventListener('click', async () => {
    if (!transform) {
      statusEl.textContent = 'No transform configured';
      statusEl.style.color = '#ef4444';
      return;
    }
    
    const userCode = editor.getValue();
    runBtn.disabled = true;
    runBtn.textContent = '⏳ Running...';
    statusEl.textContent = '';

    try {
      const result = await transform(userCode);
      lastOutput = result;
      
      if (result.type === 'error') {
        statusEl.textContent = '✗ Error';
        statusEl.style.color = '#ef4444';
      } else if (result.type === 'image') {
        statusEl.textContent = '✓ Image generated';
        statusEl.style.color = '#10b981';
      } else if (result.type === 'html') {
        statusEl.textContent = '✓ Rendered';
        statusEl.style.color = '#10b981';
      } else {
        statusEl.textContent = '✓ Done';
        statusEl.style.color = '#10b981';
      }
      
      updateOutput();
    } catch (error) {
      lastOutput = { type: 'error', content: 'Error: ' + error.message };
      statusEl.textContent = '✗ Error';
      statusEl.style.color = '#ef4444';
      updateOutput();
    } finally {
      runBtn.disabled = false;
      runBtn.textContent = runButtonText;
    }
  });

  // Reset 按钮
  resetBtn.addEventListener('click', () => {
    editor.setValue(code);
    statusEl.textContent = 'Reset';
    statusEl.style.color = '#666';
    setTimeout(() => statusEl.textContent = '', 1000);
  });

  // Clear 按钮
  clearBtn.addEventListener('click', () => {
    lastOutput = { type: 'text', content: '' };
    updateOutput();
    statusEl.textContent = 'Cleared';
    statusEl.style.color = '#666';
    setTimeout(() => statusEl.textContent = '', 1000);
  });
  
  return {
    // 标准输出接口
    getOutputData: async () => lastOutput,
    
    // 编辑器接口（暴露给外部）
    getCode: () => editor.getValue(),
    setCode: (newCode) => editor.setValue(newCode),
    getEditor: () => editor,
    
    // 切换编辑器类型（未来使用）
    async switchEditorType(newType) {
      const currentValue = editor.getValue();
      editor.dispose();
      editorContainer.innerHTML = '';
      const newEditor = await createEditor(editorContainer, {
        type: newType,
        language,
        value: currentValue,
        theme: EditorConfig.theme.DARK
      });
      Object.assign(editor, newEditor);
    }
  };
}
