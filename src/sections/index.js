// sections/index.js - Section 实例声明
// 每个 section 只需几行配置！

import { SliderGUI, ManualInputGUI, HeaderGUI, CodeDisplayGUI, AddSectionGUI, ExportGUI, UniversalEditorGUI, CloneGUI } from '../core/gui/index.js';
import * as plotService from '../core/services/plotService.js';
import { executePython, renderMarkdown, renderLatex } from '../core/transforms/index.js';
import { addDynamicSection } from '../core/modules/dynamicSection.js';

// ============================================================
// 协议工厂（复用）
// ============================================================

const createParamsProtocol = (project) => ({
  params: project.parameters,
  getPlot: (params) => plotService.generatePlot(params)
});

const createPythonProtocol = (defaultCode = 'print("Hello, World!")') => ({
  code: defaultCode,
  language: 'python',
  transform: executePython,
  runButtonText: '▶ Run',
  placeholder: '# Enter Python code here...'
});

const createMarkdownProtocol = (defaultCode = '') => ({
  code: defaultCode || `# Hello Markdown!

This is **bold** and *italic* text.

## Math Support

Inline math: $E = mc^2$

Block math:
$$\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$

## Code Block

\`\`\`python
def hello():
    print("Hello!")
\`\`\`

## List
- Item 1
- Item 2
- Item 3
`,
  language: 'markdown',
  transform: renderMarkdown,
  runButtonText: '👁️ Preview',
  placeholder: '# Enter Markdown here...'
});

const createLatexProtocol = (defaultCode = '') => ({
  code: defaultCode || `\\frac{\\partial u}{\\partial t} = \\alpha \\nabla^2 u

% 或者多行公式
\\begin{aligned}
\\nabla \\times \\mathbf{E} &= -\\frac{\\partial \\mathbf{B}}{\\partial t} \\\\
\\nabla \\times \\mathbf{B} &= \\mu_0 \\mathbf{J} + \\mu_0 \\epsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t}
\\end{aligned}`,
  language: 'latex',
  transform: renderLatex,
  runButtonText: '👁️ Render',
  placeholder: '% Enter LaTeX formula here...'
});

// ============================================================
// Section 声明 - 超简洁！
// ============================================================

export function createSections(project) {
  return [
    {
      name: 'header',
      order: 10,
      hasOutput: false,
      gui: HeaderGUI,
      protocol: { title: project.meta.title, description: project.meta.description }
    },

    {
      name: 'sliders',
      title: '🎛️ Slider Controls',
      order: 20,
      hasOutput: true,
      outputType: 'plot',
      gui: SliderGUI,
      protocol: createParamsProtocol(project)
    },

    {
      name: 'manual-input',
      title: '✏️ Manual Input',
      order: 30,
      hasOutput: true,
      outputType: 'plot',
      gui: ManualInputGUI,
      protocol: createParamsProtocol(project)
    },

    {
      name: 'code-display',
      title: '📄 Python Code',
      order: 40,
      hasOutput: false,
      gui: CodeDisplayGUI,
      protocol: { code: project.code, language: 'python' }
    },

    {
      name: 'python-ide',
      title: '🐍 Python IDE',
      order: 50,
      hasOutput: true,
      outputType: 'console',
      gui: UniversalEditorGUI,
      protocol: createPythonProtocol(project.code + '\n\n# 调用函数\n' + project.functionName + '(' + 
        (project.order || [])
          .filter(k => project.parameters[k])
          .map(k => k + '=' + project.parameters[k].default)
          .join(', ') + ')')
    },

    {
      name: 'markdown-editor',
      title: '📝 Markdown Editor',
      order: 52,
      hasOutput: true,
      outputType: 'html',
      gui: UniversalEditorGUI,
      protocol: createMarkdownProtocol()
    },

    {
      name: 'latex-editor',
      title: '📐 LaTeX Formula',
      order: 54,
      hasOutput: true,
      outputType: 'html',
      gui: UniversalEditorGUI,
      protocol: createLatexProtocol()
    },

    {
      name: 'export',
      title: '📦 Export & Clone',
      order: 55,
      hasOutput: false,
      gui: ExportGUI,
      protocol: {
        title: project.meta.title,
        code: project.code
      }
    },

    {
      name: 'clone',
      order: 56,
      hasOutput: false,
      gui: CloneGUI,
      protocol: {}
    },

    {
      name: 'add-section',
      title: '➕ Add New Section',
      order: 60,
      hasOutput: false,
      gui: AddSectionGUI,
      protocol: {
        project,
        availableGUIs: [
          { 
            gui: SliderGUI, 
            label: 'Slider', 
            icon: '🎛️', 
            color: '#3b82f6', 
            outputType: 'plot', 
            createProtocol: () => createParamsProtocol(project) 
          },
          { 
            gui: UniversalEditorGUI, 
            label: 'Python', 
            icon: '🐍', 
            color: '#10b981', 
            outputType: 'console', 
            createProtocol: () => createPythonProtocol() 
          },
          { 
            gui: UniversalEditorGUI, 
            label: 'Markdown', 
            icon: '📝', 
            color: '#8b5cf6', 
            outputType: 'html', 
            createProtocol: () => createMarkdownProtocol() 
          },
          { 
            gui: UniversalEditorGUI, 
            label: 'LaTeX', 
            icon: '📐', 
            color: '#f59e0b', 
            outputType: 'html', 
            createProtocol: () => createLatexProtocol() 
          }
        ]
      }
    }
  ];
}

