// codeHighlight.js - 代码高亮模块

let loaded = false;

export async function loadHighlightJS() {
  if (loaded) return;
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css';
  document.head.appendChild(link);
  
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/python.min.js');
  
  loaded = true;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function highlightCode(element) {
  if (window.hljs) {
    window.hljs.highlightElement(element);
  }
}

export function createCodeBlock(code, language = 'python') {
  const pre = document.createElement('pre');
  const codeEl = document.createElement('code');
  codeEl.className = 'language-' + language;
  codeEl.textContent = code;
  pre.appendChild(codeEl);
  pre.style.cssText = 'border-radius:0.5rem;overflow-x:auto;font-size:0.85rem;margin:0';
  return { pre, codeEl };
}
