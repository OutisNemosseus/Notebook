// dynamicSection.js - 动态添加 Section

import { createImageDownloadPanel } from '../widgets/downloadPanel.js';

let counter = 0;

export async function addDynamicSection(guiConfig, protocol, parentContainer, project) {
  const { gui, label, icon, outputType } = guiConfig;
  const id = ++counter;
  const name = `dynamic-${label.toLowerCase()}-${id}`;
  
  console.log('[dynamicSection] Adding:', name, outputType);
  
  if (!gui) {
    console.error('[dynamicSection] No GUI provided');
    return null;
  }
  
  const section = document.createElement('section');
  section.className = 'app-section dynamic-section';
  section.id = `section-${name}`;
  section.dataset.outputType = outputType;
  section.dataset.guiType = label.toLowerCase();
  section.style.cssText = 'margin-top:1rem;padding:1.5rem;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1)';
  
  // Title bar with remove button
  const titleBar = document.createElement('div');
  titleBar.className = 'section-header';
  titleBar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem';
  titleBar.innerHTML = `
    <h2 style="margin:0">${icon} ${label} Section #${id}</h2>
    <button class="section-remove-btn" style="padding:0.3rem 0.6rem;background:transparent;color:#9ca3af;border:1px solid #e5e7eb;border-radius:4px;cursor:pointer;font-size:0.8rem;transition:all 0.2s">✕ Remove</button>
  `;
  section.appendChild(titleBar);
  
  const removeBtn = titleBar.querySelector('.section-remove-btn');
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
    section.style.transition = 'all 0.3s';
    section.style.opacity = '0';
    section.style.transform = 'translateX(-20px)';
    setTimeout(() => section.remove(), 300);
  };
  
  // Layout
  const layout = document.createElement('div');
  layout.className = 'section-layout';
  layout.style.cssText = 'display:flex;gap:2rem';
  
  const leftPanel = document.createElement('div');
  leftPanel.style.cssText = 'flex:1;min-width:300px';
  
  const rightPanel = document.createElement('div');
  rightPanel.style.cssText = 'flex:1;min-width:300px';
  
  layout.appendChild(leftPanel);
  layout.appendChild(rightPanel);
  section.appendChild(layout);
  
  // Output panel based on type
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
      output = createPlotPanel(name, project?.download);
      break;
  }
  
  rightPanel.appendChild(output.container);
  
  // Render GUI
  const result = await gui(leftPanel, protocol, () => output.update());
  
  if (result && (result.getPlotData || result.getOutputData)) {
    output.bindGetData(result.getPlotData || result.getOutputData);
    if (outputType === 'plot') {
      await output.update();
    }
  }
  
  parentContainer.appendChild(section);
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  console.log('[dynamicSection] Added successfully:', name);
  return section;
}

// ============================================================
// Plot Panel
// ============================================================
function createPlotPanel(name, downloadProtocol) {
  const container = document.createElement('div');
  
  const status = document.createElement('div');
  status.style.cssText = 'margin-bottom:0.5rem;font-size:0.85rem;color:#666';
  status.textContent = 'Ready';
  
  const plot = document.createElement('img');
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
    bindGetData(fn) { getDataFn = fn; },
    async update() {
      if (!getDataFn) return;
      status.textContent = 'Rendering...';
      try {
        const imgData = await getDataFn();
        if (imgData && imgData.startsWith('data:image')) {
          plot.src = imgData;
          status.textContent = 'Done';
          status.style.color = '#10b981';
        }
      } catch (e) {
        status.textContent = 'Error: ' + e.message;
        status.style.color = '#ef4444';
      }
    }
  };
}

// ============================================================
// Console Panel
// ============================================================
function createConsolePanel(name) {
  const container = document.createElement('div');
  
  const status = document.createElement('div');
  status.style.cssText = 'margin-bottom:0.5rem;font-size:0.85rem;color:#666';
  status.textContent = 'Ready';
  
  const outputArea = document.createElement('div');
  outputArea.style.cssText = 'width:100%;min-height:200px;border:1px solid #ddd;border-radius:0.5rem;background:#111827;padding:1rem;overflow:auto;';
  
  const textOutput = document.createElement('pre');
  textOutput.style.cssText = 'margin:0;color:#e5e7eb;font-family:monospace;font-size:0.85rem;white-space:pre-wrap;';
  outputArea.appendChild(textOutput);
  
  const imgOutput = document.createElement('img');
  imgOutput.style.cssText = 'width:100%;display:none;border-radius:0.25rem;';
  outputArea.appendChild(imgOutput);
  
  container.appendChild(status);
  container.appendChild(outputArea);
  
  let getDataFn = null;
  
  return {
    container,
    bindGetData(fn) { getDataFn = fn; },
    async update() {
      if (!getDataFn) return;
      status.textContent = 'Running...';
      
      try {
        const data = await getDataFn();
        
        if (!data || !data.content) {
          textOutput.textContent = '(No output)';
          textOutput.style.display = 'block';
          imgOutput.style.display = 'none';
          status.textContent = 'Done';
          status.style.color = '#10b981';
          return;
        }
        
        if (data.type === 'image') {
          imgOutput.src = data.content;
          imgOutput.style.display = 'block';
          textOutput.style.display = 'none';
          status.textContent = 'Done (image)';
          status.style.color = '#10b981';
        } else if (data.type === 'error') {
          textOutput.textContent = data.content;
          textOutput.style.color = '#ef4444';
          textOutput.style.display = 'block';
          imgOutput.style.display = 'none';
          status.textContent = 'Error';
          status.style.color = '#ef4444';
        } else {
          textOutput.textContent = data.content;
          textOutput.style.color = '#e5e7eb';
          textOutput.style.display = 'block';
          imgOutput.style.display = 'none';
          status.textContent = 'Done';
          status.style.color = '#10b981';
        }
      } catch (error) {
        textOutput.textContent = 'Error: ' + error.message;
        textOutput.style.color = '#ef4444';
        status.textContent = 'Error';
        status.style.color = '#ef4444';
      }
    }
  };
}

// ============================================================
// HTML Panel (Markdown/LaTeX)
// ============================================================
function createHtmlPanel(name) {
  const container = document.createElement('div');
  
  const status = document.createElement('div');
  status.style.cssText = 'margin-bottom:0.5rem;font-size:0.85rem;color:#666';
  status.textContent = 'Ready';
  
  const outputArea = document.createElement('div');
  outputArea.className = 'html-output';
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
  
  container.appendChild(status);
  container.appendChild(outputArea);
  
  let getDataFn = null;
  
  return {
    container,
    bindGetData(fn) { getDataFn = fn; },
    async update() {
      if (!getDataFn) return;
      status.textContent = 'Rendering...';
      
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
        
        outputArea.innerHTML = data.content;
        
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
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
