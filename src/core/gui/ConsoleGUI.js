// ConsoleGUI.js - 纯代码执行 + Console 输出
// 左边代码编辑器，右边 console 窗口

import { loadHighlightJS } from '../highlight/codeHighlight.js';

let instanceId = 0;

export async function ConsoleGUI(container, protocol, updateOutput) {
  const { code, execute } = protocol;
  const id = ++instanceId;
  
  await loadHighlightJS();
  
  let lastOutput = { type: 'text', content: '' };
  
  container.innerHTML = `
    <div style="margin-bottom:0.5rem;display:flex;gap:0.5rem;align-items:center">
      <button class="run-btn" style="padding:0.4rem 1rem;background:#10b981;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:500">
        ▶ Run
      </button>
      <button class="reset-btn" style="padding:0.4rem 0.8rem;background:#f3f4f6;border:1px solid #d1d5db;border-radius:4px;cursor:pointer">
        ↺ Reset
      </button>
      <button class="clear-btn" style="padding:0.4rem 0.8rem;background:#f3f4f6;border:1px solid #d1d5db;border-radius:4px;cursor:pointer">
        🗑️ Clear
      </button>
      <span class="status" style="color:#666;font-size:0.85rem"></span>
    </div>
    <textarea class="code-textarea" style="width:100%;height:300px;font-family:monospace;font-size:0.85rem;padding:1rem;border:1px solid #d1d5db;border-radius:0.5rem;resize:vertical;background:#1f2937;color:#e5e7eb">${escapeHtml(code)}</textarea>
  `;

  const textarea = container.querySelector('.code-textarea');
  const runBtn = container.querySelector('.run-btn');
  const resetBtn = container.querySelector('.reset-btn');
  const clearBtn = container.querySelector('.clear-btn');
  const statusEl = container.querySelector('.status');

  // Run 按钮
  runBtn.addEventListener('click', async () => {
    const userCode = textarea.value;
    runBtn.disabled = true;
    runBtn.textContent = '⏳ Running...';
    statusEl.textContent = '';

    try {
      const result = await execute(userCode);
      const resultStr = result !== undefined && result !== null ? String(result) : '';
      
      // 检查是否是图片
      if (resultStr.includes('data:image/png;base64,')) {
        const match = resultStr.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/);
        if (match) {
          lastOutput = { type: 'image', content: match[0] };
          statusEl.textContent = '✓ Plot generated';
          statusEl.style.color = '#10b981';
        }
      } else if (resultStr.startsWith('data:image')) {
        lastOutput = { type: 'image', content: resultStr };
        statusEl.textContent = '✓ Plot generated';
        statusEl.style.color = '#10b981';
      } else if (resultStr) {
        lastOutput = { type: 'text', content: resultStr };
        statusEl.textContent = '✓ Done';
        statusEl.style.color = '#10b981';
      } else {
        lastOutput = { type: 'text', content: '(No output)' };
        statusEl.textContent = '✓ Done (no output)';
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
      runBtn.textContent = '▶ Run';
    }
  });

  // Reset 按钮
  resetBtn.addEventListener('click', () => {
    textarea.value = code;
    statusEl.textContent = 'Reset';
    setTimeout(() => statusEl.textContent = '', 1000);
  });

  // Clear 按钮
  clearBtn.addEventListener('click', () => {
    lastOutput = { type: 'text', content: '' };
    updateOutput();
    statusEl.textContent = 'Cleared';
    setTimeout(() => statusEl.textContent = '', 1000);
  });
  
  return {
    getOutputData: async () => lastOutput
  };
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
