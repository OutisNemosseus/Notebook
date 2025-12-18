// CodeDisplayGUI.js - 纯代码展示 UI 组件

import { loadHighlightJS, highlightCode, createCodeBlock } from '../highlight/codeHighlight.js';

export async function CodeDisplayGUI(container, protocol) {
  const { code, language = 'python' } = protocol;
  
  container.innerHTML = `
    <button class="copy-btn" style="margin-bottom:0.5rem;padding:0.3rem 0.8rem;border-radius:999px;border:1px solid #ccc;background:#f9fafb;cursor:pointer">
      复制代码
    </button>
  `;
  
  await loadHighlightJS();
  
  const { pre, codeEl } = createCodeBlock(code, language);
  container.appendChild(pre);
  highlightCode(codeEl);

  container.querySelector('.copy-btn').addEventListener('click', async () => {
    await navigator.clipboard.writeText(code);
    const btn = container.querySelector('.copy-btn');
    btn.textContent = '已复制 ✓';
    setTimeout(() => btn.textContent = '复制代码', 1200);
  });
}
