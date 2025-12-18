// TopBarNotebook.js - 独立的 Notebook TopBar
// 每个 Chapter 是独立的 main content（类似 Clone）

/**
 * Chapter 数据结构 - 保存完整的 main content HTML
 */
class Chapter {
  constructor(options = {}) {
    this.id = options.id || 'ch_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    this.name = options.name || 'Untitled Chapter';
    this.html = options.html || '';  // 保存完整的 innerHTML
    this.inputStates = options.inputStates || [];  // 保存 input/textarea 值
    this.created = options.created || new Date().toISOString();
  }
  
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      html: this.html,
      inputStates: this.inputStates,
      created: this.created
    };
  }
  
  static fromJSON(json) {
    return new Chapter(json);
  }
}

/**
 * Notebook 数据结构
 */
class Notebook {
  constructor(options = {}) {
    this.id = options.id || 'nb_' + Date.now().toString(36);
    this.title = options.title || 'My Notebook';
    this.chapters = (options.chapters || []).map(c => c instanceof Chapter ? c : Chapter.fromJSON(c));
    this.activeChapterId = options.activeChapterId || null;
    this.meta = options.meta || {
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };
  }
  
  addChapter(chapter) {
    this.chapters.push(chapter);
    this.touch();
    return chapter;
  }
  
  removeChapter(chapterId) {
    const index = this.chapters.findIndex(c => c.id === chapterId);
    if (index >= 0) {
      this.chapters.splice(index, 1);
      this.touch();
      return true;
    }
    return false;
  }
  
  getChapter(chapterId) {
    return this.chapters.find(c => c.id === chapterId);
  }
  
  getActiveChapter() {
    return this.chapters.find(c => c.id === this.activeChapterId) || this.chapters[0];
  }
  
  touch() {
    this.meta.modified = new Date().toISOString();
  }
  
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      chapters: this.chapters.map(c => c.toJSON()),
      activeChapterId: this.activeChapterId,
      meta: this.meta
    };
  }
  
  static fromJSON(json) {
    return new Notebook(json);
  }
}

/**
 * TopBar UI
 */
export class TopBarNotebook {
  constructor(options = {}) {
    this.container = null;
    this.notebook = null;
    this.mainContentSelector = options.mainContentSelector || '#main-content';
    this.autoSaveKey = options.autoSaveKey || 'notebook_autosave';
    this.isFirstChapter = true;  // 第一个 chapter 使用当前渲染的内容
  }
  
  init() {
    console.log('[TopBar] Initializing...');
    
    this.container = document.createElement('div');
    this.container.id = 'notebook-topbar';
    this.container.className = 'nb-topbar';
    document.body.insertBefore(this.container, document.body.firstChild);
    
    this.addStyles();
    this.loadNotebook();
    this.render();
    
    console.log('[TopBar] Ready with', this.notebook.chapters.length, 'chapters');
  }
  
  loadNotebook() {
    const saved = localStorage.getItem(this.autoSaveKey);
    if (saved) {
      try {
        this.notebook = Notebook.fromJSON(JSON.parse(saved));
        this.isFirstChapter = false;  // 有保存的数据，不是第一次
        console.log('[TopBar] Loaded from localStorage');
      } catch (e) {
        console.error('[TopBar] Load failed:', e);
        this.createDefaultNotebook();
      }
    } else {
      this.createDefaultNotebook();
    }
    
    if (this.notebook.chapters.length === 0) {
      this.notebook.addChapter(new Chapter({ name: 'Chapter 1' }));
    }
    
    if (!this.notebook.activeChapterId) {
      this.notebook.activeChapterId = this.notebook.chapters[0].id;
    }
  }
  
  createDefaultNotebook() {
    this.notebook = new Notebook({ title: 'My Notebook' });
    this.notebook.addChapter(new Chapter({ name: 'Chapter 1' }));
    this.notebook.activeChapterId = this.notebook.chapters[0].id;
    this.isFirstChapter = true;
  }
  
  saveNotebook() {
    this.captureCurrentChapter();
    localStorage.setItem(this.autoSaveKey, JSON.stringify(this.notebook.toJSON()));
    console.log('[TopBar] Saved');
  }
  
