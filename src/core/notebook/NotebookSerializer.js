// notebook/NotebookSerializer.js - 序列化和导出
// 支持多种格式的导入导出

import { Notebook, Chapter, Cell, CellType } from './NotebookModel.js';

/**
 * 导出格式
 */
export const ExportFormat = {
  NOTEBOOK: 'notebook',   // .notebook (JSON)
  HTML: 'html',           // 静态 HTML
  HTML_INTERACTIVE: 'html-interactive',  // 带交互的 HTML
  MARKDOWN: 'markdown',   // .md
  PDF: 'pdf'              // PDF (需要后端)
};

/**
 * Notebook 序列化器
 */
export class NotebookSerializer {
  
  // ============================================================
  // 保存/加载 .notebook 格式
  // ============================================================
  
  static saveToFile(notebook, filename = 'notebook.notebook') {
    const json = notebook.serialize();
    const blob = new Blob([json], { type: 'application/json' });
    downloadBlob(blob, filename);
  }
  
  static async loadFromFile(file) {
    const text = await file.text();
    return Notebook.deserialize(text);
  }
  
  // ============================================================
  // 导出为静态 HTML
  // ============================================================
  
  static exportToHTML(notebook, options = {}) {
    const { includeOutputs = true, theme = 'light' } = options;
    
    let chaptersHTML = '';
    
    notebook.chapters.forEach((chapter, chapterIndex) => {
      let cellsHTML = '';
      
      chapter.cells.forEach((cell, cellIndex) => {
        cellsHTML += renderCellToHTML(cell, includeOutputs);
      });
      
      chaptersHTML += `
        <section class="chapter" id="chapter-${chapter.id}">
          <h2 class="chapter-title">${escapeHtml(chapter.title)}</h2>
          <div class="chapter-cells">
            ${cellsHTML}
          </div>
        </section>
      `;
    });
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(notebook.title)}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.min.js"></script>
  <style>
    ${getNotebookCSS(theme)}
  </style>
</head>
<body>
  <div class="notebook">
    <header class="notebook-header">
      <h1>${escapeHtml(notebook.title)}</h1>
      ${notebook.description ? `<p class="description">${escapeHtml(notebook.description)}</p>` : ''}
      <div class="metadata">
        <span>Author: ${escapeHtml(notebook.metadata.author || 'Unknown')}</span>
        <span>Created: ${new Date(notebook.metadata.createdAt).toLocaleDateString()}</span>
      </div>
    </header>
    
    <nav class="toc">
      <h3>Table of Contents</h3>
      <ul>
        ${notebook.chapters.map(ch => 
          `<li><a href="#chapter-${ch.id}">${escapeHtml(ch.title)}</a></li>`
        ).join('\n')}
      </ul>
    </nav>
    
    <main class="chapters">
      ${chaptersHTML}
    </main>
    
    <footer>
      <p>Exported from Notebook - ${new Date().toLocaleString()}</p>
    </footer>
  </div>
</body>
</html>`;
    
    return html;
  }
  
  static downloadAsHTML(notebook, filename = 'notebook.html') {
    const html = this.exportToHTML(notebook);
    const blob = new Blob([html], { type: 'text/html' });
    downloadBlob(blob, filename);
  }
  
  // ============================================================
  // 导出为 Markdown
  // ============================================================
  
  static exportToMarkdown(notebook) {
    let md = `# ${notebook.title}\n\n`;
    
    if (notebook.description) {
      md += `${notebook.description}\n\n`;
    }
    
    md += `---\n\n`;
    
    // 目录
    md += `## Table of Contents\n\n`;
    notebook.chapters.forEach((ch, i) => {
      md += `${i + 1}. [${ch.title}](#${slugify(ch.title)})\n`;
    });
    md += `\n---\n\n`;
    
    // 章节
    notebook.chapters.forEach(chapter => {
      md += `## ${chapter.title}\n\n`;
      
      chapter.cells.forEach(cell => {
        md += renderCellToMarkdown(cell);
        md += '\n\n';
      });
    });
    
