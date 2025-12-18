// sectionRenderer.js - Section 渲染器

import { createImageDownloadPanel } from '../widgets/downloadPanel.js';

export async function renderSection(section, downloadProtocol, parentContainer, options = {}) {
  const { name, title, hasOutput, outputType, gui, protocol, onPlotMount } = section;
  const { removable = true } = options;
  
  const sectionEl = document.createElement('section');
  sectionEl.className = 'app-section';
  sectionEl.id = 'section-' + name;
  sectionEl.style.cssText = 'margin-top:1.5rem;padding:1.5rem;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1)';
  
  // Section Header（带删除按钮）
  if (title) {
    const header = document.createElement('div');
    header.className = 'section-header';
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem';
    
    const titleEl = document.createElement('h2');
    titleEl.textContent = title;
    titleEl.style.cssText = 'margin:0;font-size:1.25rem';
    header.appendChild(titleEl);
    
    if (removable) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'section-remove-btn';
      removeBtn.textContent = '✕ Remove';
      removeBtn.style.cssText = 'padding:0.3rem 0.6rem;background:transparent;color:#9ca3af;border:1px solid #e5e7eb;border-radius:4px;cursor:pointer;font-size:0.8rem;transition:all 0.2s';
      removeBtn.onmouseenter = () => {
        removeBtn.style.background = '#ef4444';
        removeBtn.style.color = 'white';
        removeBtn.style.borderColor = '#ef4444';
      };
      removeBtn.onmouseleave = () => {
        removeBtn.style.background = 'transparent';
        removeBtn.style.color = '#9ca3af';
        removeBtn.style.borderColor = '#e5e7eb';
      };
      removeBtn.onclick = () => {
        sectionEl.style.transition = 'all 0.3s';
        sectionEl.style.opacity = '0';
        sectionEl.style.transform = 'translateX(-20px)';
        setTimeout(() => sectionEl.remove(), 300);
      };
      header.appendChild(removeBtn);
    }
    
    sectionEl.appendChild(header);
  }
  
  if (hasOutput) {
    const layout = document.createElement('div');
    layout.className = 'section-layout';
    layout.style.cssText = 'display:flex;gap:2rem';
    
    const leftPanel = document.createElement('div');
    leftPanel.style.cssText = 'flex:1;min-width:300px';
    
    const rightPanel = document.createElement('div');
    rightPanel.style.cssText = 'flex:1;min-width:300px';
    
    // 根据 outputType 创建不同的输出面板
    let output;
    switch (outputType) {
      case 'console':
        output = createConsolePanel(name);
        break;
      case 'html':
        output = createHtmlPanel(name);
        break;
      case 'plot':
      default:
        output = createPlotPanel(name, downloadProtocol);
        break;
    }
    
    rightPanel.appendChild(output.container);
    
    layout.appendChild(leftPanel);
    layout.appendChild(rightPanel);
    sectionEl.appendChild(layout);
    
    // 注册 plot 元素（供 Export 使用）
    if (onPlotMount && output.plot) {
      onPlotMount(output.plot);
    }
    
    const result = await gui(leftPanel, protocol, () => output.update());
    
    if (result && (result.getPlotData || result.getOutputData)) {
      output.bindGetData(result.getPlotData || result.getOutputData);
    }
  } else {
    // 无输出的 section，内容直接放入
    const contentDiv = document.createElement('div');
    await gui(contentDiv, protocol);
    sectionEl.appendChild(contentDiv);
  }
  
  parentContainer.appendChild(sectionEl);
  return sectionEl;
}

export async function renderAllSections(sections, downloadProtocol, parentContainer) {
  const sorted = [...sections].sort((a, b) => a.order - b.order);
  for (const section of sorted) {
    // Header 不可删除
    const removable = section.name !== 'header';
    await renderSection(section, downloadProtocol, parentContainer, { removable });
  }
}