  render() {
    this.container.innerHTML = `
      <div class="nb-topbar-left">
        <span class="nb-topbar-icon">📓</span>
        <input type="text" class="nb-topbar-title" value="${escapeHtml(this.notebook.title)}" />
      </div>
      
      <div class="nb-topbar-chapters">
        ${this.notebook.chapters.map(ch => `
          <div class="nb-chapter-tab ${ch.id === this.notebook.activeChapterId ? 'active' : ''}" 
               data-chapter-id="${ch.id}">
            <span class="nb-tab-name">${escapeHtml(ch.name)}</span>
            ${this.notebook.chapters.length > 1 ? `<button class="nb-tab-close" data-chapter-id="${ch.id}">×</button>` : ''}
          </div>
        `).join('')}
        <button class="nb-chapter-add" title="Add new chapter">+</button>
      </div>
      
      <div class="nb-topbar-right">
        <button class="nb-topbar-btn" id="nb-btn-save" title="Save notebook as HTML file">💾 Save</button>
        <button class="nb-topbar-btn" id="nb-btn-load" title="Load notebook from file">📂 Load</button>
        <div class="nb-section-index" id="nb-section-index">
          <span>§</span><span id="nb-section-count">0</span>
        </div>
      </div>
    `;
    
    this.bindEvents();
    this.updateSectionCount();
    
    // 如果不是第一次加载，恢复当前 chapter 的内容
    if (!this.isFirstChapter) {
      this.restoreChapter(this.notebook.activeChapterId);
    }
  }
  
