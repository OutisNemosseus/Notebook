// downloadButton.js - 通用下载按钮组件

export function createDownloadButton({
  getData,
  filename = 'download',
  label = 'Download',
  loadingLabel = '...',
  style = {}
}) {
  const button = document.createElement('button');
  button.textContent = label;
  
  const defaultStyle = {
    padding: '0.4rem 0.8rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    background: '#f9fafb',
    cursor: 'pointer',
    fontSize: '0.85rem'
  };
  
  Object.assign(button.style, defaultStyle, style);
  
  button.addEventListener('click', async () => {
    const originalText = button.textContent;
    button.textContent = loadingLabel;
    button.disabled = true;
    
    try {
      const { data, type } = await getData();
      download(data, filename, type);
      button.textContent = '✓';
      setTimeout(() => button.textContent = originalText, 1200);
    } catch (error) {
      button.textContent = '✗';
      console.error('Download failed:', error);
      setTimeout(() => button.textContent = originalText, 1500);
    } finally {
      button.disabled = false;
    }
  });
  
  return button;
}

export function download(data, filename, type = 'application/octet-stream') {
  let blob;
  
  if (typeof data === 'string' && data.startsWith('data:')) {
    const [header, base64] = data.split(',');
    const mimeMatch = header.match(/data:([^;]+)/);
    const mime = mimeMatch ? mimeMatch[1] : type;
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    blob = new Blob([array], { type: mime });
  } else if (data instanceof Blob) {
    blob = data;
  } else {
    blob = new Blob([data], { type });
  }
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