    return md;
  }
  
  static downloadAsMarkdown(notebook, filename = 'notebook.md') {
    const md = this.exportToMarkdown(notebook);
    const blob = new Blob([md], { type: 'text/markdown' });
    downloadBlob(blob, filename);
  }
  
  // ============================================================
  // 导出为交互式 HTML (带 Pyodide)
  // ============================================================
  
  static exportToInteractiveHTML(notebook, options = {}) {
    const { includePyodide = true } = options;
    
    // 收集所有代码
    const codeBlocks = notebook.getCodeCells().map((cell, i) => ({
      id: cell.id,
      code: cell.content,
      language: cell.language
    }));
    
    let chaptersHTML = '';
    notebook.chapters.forEach(chapter => {
      let cellsHTML = '';
      chapter.cells.forEach(cell => {
        cellsHTML += renderInteractiveCell(cell);
      });
      
      chaptersHTML += `
        <section class="chapter" id="chapter-${chapter.id}">
          <div class="chapter-header">
            <h2 class="chapter-title">${escapeHtml(chapter.title)}</h2>
            <button class="collapse-btn" onclick="toggleChapter('${chapter.id}')">−</button>
          </div>
          <div class="chapter-cells" id="cells-${chapter.id}">
            ${cellsHTML}
          </div>
        </section>
      `;
    });
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(notebook.title)}</title>
  ${includePyodide ? '<script src="https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js"></script>' : ''}
  <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.min.js"></script>
  <style>
    ${getNotebookCSS('light')}
    ${getInteractiveCSS()}
  </style>
</head>
<body>
  <div class="notebook">
    <header class="notebook-header">
      <h1>${escapeHtml(notebook.title)}</h1>
      <div class="toolbar">
        <button onclick="runAll()">▶ Run All</button>
        <button onclick="clearOutputs()">🗑️ Clear Outputs</button>
        <span id="status">Ready</span>
      </div>
    </header>
    
    <main class="chapters">
      ${chaptersHTML}
    </main>
  </div>
  
  <script>
    ${getInteractiveScript(codeBlocks)}
  </script>
</body>
</html>`;
    
    return html;
  }
  
  static downloadAsInteractiveHTML(notebook, filename = 'notebook-interactive.html') {
    const html = this.exportToInteractiveHTML(notebook);
    const blob = new Blob([html], { type: 'text/html' });
    downloadBlob(blob, filename);
  }
  
  // ============================================================
  // 批量导出章节
  // ============================================================
  
  static exportChaptersAsHTML(notebook, options = {}) {
    const files = [];
    
    // 创建 index.html
    let indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(notebook.title)} - Index</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    h1 { border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
    .chapter-list { list-style: none; padding: 0; }
    .chapter-list li { margin: 1rem 0; }
    .chapter-list a { text-decoration: none; color: #2563eb; font-size: 1.2rem; }
    .chapter-list a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>${escapeHtml(notebook.title)}</h1>
  <p>${escapeHtml(notebook.description || '')}</p>
  <h2>Chapters</h2>
  <ul class="chapter-list">
    ${notebook.chapters.map((ch, i) => 
      `<li><a href="chapter-${i + 1}.html">${i + 1}. ${escapeHtml(ch.title)}</a></li>`
    ).join('\n')}
  </ul>
</body>
</html>`;
    
    files.push({ name: 'index.html', content: indexHTML });
    
    // 创建每个章节的 HTML
    notebook.chapters.forEach((chapter, i) => {
      const chapterNotebook = new Notebook({
        title: chapter.title,
        chapters: [chapter]
      });
      
      const prevLink = i > 0 ? `<a href="chapter-${i}.html">← Previous</a>` : '';
      const nextLink = i < notebook.chapters.length - 1 ? `<a href="chapter-${i + 2}.html">Next →</a>` : '';
      
      let html = this.exportToHTML(chapterNotebook);
      
      // 添加导航
      html = html.replace('</body>', `
        <nav class="chapter-nav">
          ${prevLink}
          <a href="index.html">Index</a>
          ${nextLink}
        </nav>
        <style>
          .chapter-nav { display: flex; justify-content: space-between; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ddd; }
          .chapter-nav a { color: #2563eb; text-decoration: none; }
        </style>
      </body>`);
      
      files.push({ name: `chapter-${i + 1}.html`, content: html });
    });
    
    return files;
  }
  
  static downloadChaptersAsZip(notebook, filename = 'notebook-chapters.zip') {
    // 需要 JSZip 库，这里返回文件列表
    const files = this.exportChaptersAsHTML(notebook);
    
    // 如果没有 JSZip，逐个下载
    if (typeof JSZip === 'undefined') {
      console.warn('JSZip not available, downloading files individually');
      files.forEach(file => {
        const blob = new Blob([file.content], { type: 'text/html' });
        downloadBlob(blob, file.name);
      });
      return;
    }
    
    // 使用 JSZip
    const zip = new JSZip();
    files.forEach(file => zip.file(file.name, file.content));
    
    zip.generateAsync({ type: 'blob' }).then(blob => {
      downloadBlob(blob, filename);
    });
  }
}

