// ExportGUI.js - 导出页面快照

export async function ExportGUI(container, protocol) {
  const { title, code } = protocol;
  
  container.innerHTML = `
    <button class="export-btn" style="padding:0.8rem 1.5rem;background:#f59e0b;color:white;border:none;border-radius:8px;cursor:pointer;font-size:1rem;font-weight:500;transition:all 0.2s">
      📦 Export Static HTML
    </button>
    <p style="margin-top:0.5rem;color:#666;font-size:0.9rem">导出当前页面快照（保留布局，禁用交互）</p>
  `;
  
  const btn = container.querySelector('.export-btn');
  btn.onmouseenter = () => btn.style.transform = 'translateY(-2px)';
  btn.onmouseleave = () => btn.style.transform = 'translateY(0)';
  
  btn.onclick = () => {
    // 克隆整个页面
    const clone = document.body.cloneNode(true);
    
    // 关键：先把动态 sections 移到 add-section 外面
    const addSectionEl = clone.querySelector('#section-add-section');
    const dynamicContainer = clone.querySelector('.dynamic-sections-container');
    
    if (addSectionEl && dynamicContainer) {
      const dynamicSections = Array.from(dynamicContainer.children);
      dynamicSections.forEach(section => {
        addSectionEl.parentNode.insertBefore(section, addSectionEl);
      });
    }
    
    // 删除不需要的元素
    const removeSelectors = [
      '#section-export',
      '#section-add-section',
      '.play-btn',
      '.editor-toolbar',        // 编辑器工具栏（Run/Reset/Clear）
      '.ide-run-btn',
      '.ide-reset-btn', 
      '.ide-status',
      'button[style*="background:#ef4444"]',  // Remove 按钮
      'button[style*="background: rgb(239, 68, 68)"]',
    ];
    
    removeSelectors.forEach(sel => {
      clone.querySelectorAll(sel).forEach(el => el.remove());
    });
    
    // 删除所有原有的下载按钮容器（稍后重新添加）
    clone.querySelectorAll('.download-group, .code-buttons, [style*="margin-top:0.5rem"]').forEach(el => {
      // 检查是否是按钮容器
      if (el.querySelector('button')) {
        el.remove();
      }
    });
    
    // 删除所有带 onclick 的按钮
    clone.querySelectorAll('button[onclick], button').forEach(el => el.remove());
    
    // 把 textarea 转成 pre
    clone.querySelectorAll('textarea').forEach(textarea => {
      const pre = document.createElement('pre');
      pre.textContent = textarea.value;
      pre.className = 'exported-code';
      pre.setAttribute('data-code', 'true');
      textarea.parentNode.replaceChild(pre, textarea);
    });
    
    // 处理 HTML output 区域 - 保留渲染内容
    clone.querySelectorAll('.html-output').forEach(el => {
      el.style.pointerEvents = 'none';
    });
    
    // 禁用所有输入
    clone.querySelectorAll('input, select').forEach(el => {
      el.disabled = true;
      el.style.pointerEvents = 'none';
    });
    
    // 收集所有图片数据用于下载脚本
    const images = [];
    clone.querySelectorAll('img').forEach((img, i) => {
      if (img.src && img.src.startsWith('data:image')) {
        img.setAttribute('data-img-index', i);
        images.push(img.src);
      }
    });
    
    // 收集所有代码块
    const codes = [];
    clone.querySelectorAll('pre[data-code], pre.exported-code, #section-code-display pre').forEach((pre, i) => {
      pre.setAttribute('data-code-index', i);
      codes.push(pre.textContent);
    });
    
    // CSS 样式
    const inlineCSS = `
      <style>
        * { box-sizing: border-box; }
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem 1rem; }
        #status-bar { display: none; }
        .app-section, section { margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e5e7eb; }
        .section-layout { display: flex; gap: 2rem; }
        .section-layout > div { flex: 1; min-width: 300px; }
        div[style*="display:flex"][style*="gap:2rem"], div[style*="display: flex"][style*="gap: 2rem"] { display: flex; gap: 2rem; }
        div[style*="flex:1"], div[style*="flex: 1"] { flex: 1; min-width: 300px; }
        img { max-width: 100%; border: 1px solid #ddd; border-radius: 0.5rem; background: #f9fafb; }
        pre, .exported-code { background: #1f2937; color: #e5e7eb; padding: 1rem; border-radius: 0.5rem; overflow: auto; font-size: 0.85rem; white-space: pre-wrap; margin: 0; }
        h1 { margin: 0 0 0.5rem 0; }
        h2 { margin: 0 0 1rem 0; }
        input[type="range"] { width: 100%; }
        .param-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
        .slider-container { flex: 1; }
        .slider-label-line { display: flex; justify-content: space-between; margin-bottom: 0.25rem; font-size: 0.9rem; }
        .html-output { border: 1px solid #ddd; border-radius: 0.5rem; padding: 1rem; background: #fff; min-height: 100px; }
        .html-output h1, .html-output h2, .html-output h3 { border-bottom: 1px solid #eee; padding-bottom: 0.3rem; }
        .html-output code { background: #f3f4f6; padding: 0.15rem 0.3rem; border-radius: 3px; }
        .html-output pre { background: #1f2937; color: #e5e7eb; }
        .html-output blockquote { border-left: 4px solid #ddd; padding-left: 1rem; color: #666; margin: 0.5rem 0; }
        .download-bar { margin-top: 0.5rem; padding: 0.5rem 0; }
        .download-bar button { padding: 0.4rem 0.8rem; border: 1px solid #ccc; border-radius: 4px; background: #f9fafb; cursor: pointer; margin-right: 0.5rem; font-size: 0.85rem; }
        .download-bar button:hover { background: #e5e7eb; }
        footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; color: #999; font-size: 0.85rem; }
        .editor-container { margin-top: 0; }
      </style>
    `;
    
    // 下载脚本（使用数据数组而非 DOM 查询）
    const downloadScript = `
      <script>
        const imageData = ${JSON.stringify(images)};
        const codeData = ${JSON.stringify(codes)};
        
        function downloadImage(index) {
          if (!imageData[index]) return;
          const a = document.createElement('a');
          a.href = imageData[index];
          a.download = 'image_' + (index + 1) + '.png';
          a.click();
        }
        
        function downloadCode(index) {
          if (!codeData[index]) return;
          const blob = new Blob([codeData[index]], { type: 'text/plain' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'code_' + (index + 1) + '.py';
          a.click();
        }
        
        function copyCode(index, btn) {
          if (!codeData[index]) return;
          navigator.clipboard.writeText(codeData[index]);
          const orig = btn.textContent;
          btn.textContent = '✓ 已复制';
          setTimeout(() => btn.textContent = orig, 1500);
        }
        
        function downloadHtml(index) {
          const el = document.querySelector('[data-html-index="' + index + '"]');
          if (!el) return;
          const blob = new Blob([el.innerHTML], { type: 'text/html' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'content_' + (index + 1) + '.html';
          a.click();
        }
      <\/script>
    `;
    
    // 为图片添加下载按钮
    clone.querySelectorAll('img[data-img-index]').forEach(img => {
      const index = img.getAttribute('data-img-index');
      const bar = document.createElement('div');
      bar.className = 'download-bar';
      bar.innerHTML = `<button onclick="downloadImage(${index})">📥 Download PNG</button>`;
      img.parentNode.insertBefore(bar, img.nextSibling);
    });
    
    // 为代码块添加按钮
    clone.querySelectorAll('pre[data-code-index]').forEach(pre => {
      const index = pre.getAttribute('data-code-index');
      const bar = document.createElement('div');
      bar.className = 'download-bar';
      bar.innerHTML = `
        <button onclick="copyCode(${index}, this)">📋 复制代码</button>
        <button onclick="downloadCode(${index})">📥 下载 .py</button>
      `;
      pre.parentNode.insertBefore(bar, pre);
    });
    
    // 为 HTML output 添加下载按钮
    clone.querySelectorAll('.html-output').forEach((el, i) => {
      el.setAttribute('data-html-index', i);
      const bar = document.createElement('div');
      bar.className = 'download-bar';
      bar.innerHTML = `<button onclick="downloadHtml(${i})">📥 Download HTML</button>`;
      el.parentNode.insertBefore(bar, el.nextSibling);
    });
    
    // 生成最终 HTML
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - Snapshot</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.min.js"><\/script>
  ${inlineCSS}
</head>
<body>
  ${clone.innerHTML}
  <footer>Exported snapshot - ${new Date().toLocaleString()}</footer>
  ${downloadScript}
</body>
</html>`;
    
    // 下载
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = title.replace(/[^a-zA-Z0-9]/g, '_') + '_snapshot.html';
    a.click();
    URL.revokeObjectURL(a.href);
  };
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
