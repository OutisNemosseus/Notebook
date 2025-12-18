// SidebarGUI.js - 左侧边栏
// 包含 Add Section 按钮和工具按钮

export async function SidebarGUI(container, protocol) {
  const { availableGUIs, onAdd, onExport, onClone } = protocol;
  
  container.innerHTML = `
    <div class="sidebar-content">
      <div class="sidebar-section">
        <h3 class="sidebar-title">Add Section</h3>
        <div class="add-buttons"></div>
      </div>
      
      <div class="sidebar-divider"></div>
      
      <div class="sidebar-section">
        <h3 class="sidebar-title">Tools</h3>
        <button class="sidebar-btn export-btn">
          <span class="btn-icon">📦</span>
          <span class="btn-text">Export HTML</span>
        </button>
        <button class="sidebar-btn clone-btn">
          <span class="btn-icon">📋</span>
          <span class="btn-text">Clone Window</span>
        </button>
      </div>
    </div>
  `;
  
  // 添加样式
  addSidebarStyles();
  
  // 渲染 Add 按钮
  const addButtonsContainer = container.querySelector('.add-buttons');
  availableGUIs.forEach(guiConfig => {
    const btn = document.createElement('button');
    btn.className = 'sidebar-btn add-btn';
    btn.innerHTML = `
      <span class="btn-icon">${guiConfig.icon}</span>
      <span class="btn-text">${guiConfig.label}</span>
    `;
    btn.style.setProperty('--btn-color', guiConfig.color);
    btn.onclick = () => onAdd(guiConfig);
    addButtonsContainer.appendChild(btn);
  });
  
  // Export 按钮
  container.querySelector('.export-btn').onclick = onExport;
  
  // Clone 按钮
  container.querySelector('.clone-btn').onclick = onClone;
}

function addSidebarStyles() {
  if (document.getElementById('sidebar-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'sidebar-styles';
  style.textContent = `
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
    
    .sidebar-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .sidebar-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .sidebar-title {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: #9ca3af;
      margin: 0 0 0.5rem 0;
      letter-spacing: 0.05em;
    }
    
    .sidebar-divider {
      height: 1px;
      background: #374151;
      margin: 0.5rem 0;
    }
    
    .sidebar-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.6rem 0.8rem;
      border: none;
      border-radius: 6px;
      background: #374151;
      color: #e5e7eb;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }
    
    .sidebar-btn:hover {
      background: #4b5563;
      transform: translateX(2px);
    }
    
    .sidebar-btn.add-btn:hover {
      background: var(--btn-color, #3b82f6);
    }
    
    .btn-icon {
      font-size: 1rem;
    }
    
    .btn-text {
      flex: 1;
    }
    
    /* 主内容区域偏移 */
    .main-content {
      margin-left: 220px;
      padding: 1rem 2rem;
      min-height: 100vh;
    }
    
    /* Section 可删除样式 */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .section-header h2 {
      margin: 0;
    }
    
    .section-remove-btn {
      padding: 0.3rem 0.6rem;
      background: transparent;
      color: #9ca3af;
      border: 1px solid #374151;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.2s;
    }
    
    .section-remove-btn:hover {
      background: #ef4444;
      color: white;
      border-color: #ef4444;
    }
    
    /* 响应式 */
    @media (max-width: 768px) {
      .sidebar {
        width: 60px;
        min-width: 60px;
        padding: 0.5rem;
      }
      
      .sidebar-title,
      .btn-text {
        display: none;
      }
      
      .sidebar-btn {
        justify-content: center;
        padding: 0.8rem;
      }
      
      .main-content {
        margin-left: 70px;
      }
    }
  `;
  document.head.appendChild(style);
}

export default SidebarGUI;