// ============================================================
// Plot 输出面板（图片）
// ============================================================
function createPlotPanel(name, downloadProtocol) {
  const container = document.createElement('div');
  
  const status = document.createElement('div');
  status.style.cssText = 'margin-bottom:0.5rem;font-size:0.85rem;color:#666';
  status.textContent = 'Ready';
  
  const plot = document.createElement('img');
  plot.id = 'plot-' + name;
  plot.style.cssText = 'width:100%;border:1px solid #ddd;border-radius:0.5rem;background:#f9fafb;min-height:200px';
  
  const downloadContainer = document.createElement('div');
  downloadContainer.style.cssText = 'margin-top:0.5rem';
  
  if (downloadProtocol) {
    const panel = createImageDownloadPanel(plot, downloadProtocol, name + '-output');
    if (panel) downloadContainer.appendChild(panel);
  }
  
  container.appendChild(status);
  container.appendChild(plot);
  container.appendChild(downloadContainer);
  
  let getDataFn = null;
  
  return {
    container,
    plot,
    bindGetData(fn) { getDataFn = fn; },
    async update() {
      if (!getDataFn) return;
      status.textContent = 'Rendering...';
      status.style.color = '#666';
      try {
        const imgData = await getDataFn();
        if (imgData && imgData.startsWith('data:image')) {
          plot.src = imgData;
          status.textContent = 'Done';
          status.style.color = '#10b981';
        }
      } catch (error) {
        status.textContent = 'Error: ' + error.message;
        status.style.color = '#ef4444';
      }
    }
  };
}