  bindEvents() {
    // Title
    this.container.querySelector('.nb-topbar-title').onchange = (e) => {
      this.notebook.title = e.target.value;
      this.saveNotebook();
    };
    
    // Tab clicks
    this.container.querySelectorAll('.nb-chapter-tab').forEach(tab => {
      tab.onclick = (e) => {
        if (e.target.classList.contains('nb-tab-close')) return;
        this.switchChapter(tab.dataset.chapterId);
      };
      tab.ondblclick = (e) => {
        if (e.target.classList.contains('nb-tab-close')) return;
        this.renameChapter(tab.dataset.chapterId);
      };
    });
    
    // Close buttons
    this.container.querySelectorAll('.nb-tab-close').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        this.deleteChapter(btn.dataset.chapterId);
      };
    });
    
    // Add chapter
    this.container.querySelector('.nb-chapter-add').onclick = () => this.addChapter();
    
    // Save/Load
    this.container.querySelector('#nb-btn-save').onclick = () => this.saveAsHTML();
    this.container.querySelector('#nb-btn-load').onclick = () => this.loadFromFile();
    
    // Section index dropdown
    this.container.querySelector('#nb-section-index').onclick = () => this.showSectionDropdown();
  }
  
  /**
   * 捕获当前 chapter 的完整状态
   */
  captureCurrentChapter() {
    const chapter = this.notebook.getActiveChapter();
    if (!chapter) return;
    
    const mainContent = document.querySelector(this.mainContentSelector);
    if (!mainContent) return;
    
    // 保存所有 input/textarea 的当前值到 DOM 属性
    mainContent.querySelectorAll('input, textarea').forEach((el, i) => {
      if (el.type === 'checkbox' || el.type === 'radio') {
        el.setAttribute('data-checked', el.checked);
      } else {
        el.setAttribute('data-value', el.value);
      }
    });
    
    // 保存完整 HTML
    chapter.html = mainContent.innerHTML;
    
    // 额外保存 input 状态（用于精确恢复）
    chapter.inputStates = [];
    mainContent.querySelectorAll('input, textarea').forEach((el, i) => {
      chapter.inputStates.push({
        index: i,
        value: el.type === 'checkbox' || el.type === 'radio' ? el.checked : el.value,
        type: el.type
      });
    });
    
    console.log('[TopBar] Captured chapter:', chapter.name);
  }
  
  /**
   * 恢复 chapter 的内容
   */
  restoreChapter(chapterId) {
    const chapter = this.notebook.getChapter(chapterId);
    if (!chapter) return;
    
    const mainContent = document.querySelector(this.mainContentSelector);
    if (!mainContent) return;
    
    if (!chapter.html) {
      // 新 chapter，显示空白提示
      mainContent.innerHTML = `
        <div style="padding:3rem;text-align:center;color:#6b7280">
          <h2>📄 ${escapeHtml(chapter.name)}</h2>
          <p>This chapter is empty. Use the sidebar to add sections.</p>
        </div>
      `;
      console.log('[TopBar] Empty chapter:', chapter.name);
      return;
    }
    
    // 恢复 HTML
    mainContent.innerHTML = chapter.html;
    
    // 恢复 input/textarea 值
    const inputs = mainContent.querySelectorAll('input, textarea');
    chapter.inputStates?.forEach(state => {
      const el = inputs[state.index];
      if (el) {
        if (state.type === 'checkbox' || state.type === 'radio') {
          el.checked = state.value;
        } else {
          el.value = state.value;
        }
      }
    });
    
    // 也从 data 属性恢复
    inputs.forEach(el => {
      if (el.type === 'checkbox' || el.type === 'radio') {
        const checked = el.getAttribute('data-checked');
        if (checked !== null) el.checked = checked === 'true';
      } else {
        const value = el.getAttribute('data-value');
        if (value !== null) el.value = value;
      }
    });
    
    console.log('[TopBar] Restored chapter:', chapter.name);
  }
  
  /**
   * 切换 chapter
   */
  switchChapter(chapterId) {
    if (chapterId === this.notebook.activeChapterId) return;
    
    console.log('[TopBar] Switching to:', chapterId);
    
    // 保存当前
    this.captureCurrentChapter();
    
    // 切换
    this.notebook.activeChapterId = chapterId;
    
    // 恢复目标
    this.restoreChapter(chapterId);
    
    // 更新 UI
    this.container.querySelectorAll('.nb-chapter-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.chapterId === chapterId);
    });
    
    this.updateSectionCount();
    this.saveNotebook();
  }
  
  addChapter() {
    // 先保存当前
    this.captureCurrentChapter();
    
    const name = prompt('Chapter name:', `Chapter ${this.notebook.chapters.length + 1}`);
    if (!name) return;
    
    const chapter = new Chapter({ name });
    this.notebook.addChapter(chapter);
    this.notebook.activeChapterId = chapter.id;
    
    // 清空 main content 给新 chapter
    const mainContent = document.querySelector(this.mainContentSelector);
    if (mainContent) {
      mainContent.innerHTML = `
        <div style="padding:3rem;text-align:center;color:#6b7280">
          <h2>📄 ${escapeHtml(name)}</h2>
          <p>This chapter is empty. Use the sidebar to add sections.</p>
        </div>
      `;
    }
    
    this.saveNotebook();
    this.render();
  }
  
  renameChapter(chapterId) {
    const chapter = this.notebook.getChapter(chapterId);
    if (!chapter) return;
    
    const name = prompt('Rename chapter:', chapter.name);
    if (name) {
      chapter.name = name;
      this.saveNotebook();
      this.render();
    }
  }
  
  deleteChapter(chapterId) {
    if (this.notebook.chapters.length <= 1) {
      alert('Cannot delete the last chapter');
      return;
    }
    
    if (!confirm('Delete this chapter and all its contents?')) return;
    
    const wasActive = chapterId === this.notebook.activeChapterId;
    this.notebook.removeChapter(chapterId);
    
    if (wasActive) {
      this.notebook.activeChapterId = this.notebook.chapters[0].id;
      this.restoreChapter(this.notebook.activeChapterId);
    }
    
    this.saveNotebook();
    this.render();
  }
  
  updateSectionCount() {
    const mainContent = document.querySelector(this.mainContentSelector);
    const count = mainContent?.querySelectorAll('.app-section, .dynamic-section').length || 0;
    const countEl = this.container.querySelector('#nb-section-count');
    if (countEl) countEl.textContent = count;
  }
  
  showSectionDropdown() {
    const existing = document.querySelector('.nb-dropdown');
    if (existing) { existing.remove(); return; }
    
    const mainContent = document.querySelector(this.mainContentSelector);
    const sections = mainContent?.querySelectorAll('.app-section, .dynamic-section') || [];
    if (sections.length === 0) return;
    
    const indexEl = this.container.querySelector('#nb-section-index');
    const rect = indexEl.getBoundingClientRect();
    
    const dropdown = document.createElement('div');
    dropdown.className = 'nb-dropdown';
    dropdown.style.cssText = `
      position:fixed; top:${rect.bottom+5}px; right:${window.innerWidth-rect.right}px;
      background:#fff; border:1px solid #e5e7eb; border-radius:8px;
      box-shadow:0 4px 12px rgba(0,0,0,0.15); max-height:300px; overflow-y:auto;
      z-index:1000; min-width:200px;
    `;
    
    const icons = { slider:'🎛️', python:'🐍', markdown:'📝', latex:'📐', plot:'📊', console:'💻' };
    
    sections.forEach((el, i) => {
      const title = el.querySelector('.section-header h2, h2')?.textContent?.trim() || `Section ${i+1}`;
      const type = el.dataset.guiType || el.dataset.outputType || 'section';
      
      const item = document.createElement('div');
      item.style.cssText = 'padding:0.5rem 1rem;cursor:pointer;display:flex;align-items:center;gap:0.5rem;';
      item.innerHTML = `<span>${icons[type]||'📄'}</span><span style="flex:1">${escapeHtml(title)}</span><span style="color:#9ca3af;font-size:0.8rem">§${i+1}</span>`;
      item.onmouseenter = () => item.style.background = '#f3f4f6';
      item.onmouseleave = () => item.style.background = '';
      item.onclick = () => { el.scrollIntoView({ behavior:'smooth', block:'start' }); dropdown.remove(); };
      dropdown.appendChild(item);
    });
    
    document.body.appendChild(dropdown);
    setTimeout(() => {
      const close = (e) => { if (!dropdown.contains(e.target)) { dropdown.remove(); document.removeEventListener('click', close); } };
      document.addEventListener('click', close);
    }, 0);
  }
  
  async saveAsHTML() {
    this.captureCurrentChapter();
    
    const data = JSON.stringify(this.notebook.toJSON());
    const styles = document.querySelector('#topbar-styles')?.textContent || '';
    const layoutStyles = document.querySelector('#layout-styles')?.textContent || '';
    
    // 获取当前页面的 head（去掉已有的 topbar）
    const head = document.head.innerHTML;
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(this.notebook.title)}</title>
  <script>window.NOTEBOOK_DATA = ${data};<\/script>
  ${head}
