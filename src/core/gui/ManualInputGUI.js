// ManualInputGUI.js - 纯手动输入 UI 组件
// 只知道协议，不知道任何业务逻辑

export async function ManualInputGUI(container, protocol, updatePlot) {
  const { params, getPlot } = protocol;
  
  const paramNames = Object.keys(params || {});
  if (paramNames.length === 0) {
    container.innerHTML = '<p style="color:#999">No parameters defined</p>';
    return { getPlotData: async () => null };
  }
  
  // 当前状态
  const state = {};
  paramNames.forEach(name => {
    state[name] = params[name].default;
  });
  
  // 渲染输入框
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-end';
  
  paramNames.forEach(name => {
    const p = params[name];
    const inputGroup = document.createElement('div');
    inputGroup.style.cssText = 'display:flex;flex-direction:column;gap:0.2rem';
    inputGroup.innerHTML = `
      <label style="font-size:0.85rem;color:#555">${p.label}</label>
      <input type="number" data-param="${name}" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.default}"
        style="width:70px;padding:0.4rem;border:1px solid #ccc;border-radius:4px">
    `;
    wrapper.appendChild(inputGroup);
  });
  
  // Apply 按钮
  const applyBtn = document.createElement('button');
  applyBtn.textContent = 'Apply';
  applyBtn.style.cssText = 'padding:0.4rem 1rem;border:1px solid #ccc;border-radius:4px;background:#f9fafb;cursor:pointer';
  wrapper.appendChild(applyBtn);
  
  container.appendChild(wrapper);

  // Apply 点击
  applyBtn.addEventListener('click', () => {
    paramNames.forEach(name => {
      const p = params[name];
      const input = container.querySelector(`input[data-param="${name}"]`);
      let v = parseFloat(input.value);
      if (isNaN(v)) v = p.default;
      v = Math.max(p.min, Math.min(p.max, v));
      input.value = v;
      state[name] = v;
    });
    updatePlot();
  });
  
  return {
    getPlotData: async () => getPlot(state)
  };
}
