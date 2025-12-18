// main.js - 应用主入口

import { loadProject } from './core/modules/projectLoader.js';
import { renderAllSections } from './core/modules/sectionRenderer.js';
import { createSections, createSidebarConfig } from './sections/index.js';
import * as plotService from './core/services/plotService.js';
import { restorePageState, SidebarGUI } from './core/gui/index.js';
import { initTopBar } from './core/gui/TopBarNotebook.js';

async function main() {
  const statusEl = document.getElementById('status');
  const appEl = document.getElementById('app');
  
  const urlParams = new URLSearchParams(window.location.search);
  const projectName = urlParams.get('project') || 'chladni';
  const isRestoring = window.location.hash.startsWith('#restore=');
  
  console.log('[main] Starting, project:', projectName);
  
  // ============================================================
  // 0. 初始化 TopBar（完全独立，最先渲染）
  // ============================================================
  let topbar = null;
  try {
    topbar = initTopBar({
      mainContentSelector: '#main-content',
      onChapterChange: (chapterId) => {
        console.log('[main] Chapter changed:', chapterId);
      }
    });
    console.log('[main] TopBar initialized');
  } catch (error) {
    console.error('[main] TopBar error:', error);
  }
  
  // 创建布局（sidebar + main）
  appEl.innerHTML = `
    <div class="sidebar" id="sidebar"></div>
    <div class="main-content" id="main-content">
      <div id="main-loading" style="padding:2rem;color:#666">Loading content...</div>
    </div>
  `;
  addLayoutStyles();
  
  const sidebarEl = document.getElementById('sidebar');
  const mainContentEl = document.getElementById('main-content');
  
  let project = null;
  let sidebarConfig = null;
  
  // ============================================================
  // 1. 先加载 project 和渲染 sidebar（不依赖 Pyodide）
  // ============================================================
  try {
    statusEl.textContent = 'Loading project...';
    console.log('[main] Loading project...');
    project = await loadProject(projectName);
    document.title = project.meta.title;
    console.log('[main] Project loaded:', project.meta.title);
    
    // 渲染 sidebar（不需要等待 Pyodide）
    console.log('[main] Rendering sidebar...');
    sidebarConfig = createSidebarConfig(project, mainContentEl);
    await SidebarGUI(sidebarEl, sidebarConfig);
    console.log('[main] Sidebar rendered');
  } catch (error) {
    console.error('[main] Sidebar error:', error);
    sidebarEl.innerHTML = `<div style="color:#ef4444;padding:1rem">Sidebar Error: ${error.message}</div>`;
  }
  
  // ============================================================
  // 2. 然后加载 Pyodide 和渲染 main sections（独立）
  // ============================================================
  try {
    statusEl.textContent = 'Loading Python runtime...';
    console.log('[main] Initializing plot service...');
    
    await plotService.init(project.code, project.functionName, msg => {
      statusEl.textContent = msg;
      console.log('[main] plotService:', msg);
    });
    console.log('[main] Plot service ready');
    
    // 清空 loading 提示
    mainContentEl.innerHTML = '';
    
    statusEl.textContent = 'Rendering sections...';
    console.log('[main] Creating sections...');
    
    const sections = createSections(project);
    const contentSections = sections.filter(s => 
      !['export', 'clone', 'add-section'].includes(s.name)
    );
    console.log('[main] Rendering sections:', contentSections.map(s => s.name));
    
    await renderAllSections(contentSections, project.download, mainContentEl);
    console.log('[main] All sections rendered');
    
    statusEl.textContent = 'Ready';
    
    // 克隆恢复
    if (isRestoring && sidebarConfig) {
      statusEl.textContent = 'Restoring state...';
      restorePageState(sidebarConfig, mainContentEl, project);
      setTimeout(() => {
        statusEl.textContent = 'Ready (restored)';
      }, 2500);
    }
  } catch (error) {
    console.error('[main] Main content error:', error);
    statusEl.textContent = 'Error: ' + error.message;
    mainContentEl.innerHTML = `
      <div style="padding:2rem;background:#fef2f2;border-radius:8px;color:#991b1b">
        <h2>Error Loading Content</h2>
        <pre>${error.message}\n${error.stack || ''}</pre>
      </div>
    `;
  }
}

function addLayoutStyles() {
  if (document.getElementById('layout-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'layout-styles';
  style.textContent = `
    body {
      margin: 0;
      padding: 0;
      background: #f3f4f6;
    }
    
    .sidebar {
      width: 200px;
      min-width: 200px;
      background: #1f2937;
      color: #e5e7eb;
      padding: 1rem;
      height: 100vh;
      position: fixed;
      left: 0;
      top: 0;
      overflow-y: auto;
      box-shadow: 2px 0 10px rgba(0,0,0,0.1);
      z-index: 100;
    }
    
    .main-content {
      margin-left: 220px;
      padding: 1rem 2rem 3rem 2rem;
      min-height: 100vh;
    }
    
    #status-bar {
      margin-left: 220px;
      padding: 0.5rem 2rem;
      background: #fff;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    
    .app-section {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      padding: 1.5rem;
      margin-bottom: 1rem;
    }
    
    @media (max-width: 768px) {
      .sidebar {
        width: 60px;
        min-width: 60px;
        padding: 0.5rem;
      }
      .main-content {
        margin-left: 70px;
        padding: 1rem;
      }
      #status-bar {
        margin-left: 70px;
      }
    }
  `;
  document.head.appendChild(style);
}

main();