</head>
<body>
  <div id="status-bar" style="margin-left:220px;padding:0.5rem 2rem;background:#fff;border-bottom:1px solid #e5e7eb;position:sticky;top:48px;z-index:50">
    <span id="status">Saved notebook - load Pyodide to run code</span>
  </div>
  <div id="app">
    <div class="sidebar" id="sidebar" style="top:48px;height:calc(100vh - 48px)">
      <div style="padding:1rem;color:#9ca3af;font-size:0.9rem">
        <p>Sidebar will load when you open this file with a local server.</p>
      </div>
    </div>
    <div class="main-content" id="main-content">
      ${document.querySelector(this.mainContentSelector)?.innerHTML || ''}
    </div>
  </div>
  <script type="module">
    // 重新初始化 TopBar
    ${TopBarNotebook.toString()}
    ${Chapter.toString()}
    ${Notebook.toString()}
    function escapeHtml(t){return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
    
    if (window.NOTEBOOK_DATA) {
      const topbar = new TopBarNotebook({ mainContentSelector: '#main-content' });
      topbar.notebook = Notebook.fromJSON(window.NOTEBOOK_DATA);
      topbar.isFirstChapter = false;
      topbar.container = document.createElement('div');
      topbar.container.id = 'notebook-topbar';
      topbar.container.className = 'nb-topbar';
      document.body.insertBefore(topbar.container, document.body.firstChild);
      topbar.addStyles();
      topbar.render();
    }
  <\/script>
</body>
</html>`;
    
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = this.notebook.title.replace(/[^a-z0-9]/gi, '_') + '.html';
    a.click();
  }
  
  loadFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html,.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        let data;
        
        const match = text.match(/window\.NOTEBOOK_DATA\s*=\s*({.*?});/s);
        if (match) {
          data = JSON.parse(match[1]);
        } else {
          data = JSON.parse(text);
        }
        
        this.notebook = Notebook.fromJSON(data);
        this.isFirstChapter = false;
        this.saveNotebook();
        this.render();
      } catch (err) {
        alert('Failed to load: ' + err.message);
      }
    };
    input.click();
  }
  
  addStyles() {
    if (document.getElementById('topbar-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'topbar-styles';
    style.textContent = `
      .nb-topbar {
        position: fixed;
        top: 0; left: 0; right: 0;
        height: 48px;
        background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
        color: #fff;
        display: flex;
        align-items: center;
        padding: 0 1rem;
        gap: 1rem;
        z-index: 200;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }
      .nb-topbar-left { display: flex; align-items: center; gap: 0.5rem; }
      .nb-topbar-icon { font-size: 1.5rem; }
      .nb-topbar-title {
        background: rgba(255,255,255,0.1);
        border: none; border-radius: 4px;
        color: #fff; padding: 0.3rem 0.6rem;
        font-size: 1rem; width: 150px;
      }
      .nb-topbar-title:focus { outline: none; background: rgba(255,255,255,0.2); }
      .nb-topbar-chapters {
        display: flex; align-items: center; gap: 0.25rem;
        flex: 1; overflow-x: auto; padding: 0.25rem 0;
      }
      .nb-chapter-tab {
        display: flex; align-items: center; gap: 0.25rem;
        padding: 0.4rem 0.8rem;
        background: rgba(255,255,255,0.1);
        border-radius: 6px 6px 0 0;
        cursor: pointer; white-space: nowrap;
        font-size: 0.9rem; transition: all 0.2s;
        border-bottom: 2px solid transparent;
      }
      .nb-chapter-tab:hover { background: rgba(255,255,255,0.2); }
      .nb-chapter-tab.active {
        background: rgba(255,255,255,0.25);
        border-bottom-color: #fbbf24;
      }
      .nb-tab-name { max-width: 120px; overflow: hidden; text-overflow: ellipsis; }
      .nb-tab-close {
        background: none; border: none;
        color: rgba(255,255,255,0.6);
        cursor: pointer; padding: 0 0.2rem;
        font-size: 1rem; line-height: 1;
      }
      .nb-tab-close:hover { color: #ef4444; }
      .nb-chapter-add {
        background: rgba(255,255,255,0.15);
        border: none; color: #fff;
        width: 28px; height: 28px;
        border-radius: 4px; cursor: pointer;
        font-size: 1.2rem;
        display: flex; align-items: center; justify-content: center;
      }
      .nb-chapter-add:hover { background: rgba(255,255,255,0.25); }
      .nb-topbar-right { display: flex; align-items: center; gap: 0.5rem; }
      .nb-topbar-btn {
        background: rgba(255,255,255,0.15);
        border: none; color: #fff;
        padding: 0.4rem 0.8rem; border-radius: 4px;
        cursor: pointer; font-size: 0.85rem;
      }
      .nb-topbar-btn:hover { background: rgba(255,255,255,0.25); }
      .nb-section-index {
        display: flex; align-items: center; gap: 0.3rem;
        background: rgba(255,255,255,0.1);
        padding: 0.3rem 0.6rem; border-radius: 4px;
        cursor: pointer;
      }
      .nb-section-index:hover { background: rgba(255,255,255,0.2); }
      body { padding-top: 48px !important; }
      .sidebar { top: 48px !important; height: calc(100vh - 48px) !important; }
      #status-bar { top: 48px !important; }
    `;
    document.head.appendChild(style);
  }
}

function escapeHtml(t) {
  return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function initTopBar(options = {}) {
  const topbar = new TopBarNotebook(options);
  topbar.init();
  
  // 定期更新 section count
  setInterval(() => topbar.updateSectionCount(), 2000);
  
  // 监听 DOM 变化
  const main = document.querySelector(options.mainContentSelector || '#main-content');
  if (main) {
    const obs = new MutationObserver(() => topbar.updateSectionCount());
    obs.observe(main, { childList: true, subtree: true });
  }
  
  // 关闭前保存
  window.addEventListener('beforeunload', () => topbar.saveNotebook());
  
  return topbar;
}
