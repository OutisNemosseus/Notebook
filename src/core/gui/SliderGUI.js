// SliderGUI.js - 纯 Slider UI 组件
// 只知道协议，不知道任何业务逻辑

let instanceId = 0;

export async function SliderGUI(container, protocol, updatePlot) {
  const { params, getPlot } = protocol;
  const id = ++instanceId;
  
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
  
  // 渲染每个 slider
  paramNames.forEach(name => {
    const p = params[name];
    const uid = `slider-${id}-${name}`;
    
    const row = document.createElement('div');
    row.className = 'param-row';
    row.innerHTML = `
      <button class="play-btn" data-param="${name}">▶</button>
      <div class="slider-container">
        <div class="slider-label-line">
          <span>${p.label}</span>
          <span class="value-display">${p.default}</span>
        </div>
        <input type="range" data-param="${name}" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.default}">
      </div>
    `;
    container.appendChild(row);

    const slider = row.querySelector('input[type="range"]');
    const valueDisplay = row.querySelector('.value-display');
    const playBtn = row.querySelector('.play-btn');

    // 滑块变化
    slider.addEventListener('input', () => {
      const v = parseFloat(slider.value);
      valueDisplay.textContent = Number.isInteger(v) ? v : v.toFixed(1);
      state[name] = v;
      updatePlot();
    });

    // 动画播放
    let animTimer = null;
    let animDir = 1;
    
    playBtn.addEventListener('click', () => {
      if (animTimer) {
        clearInterval(animTimer);
        animTimer = null;
        playBtn.textContent = '▶';
      } else {
        playBtn.textContent = '⏸';
        animTimer = setInterval(() => {
          let v = parseFloat(slider.value);
          v += animDir * p.step;
          if (v > p.max) { v = p.max; animDir = -1; }
          if (v < p.min) { v = p.min; animDir = 1; }
          slider.value = v;
          valueDisplay.textContent = Number.isInteger(v) ? v : v.toFixed(1);
          state[name] = v;
          updatePlot();
        }, 500);
      }
    });
  });
  
  // 返回 getPlotData（通过协议的 getPlot）
  return {
    getPlotData: async () => getPlot(state)
  };
}