// ============================================================
// 辅助函数
// ============================================================

function renderCellToHTML(cell, includeOutput = true) {
  let html = `<div class="cell cell-${cell.type}" id="cell-${cell.id}">`;
  
  switch (cell.type) {
    case CellType.CODE:
      html += `
        <div class="cell-input">
          <pre class="code-block language-${cell.language}"><code>${escapeHtml(cell.content)}</code></pre>
        </div>
      `;
      if (includeOutput && cell.output) {
        html += `
          <div class="cell-output">
            ${renderOutput(cell.output)}
          </div>
        `;
      }
      break;
      
    case CellType.MARKDOWN:
      html += `<div class="markdown-content">${cell.content}</div>`;
      break;
      
    case CellType.LATEX:
      html += `<div class="latex-content">$$${escapeHtml(cell.content)}$$</div>`;
      break;
      
    default:
      html += `<div class="cell-content">${escapeHtml(cell.content)}</div>`;
  }
  
  html += '</div>';
  return html;
}

function renderCellToMarkdown(cell) {
  switch (cell.type) {
    case CellType.CODE:
      return '```' + cell.language + '\n' + cell.content + '\n```';
    case CellType.MARKDOWN:
      return cell.content;
    case CellType.LATEX:
      return '$$\n' + cell.content + '\n$$';
    default:
      return cell.content;
  }
}

function renderInteractiveCell(cell) {
  let html = `<div class="cell cell-${cell.type}" id="cell-${cell.id}">`;
  
  switch (cell.type) {
    case CellType.CODE:
      html += `
        <div class="cell-toolbar">
          <button onclick="runCell('${cell.id}')">▶ Run</button>
          <span class="cell-status" id="status-${cell.id}"></span>
        </div>
        <div class="cell-input">
          <textarea class="code-editor" id="editor-${cell.id}" rows="5">${escapeHtml(cell.content)}</textarea>
        </div>
        <div class="cell-output" id="output-${cell.id}"></div>
      `;
      break;
    default:
      html += renderCellToHTML(cell, true);
  }
  
  html += '</div>';
  return html;
}

function renderOutput(output) {
  if (!output) return '';
  
  if (typeof output === 'string') {
    if (output.startsWith('data:image')) {
      return `<img src="${output}" alt="Output" />`;
    }
    return `<pre class="output-text">${escapeHtml(output)}</pre>`;
  }
  
  return `<pre class="output-text">${escapeHtml(JSON.stringify(output, null, 2))}</pre>`;
}