// ============================================================
// 侧边栏配置
// ============================================================

export function createSidebarConfig(project, mainContentEl) {
  const availableGUIs = [
    { 
      gui: SliderGUI, 
      label: 'Slider', 
      icon: '🎛️', 
      color: '#3b82f6', 
      outputType: 'plot', 
      createProtocol: () => createParamsProtocol(project) 
    },
    { 
      gui: UniversalEditorGUI, 
      label: 'Python', 
      icon: '🐍', 
      color: '#10b981', 
      outputType: 'console', 
      createProtocol: () => createPythonProtocol() 
    },
    { 
      gui: UniversalEditorGUI, 
      label: 'Markdown', 
      icon: '📝', 
      color: '#8b5cf6', 
      outputType: 'html', 
      createProtocol: () => createMarkdownProtocol() 
    },
    { 
      gui: UniversalEditorGUI, 
      label: 'LaTeX', 
      icon: '📐', 
      color: '#f59e0b', 
      outputType: 'html', 
      createProtocol: () => createLatexProtocol() 
    }
  ];
  
  return {
    availableGUIs,
    
    onAdd: async (guiConfig, customProtocol = null) => {
      const protocol = customProtocol || guiConfig.createProtocol();
      await addDynamicSection(guiConfig, protocol, mainContentEl, project);
    },
    
    onExport: () => {
      exportPage(project);
    },
    
    onClone: () => {
      clonePage();
    }
  };
}

