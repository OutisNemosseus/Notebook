// CloneGUI.js - 克隆页面到新窗口
// 完整复制当前页面，所有功能可用

export async function CloneGUI(container, protocol) {
  container.innerHTML = `
    <button class="clone-btn" style="padding:0.8rem 1.5rem;background:#8b5cf6;color:white;border:none;border-radius:8px;cursor:pointer;font-size:1rem;font-weight:500;transition:all 0.2s">
      📋 Clone to New Window
    </button>
    <p style="margin-top:0.5rem;color:#666;font-size:0.9rem">在新窗口打开完整副本（所有功能可用）</p>
  `;
  
  const btn = container.querySelector('.clone-btn');
  btn.onmouseenter = () => btn.style.transform = 'translateY(-2px)';
  btn.onmouseleave = () => btn.style.transform = 'translateY(0)';
  
  btn.onclick = () => {
    // 收集当前页面状态
    const state = collectPageState();
    
    // 序列化状态到 URL hash 或 localStorage
    const stateId = 'clone_' + Date.now();
    localStorage.setItem(stateId, JSON.stringify(state));
    
    // 获取当前页面 URL（不含 hash）
    const baseUrl = window.location.href.split('#')[0];
    
    // 打开新窗口，带上状态 ID
    const newWindow = window.open(baseUrl + '#restore=' + stateId, '_blank');
    
    // 5分钟后清理 localStorage
    setTimeout(() => {
      localStorage.removeItem(stateId);
    }, 5 * 60 * 1000);
  };
}

/**
 * 收集页面状态
 */
function collectPageState() {
  const state = {
    timestamp: Date.now(),
    sections: [],
    dynamicSections: []
  };
  
  // 收集所有 textarea 的值
  document.querySelectorAll('textarea').forEach((textarea, i) => {
    const section = textarea.closest('.app-section, section');
    const sectionId = section ? section.id : `textarea-${i}`;
    state.sections.push({
      type: 'textarea',
      sectionId,
      value: textarea.value
    });
  });
  
  // 收集所有 input 的值
  document.querySelectorAll('input').forEach((input, i) => {
    const section = input.closest('.app-section, section');
    const sectionId = section ? section.id : `input-${i}`;
    state.sections.push({
      type: 'input',
      sectionId,
      inputType: input.type,
      name: input.name || input.className,
      value: input.type === 'checkbox' ? input.checked : input.value
    });
  });
  
  // 收集图片输出
  document.querySelectorAll('img').forEach((img, i) => {
    if (img.src && img.src.startsWith('data:image')) {
      const section = img.closest('.app-section, section');
      const sectionId = section ? section.id : `img-${i}`;
      state.sections.push({
        type: 'image',
        sectionId,
        src: img.src
      });
    }
  });
  
  // 收集 console 输出
  document.querySelectorAll('pre').forEach((pre, i) => {
    const section = pre.closest('.app-section, section');
    if (section && section.querySelector('.html-output, [id*="console"]')) {
      state.sections.push({
        type: 'console',
        sectionId: section.id,
        content: pre.textContent
      });
    }
  });
  
  // 收集动态添加的 sections 信息
  document.querySelectorAll('.dynamic-section').forEach((section, i) => {
    const title = section.querySelector('h2');
    const textarea = section.querySelector('textarea');
    state.dynamicSections.push({
      index: i,
      title: title ? title.textContent : '',
      code: textarea ? textarea.value : ''
    });
  });
  
  return state;
}

/**
 * 恢复页面状态（在页面加载时调用）
 */
export function restorePageState(sidebarConfig = null, mainContentEl = null, project = null) {
  // 检查 URL hash
  const hash = window.location.hash;
  if (!hash.startsWith('#restore=')) return false;
  
  const stateId = hash.replace('#restore=', '');
  const stateJson = localStorage.getItem(stateId);
  
  if (!stateJson) {
    console.warn('Clone state not found:', stateId);
    return false;
  }
  
  try {
    const state = JSON.parse(stateJson);
    
    // 延迟恢复，等待页面渲染完成
    setTimeout(async () => {
      await applyPageState(state, sidebarConfig, mainContentEl, project);
      // 清理 URL hash
      history.replaceState(null, '', window.location.pathname + window.location.search);
      // 清理 localStorage
      localStorage.removeItem(stateId);
    }, 1500);
    
    return true;
  } catch (e) {
    console.error('Failed to restore state:', e);
    return false;
  }
}

/**
 * 应用状态到页面
 */
async function applyPageState(state, sidebarConfig, mainContentEl, project) {
  // 1. 先恢复动态 sections
  if (state.dynamicSections && state.dynamicSections.length > 0 && sidebarConfig && mainContentEl) {
    for (const dynSection of state.dynamicSections) {
      // 找到对应的 GUI 配置
      const guiConfig = sidebarConfig.availableGUIs.find(
        g => g.label.toLowerCase() === dynSection.guiType
      );
      
      if (guiConfig) {
        // 创建带有保存的代码的 protocol
        const protocol = guiConfig.createProtocol();
        if (dynSection.code) {
          protocol.code = dynSection.code;
        }
        
        // 动态添加 section
        await sidebarConfig.onAdd(guiConfig, protocol);
      }
    }
  }
  
  // 2. 等待动态 sections 渲染完成
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 3. 恢复 textarea 值
  state.sections.filter(s => s.type === 'textarea').forEach(s => {
    const section = document.getElementById(s.sectionId);
    if (section) {
      const textarea = section.querySelector('textarea');
      if (textarea) textarea.value = s.value;
    }
  });
  
  // 4. 恢复 input 值
  state.sections.filter(s => s.type === 'input').forEach(s => {
    const section = document.getElementById(s.sectionId);
    if (section) {
      let input;
      if (s.name) {
        input = section.querySelector(`input[name="${s.name}"], input.${s.name}`);
      }
      if (!input) {
        input = section.querySelector(`input[type="${s.inputType}"]`);
      }
      if (input) {
        if (s.inputType === 'checkbox') {
          input.checked = s.value;
        } else {
          input.value = s.value;
        }
        // 触发 change 事件
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  });
  
  // 5. 恢复图片
  state.sections.filter(s => s.type === 'image').forEach(s => {
    const section = document.getElementById(s.sectionId);
    if (section) {
      const img = section.querySelector('img');
      if (img) img.src = s.src;
    }
  });
  
  console.log('Page state restored from clone');
}