function getNotebookCSS(theme) {
  return `
    * { box-sizing: border-box; }
    body { 
      font-family: system-ui, -apple-system, sans-serif; 
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
      background: ${theme === 'dark' ? '#1a1a2e' : '#f8fafc'};
      color: ${theme === 'dark' ? '#e5e7eb' : '#1f2937'};
    }
    .notebook-header { margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid #e5e7eb; }
    .notebook-header h1 { margin: 0 0 0.5rem 0; }
    .description { color: #6b7280; margin: 0.5rem 0; }
    .metadata { font-size: 0.85rem; color: #9ca3af; }
    .metadata span { margin-right: 1rem; }
    .toc { background: #f3f4f6; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; }
    .toc h3 { margin: 0 0 0.5rem 0; }
    .toc ul { margin: 0; padding-left: 1.5rem; }
    .toc li { margin: 0.25rem 0; }
    .toc a { color: #2563eb; text-decoration: none; }
    .chapter { margin-bottom: 3rem; }
    .chapter-title { border-bottom: 1px solid #e5e7eb; padding-bottom: 0.5rem; }
    .cell { margin-bottom: 1rem; }
    .code-block { 
      background: #1f2937; 
      color: #e5e7eb; 
      padding: 1rem; 
      border-radius: 8px; 
      overflow-x: auto;
      font-family: 'Fira Code', monospace;
      font-size: 0.9rem;
    }
    .cell-output { 
      background: #f9fafb; 
      border: 1px solid #e5e7eb; 
      border-radius: 8px; 
      padding: 1rem; 
      margin-top: 0.5rem;
    }
    .cell-output img { max-width: 100%; }
    .markdown-content h1, .markdown-content h2 { border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3rem; }
    .latex-content { text-align: center; padding: 1rem; }
    footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 0.85rem; }
  `;
}

function getInteractiveCSS() {
  return `
    .toolbar { display: flex; gap: 0.5rem; align-items: center; margin-top: 1rem; }
    .toolbar button { padding: 0.5rem 1rem; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .toolbar button:hover { background: #059669; }
    #status { margin-left: auto; color: #6b7280; }
    .chapter-header { display: flex; justify-content: space-between; align-items: center; }
    .collapse-btn { background: none; border: 1px solid #ddd; border-radius: 4px; padding: 0.2rem 0.5rem; cursor: pointer; }
    .cell-toolbar { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
    .cell-toolbar button { padding: 0.25rem 0.5rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
    .code-editor { 
      width: 100%; 
      font-family: 'Fira Code', monospace; 
      font-size: 0.9rem; 
      padding: 1rem; 
      border: 1px solid #d1d5db; 
      border-radius: 8px;
      background: #1f2937;
      color: #e5e7eb;
    }
  `;
}

function getInteractiveScript(codeBlocks) {
  return `
    let pyodide = null;
    
    async function initPyodide() {
      document.getElementById('status').textContent = 'Loading Python...';
      pyodide = await loadPyodide();
      await pyodide.loadPackage(['numpy', 'matplotlib']);
      document.getElementById('status').textContent = 'Ready';
    }
    
    async function runCell(cellId) {
      if (!pyodide) await initPyodide();
      
      const editor = document.getElementById('editor-' + cellId);
      const output = document.getElementById('output-' + cellId);
      const status = document.getElementById('status-' + cellId);
      
      const code = editor.value;
      status.textContent = 'Running...';
      
      try {
        // Capture stdout
        await pyodide.runPythonAsync(\`
import sys
from io import StringIO
sys.stdout = StringIO()
\`);
        
        const result = await pyodide.runPythonAsync(code);
        const stdout = await pyodide.runPythonAsync('sys.stdout.getvalue()');
        
        output.innerHTML = '<pre>' + (stdout || result || '(No output)') + '</pre>';
        status.textContent = '✓';
      } catch (e) {
        output.innerHTML = '<pre style="color:red">' + e.message + '</pre>';
        status.textContent = '✗';
      }
    }
    
    async function runAll() {
      const cells = document.querySelectorAll('.cell-code');
      for (const cell of cells) {
        const cellId = cell.id.replace('cell-', '');
        await runCell(cellId);
      }
    }
    
    function clearOutputs() {
      document.querySelectorAll('.cell-output').forEach(el => el.innerHTML = '');
    }
    
    function toggleChapter(chapterId) {
      const cells = document.getElementById('cells-' + chapterId);
      const btn = cells.previousElementSibling.querySelector('.collapse-btn');
      if (cells.style.display === 'none') {
        cells.style.display = 'block';
        btn.textContent = '−';
      } else {
        cells.style.display = 'none';
        btn.textContent = '+';
      }
    }
    
    // Auto-init on load
    initPyodide();
  `;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default NotebookSerializer;