// Export 功能
function exportPage(project) {
  // 复用 ExportGUI 的逻辑
  const clone = document.body.cloneNode(true);
  
  // 删除侧边栏
  clone.querySelector('.sidebar')?.remove();
  
  // 删除所有删除按钮
  clone.querySelectorAll('.section-remove-btn').forEach(el => el.remove());
  clone.querySelectorAll('.editor-toolbar').forEach(el => el.remove());
  
  // 把 textarea 转成 pre
  clone.querySelectorAll('textarea').forEach(textarea => {
    const pre = document.createElement('pre');
    pre.textContent = textarea.value;
    pre.className = 'exported-code';
    textarea.parentNode.replaceChild(pre, textarea);
  });
  
  // 禁用输入
  clone.querySelectorAll('input, select').forEach(el => {
    el.disabled = true;
  });
  
  // 调整主内容区域
  const mainContent = clone.querySelector('.main-content');
  if (mainContent) {
    mainContent.style.marginLeft = '0';
  }
  
  // 收集图片和代码数据
  const images = [];
  clone.querySelectorAll('img').forEach((img, i) => {
    if (img.src && img.src.startsWith('data:image')) {
      img.setAttribute('data-img-index', i);
      images.push(img.src);
    }
  });
  
  const codes = [];
  clone.querySelectorAll('pre.exported-code, pre[data-code]').forEach((pre, i) => {
    pre.setAttribute('data-code-index', i);
    codes.push(pre.textContent);
  });
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.meta.title} - Snapshot</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.min.js"><\/script>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; max-width: 1000px; margin: 0 auto; padding: 2rem; background: #f3f4f6; }
    .main-content { margin-left: 0 !important; }
    .app-section { background: #fff; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .section-layout { display: flex; gap: 2rem; }
    .section-layout > div { flex: 1; min-width: 300px; }
    pre, .exported-code { background: #1f2937; color: #e5e7eb; padding: 1rem; border-radius: 0.5rem; overflow: auto; font-size: 0.85rem; white-space: pre-wrap; }
    img { max-width: 100%; border: 1px solid #ddd; border-radius: 0.5rem; }
    .html-output { border: 1px solid #ddd; border-radius: 0.5rem; padding: 1rem; background: #fff; }
    .download-bar { margin-top: 0.5rem; }
    .download-bar button { padding: 0.4rem 0.8rem; border: 1px solid #ccc; border-radius: 4px; background: #f9fafb; cursor: pointer; margin-right: 0.5rem; }
    .download-bar button:hover { background: #e5e7eb; }
    footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ddd; color: #999; font-size: 0.85rem; }
  </style>
</head>
<body>
  ${clone.querySelector('.main-content')?.innerHTML || clone.innerHTML}
  <footer>Exported - ${new Date().toLocaleString()}</footer>
  <script>
    const imageData = ${JSON.stringify(images)};
    const codeData = ${JSON.stringify(codes)};
    function downloadImage(i) { const a = document.createElement('a'); a.href = imageData[i]; a.download = 'image_'+(i+1)+'.png'; a.click(); }
    function downloadCode(i) { const b = new Blob([codeData[i]], {type:'text/plain'}); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'code_'+(i+1)+'.py'; a.click(); }
    function copyCode(i, btn) { navigator.clipboard.writeText(codeData[i]); btn.textContent = '✓ Copied'; setTimeout(() => btn.textContent = '📋 Copy', 1500); }
  <\/script>
</body>
</html>`;
  
  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = project.meta.title.replace(/[^a-zA-Z0-9]/g, '_') + '_snapshot.html';
  a.click();
}

// Clone 功能
function clonePage() {
  const state = collectPageState();
  const stateId = 'clone_' + Date.now();
  localStorage.setItem(stateId, JSON.stringify(state));
  
  const baseUrl = window.location.href.split('#')[0];
  window.open(baseUrl + '#restore=' + stateId, '_blank');
  
  setTimeout(() => localStorage.removeItem(stateId), 5 * 60 * 1000);
}

function collectPageState() {
  const state = { 
    timestamp: Date.now(), 
    sections: [],
    dynamicSections: []  // 新增：保存动态 section 的完整信息
  };
  
  // 收集所有 textarea 的值
  document.querySelectorAll('textarea').forEach((textarea, i) => {
    const section = textarea.closest('.app-section, section');
    state.sections.push({
      type: 'textarea',
      sectionId: section?.id || `textarea-${i}`,
      value: textarea.value
    });
  });
  
  // 收集所有 input 的值
  document.querySelectorAll('input').forEach((input, i) => {
    const section = input.closest('.app-section, section');
    state.sections.push({
      type: 'input',
      sectionId: section?.id || `input-${i}`,
      inputType: input.type,
      name: input.name || input.className,
      value: input.type === 'checkbox' ? input.checked : input.value
    });
  });
  
  // 收集图片输出
  document.querySelectorAll('img').forEach((img, i) => {
    if (img.src?.startsWith('data:image')) {
      const section = img.closest('.app-section, section');
      state.sections.push({
        type: 'image',
        sectionId: section?.id || `img-${i}`,
        src: img.src
      });
    }
  });
  
  // 收集动态添加的 sections 完整信息
  document.querySelectorAll('.dynamic-section').forEach((section, i) => {
    const titleEl = section.querySelector('.section-header h2');
    const textarea = section.querySelector('textarea');
    const outputType = section.dataset.outputType || 'console';
    const guiType = section.dataset.guiType || 'python';
    
    state.dynamicSections.push({
      index: i,
      id: section.id,
      title: titleEl?.textContent || `Dynamic Section ${i + 1}`,
      code: textarea?.value || '',
      outputType,
      guiType
    });
  });
  
  return state;
}

// 导出给 main.js 使用
export { collectPageState };
