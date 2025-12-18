// IDEGUI.js - 纯 IDE UI 组件
// 只知道协议，不知道任何业务逻辑

import { loadHighlightJS } from '../highlight/codeHighlight.js';

let instanceId = 0;

export async function IDEGUI(container, protocol, updatePlot) {
  const { code, defaultCall, execute } = protocol;
  const id = ++instanceId;
  
  await loadHighlightJS();
  
  let lastResult = null;
  const fullCode = code + '\n\n# 调用函数生成图像\n' + defaultCall;
  
  container.innerHTML = `
    <div style="margin-bottom:0.5rem;display:flex;gap:0.5rem;align-items:center">
      <button class="ide-run-btn" style="padding:0.4rem 1rem;background:#10b981;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:500">
        ▶ Run
      </button>
      <button class="ide-reset-btn" style="padding:0.4rem 0.8rem;background:#f3f4f6;border:1px solid #d1d5db;border-radius:4px;cursor:pointer">
        ↺ Reset
      </button>
      <span class="ide-status" style="color:#666;font-size:0.85rem"></span>
    </div>
    <textarea class="ide-textarea" style="width:100%;height:400px;font-family:monospace;font-size:0.85rem;padding:1rem;border:1px solid #d1d5db;border-radius:0.5rem;resize:vertical;background:#1f2937;color:#e5e7eb"></textarea>
    <pre class="ide-console" style="margin-top:0.5rem;padding:0.5rem;background:#111827;color:#e5e7eb;border-radius:0.5rem;font-size:0.8rem;min-height:40px;overflow-x:auto;white-space:pre-wrap"></pre>
  `;

  const textarea = container.querySelector('.ide-textarea');
  const runBtn = container.querySelector('.ide-run-btn');
  const resetBtn = container.querySelector('.ide-reset-btn');
  const statusEl = container.querySelector('.ide-status');
  const consoleEl = container.querySelector('.ide-console');
  
  textarea.value = fullCode;

  // Run 按钮
  runBtn.addEventListener('click', async () => {
    const userCode = textarea.value;
    runBtn.disabled = true;
    runBtn.textContent = '⏳ Running...';
    statusEl.textContent = '';
    consoleEl.textContent = '';

    try {
      const result = await execute(userCode);
      const resultStr = result !== undefined && result !== null ? String(result) : '';
      
      // 检查返回值或 print 输出是否包含 base64 图片
      if (resultStr.includes('data:image/png;base64,')) {
        // 提取 base64 图片
        const match = resultStr.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/);
        if (match) {
          lastResult = match[0];
          statusEl.textContent = '✓ Plot generated';
          statusEl.style.color = '#10b981';
          updatePlot();
        }
      } else if (resultStr.startsWith('data:image')) {
        lastResult = resultStr;
        statusEl.textContent = '✓ Plot generated';
        statusEl.style.color = '#10b981';
        updatePlot();
      } else if (resultStr) {
        consoleEl.textContent = resultStr;
        statusEl.textContent = '✓ Done';
        statusEl.style.color = '#10b981';
      } else {
        statusEl.textContent = '✓ Done (no output)';
        statusEl.style.color = '#10b981';
      }
    } catch (error) {
      consoleEl.textContent = 'Error: ' + error.message;
      statusEl.textContent = '✗ Error';
      statusEl.style.color = '#ef4444';
    } finally {
      runBtn.disabled = false;
      runBtn.textContent = '▶ Run';
    }
  });

  // Reset 按钮
  resetBtn.addEventListener('click', () => {
    textarea.value = fullCode;
    consoleEl.textContent = '';
    statusEl.textContent = 'Reset';
    setTimeout(() => statusEl.textContent = '', 1000);
  });
  
  return {
    getPlotData: async () => lastResult
  };
}
