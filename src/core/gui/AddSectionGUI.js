// AddSectionGUI.js - 动态添加 Section 按钮

import { addDynamicSection } from '../modules/dynamicSection.js';

export async function AddSectionGUI(container, protocol) {
  const { availableGUIs, project } = protocol;
  
  container.innerHTML = `
    <div style="display:flex;gap:1rem;flex-wrap:wrap">
      ${availableGUIs.map((g, i) => `
        <button data-index="${i}" style="padding:0.8rem 1.5rem;background:${g.color};color:white;border:none;border-radius:8px;cursor:pointer;font-size:1rem;font-weight:500;transition:all 0.2s">
          ${g.icon} Add ${g.label}
        </button>
      `).join('')}
    </div>
    <p style="margin-top:0.8rem;color:#666;font-size:0.9rem">点击按钮在下方添加新的交互区块</p>
    <div class="dynamic-sections-container"></div>
  `;
  
  const dynamicContainer = container.querySelector('.dynamic-sections-container');
  
  // 绑定按钮点击
  availableGUIs.forEach((g, i) => {
    const btn = container.querySelector(`button[data-index="${i}"]`);
    btn.onclick = async () => {
      await addDynamicSection(g, g.createProtocol(), dynamicContainer, project);
    };
    btn.onmouseenter = () => btn.style.transform = 'translateY(-2px)';
    btn.onmouseleave = () => btn.style.transform = 'translateY(0)';
  });
}