// ============================================================
// Console 输出面板（文字 + 图片混合）
// ============================================================
function createConsolePanel(name) {
  const container = document.createElement('div');
  
  const status = document.createElement('div');
  status.style.cssText = 'margin-bottom:0.5rem;font-size:0.85rem;color:#666';
  status.textContent = 'Ready';
  
  const outputArea = document.createElement('div');
  outputArea.id = 'console-' + name;
  outputArea.style.cssText = 'width:100%;min-height:200px;border:1px solid #ddd;border-radius:0.5rem;background:#111827;padding:1rem;overflow:auto;';
  
  const textOutput = document.createElement('pre');
  textOutput.style.cssText = 'margin:0;color:#e5e7eb;font-family:monospace;font-size:0.85rem;white-space:pre-wrap;word-break:break-all;';
  outputArea.appendChild(textOutput);
  
  const imgOutput = document.createElement('img');
  imgOutput.style.cssText = 'width:100%;display:none;border-radius:0.25rem;';
  outputArea.appendChild(imgOutput);
  
  const downloadContainer = document.createElement('div');
  downloadContainer.style.cssText = 'margin-top:0.5rem;display:none;';
  downloadContainer.innerHTML = `
    <button class="download-png-btn" style="padding:0.3rem 0.6rem;border:1px solid #ccc;border-radius:4px;background:#f9fafb;cursor:pointer;margin-right:0.5rem;font-size:0.85rem">📥 PNG</button>
    <button class="download-txt-btn" style="padding:0.3rem 0.6rem;border:1px solid #ccc;border-radius:4px;background:#f9fafb;cursor:pointer;margin-right:0.5rem;font-size:0.85rem">📥 TXT</button>
    <button class="copy-btn" style="padding:0.3rem 0.6rem;border:1px solid #ccc;border-radius:4px;background:#f9fafb;cursor:pointer;font-size:0.85rem">📋 Copy</button>
  `;
  
  container.appendChild(status);
  container.appendChild(outputArea);
  container.appendChild(downloadContainer);
  
  let getDataFn = null;
  let currentOutput = null;
  
  downloadContainer.querySelector('.download-png-btn').onclick = () => {
    if (currentOutput && currentOutput.type === 'image') {
      const a = document.createElement('a');
      a.href = currentOutput.content;
      a.download = name + '-output.png';
      a.click();
    }
  };
  
  downloadContainer.querySelector('.download-txt-btn').onclick = () => {
    if (currentOutput && currentOutput.type === 'text') {
      const blob = new Blob([currentOutput.content], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name + '-output.txt';
      a.click();
    }
  };
  
  downloadContainer.querySelector('.copy-btn').onclick = async () => {
    if (currentOutput) {
      await navigator.clipboard.writeText(currentOutput.content);
      const btn = downloadContainer.querySelector('.copy-btn');
      btn.textContent = '✓ Copied';
      setTimeout(() => btn.textContent = '📋 Copy', 1500);
    }
  };
  
  return {
    container,
    plot: imgOutput,
    bindGetData(fn) { getDataFn = fn; },
    async update() {
      if (!getDataFn) return;
      status.textContent = 'Running...';
      status.style.color = '#666';
      
      try {
        const data = await getDataFn();
        currentOutput = data;
        
        if (!data || !data.content) {
          textOutput.textContent = '(No output)';
          textOutput.style.display = 'block';
          imgOutput.style.display = 'none';
          downloadContainer.style.display = 'none';
          status.textContent = 'Done';
          status.style.color = '#10b981';
          return;
        }
        
        if (data.type === 'image') {
          imgOutput.src = data.content;
          imgOutput.style.display = 'block';
          textOutput.style.display = 'none';
          downloadContainer.style.display = 'block';
          downloadContainer.querySelector('.download-png-btn').style.display = 'inline-block';
          downloadContainer.querySelector('.download-txt-btn').style.display = 'none';
          status.textContent = 'Done (image)';
          status.style.color = '#10b981';
        } else if (data.type === 'error') {
          textOutput.textContent = data.content;
          textOutput.style.color = '#ef4444';
          textOutput.style.display = 'block';
          imgOutput.style.display = 'none';
          downloadContainer.style.display = 'block';
          downloadContainer.querySelector('.download-png-btn').style.display = 'none';
          downloadContainer.querySelector('.download-txt-btn').style.display = 'inline-block';
          status.textContent = 'Error';
          status.style.color = '#ef4444';
        } else {
          textOutput.textContent = data.content;
          textOutput.style.color = '#e5e7eb';
          textOutput.style.display = 'block';
          imgOutput.style.display = 'none';
          downloadContainer.style.display = 'block';
          downloadContainer.querySelector('.download-png-btn').style.display = 'none';
          downloadContainer.querySelector('.download-txt-btn').style.display = 'inline-block';
          status.textContent = 'Done';
          status.style.color = '#10b981';
        }
      } catch (error) {
        textOutput.textContent = 'Error: ' + error.message;
        textOutput.style.color = '#ef4444';
        textOutput.style.display = 'block';
        imgOutput.style.display = 'none';
        status.textContent = 'Error';
        status.style.color = '#ef4444';
      }
    }
  };
}

// ============================================================
// HTML 输出面板（Markdown/LaTeX 渲染）
// ============================================================
function createHtmlPanel(name) {
  const container = document.createElement('div');
  
  const status = document.createElement('div');
  status.style.cssText = 'margin-bottom:0.5rem;font-size:0.85rem;color:#666';
  status.textContent = 'Ready';
  
  const outputArea = document.createElement('div');
  outputArea.id = 'html-' + name;
  outputArea.className = 'html-output markdown-body';
  outputArea.style.cssText = `
    width: 100%;
    min-height: 200px;
    max-height: 500px;
    overflow: auto;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    background: #fff;
    padding: 1rem;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 0.95rem;
    line-height: 1.6;
  `;
  
  // 添加 Markdown 样式
  const style = document.createElement('style');
  style.textContent = `
    .html-output h1 { font-size: 1.8rem; margin: 0.5rem 0; border-bottom: 1px solid #eee; padding-bottom: 0.3rem; }
    .html-output h2 { font-size: 1.5rem; margin: 0.5rem 0; border-bottom: 1px solid #eee; padding-bottom: 0.2rem; }
    .html-output h3 { font-size: 1.25rem; margin: 0.5rem 0; }
    .html-output h4 { font-size: 1.1rem; margin: 0.5rem 0; }
    .html-output p { margin: 0.5rem 0; }
    .html-output ul, .html-output ol { margin: 0.5rem 0; padding-left: 1.5rem; }
    .html-output li { margin: 0.25rem 0; }
    .html-output code { background: #f3f4f6; padding: 0.15rem 0.3rem; border-radius: 3px; font-size: 0.9em; }
    .html-output pre { background: #1f2937; color: #e5e7eb; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
    .html-output pre code { background: none; padding: 0; }
    .html-output blockquote { border-left: 4px solid #ddd; margin: 0.5rem 0; padding-left: 1rem; color: #666; }
    .html-output table { border-collapse: collapse; width: 100%; margin: 0.5rem 0; }
    .html-output th, .html-output td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
    .html-output th { background: #f9fafb; }
    .html-output a { color: #3b82f6; }
    .html-output hr { border: none; border-top: 1px solid #ddd; margin: 1rem 0; }
    .html-output img { max-width: 100%; }
    .latex-output { text-align: center; padding: 1rem 0; }
  `;
  container.appendChild(style);
  
  const downloadContainer = document.createElement('div');
  downloadContainer.style.cssText = 'margin-top:0.5rem;';
  downloadContainer.innerHTML = `
    <button class="copy-html-btn" style="padding:0.3rem 0.6rem;border:1px solid #ccc;border-radius:4px;background:#f9fafb;cursor:pointer;margin-right:0.5rem;font-size:0.85rem">📋 Copy HTML</button>
    <button class="download-html-btn" style="padding:0.3rem 0.6rem;border:1px solid #ccc;border-radius:4px;background:#f9fafb;cursor:pointer;font-size:0.85rem">📥 Download HTML</button>
  `;
  
  container.appendChild(status);
  container.appendChild(outputArea);
  container.appendChild(downloadContainer);
  
  let getDataFn = null;
  let currentHtml = '';
  
  downloadContainer.querySelector('.copy-html-btn').onclick = async () => {
    await navigator.clipboard.writeText(currentHtml);
    const btn = downloadContainer.querySelector('.copy-html-btn');
    btn.textContent = '✓ Copied';
    setTimeout(() => btn.textContent = '📋 Copy HTML', 1500);
  };
  
  downloadContainer.querySelector('.download-html-btn').onclick = () => {
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rendered Output</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.min.js"></script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
    h1 { border-bottom: 1px solid #eee; padding-bottom: 0.3rem; }
    h2 { border-bottom: 1px solid #eee; padding-bottom: 0.2rem; }
    code { background: #f3f4f6; padding: 0.15rem 0.3rem; border-radius: 3px; }
    pre { background: #1f2937; color: #e5e7eb; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
    pre code { background: none; }
    blockquote { border-left: 4px solid #ddd; margin: 0.5rem 0; padding-left: 1rem; color: #666; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; }
    th { background: #f9fafb; }
  </style>
</head>
<body>
${currentHtml}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name + '-output.html';
    a.click();
  };
  
  return {
    container,
    plot: null,
    bindGetData(fn) { getDataFn = fn; },
    async update() {
      if (!getDataFn) return;
      status.textContent = 'Rendering...';
      status.style.color = '#666';
      
      try {
        const data = await getDataFn();
        
        if (!data || !data.content) {
          outputArea.innerHTML = '<p style="color:#999">(No output)</p>';
          status.textContent = 'Done';
          status.style.color = '#10b981';
          return;
        }
        
        if (data.type === 'error') {
          outputArea.innerHTML = `<pre style="color:#ef4444">${escapeHtml(data.content)}</pre>`;
          status.textContent = 'Error';
          status.style.color = '#ef4444';
          return;
        }
        
        currentHtml = data.content;
        outputArea.innerHTML = data.content;
        
        // 如果需要 MathJax 渲染
        if (data.needsMathJax && window.MathJax) {
          await window.MathJax.typesetPromise([outputArea]);
        }
        
        status.textContent = 'Done';
        status.style.color = '#10b981';
      } catch (error) {
        outputArea.innerHTML = `<pre style="color:#ef4444">Error: ${escapeHtml(error.message)}</pre>`;
        status.textContent = 'Error';
        status.style.color = '#ef4444';
      }
    }
  };
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
