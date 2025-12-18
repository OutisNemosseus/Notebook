// HeaderGUI.js - 纯标题 UI 组件

export async function HeaderGUI(container, protocol) {
  const { title, description } = protocol;
  
  container.innerHTML = `
    <h1 style="margin:0 0 0.5rem 0">${title}</h1>
    <p style="margin:0;color:#666">${description}</p>
  `;
}
