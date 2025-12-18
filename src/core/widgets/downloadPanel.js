// downloadPanel.js - 下载面板（支持多格式）

import { createDownloadButton } from './downloadButton.js';
import { parseDownloadProtocol } from '../modules/downloadProtocol.js';

export function createDownloadPanel({
  protocol,
  getImageData,
  convertImage = null,
  baseFilename = 'image'
}) {
  const formats = parseDownloadProtocol(protocol);
  
  if (formats.length === 0) return null;
  
  const panel = document.createElement('div');
  panel.className = 'download-panel';
  panel.style.cssText = 'display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.5rem';
  
  formats.forEach(({ ext, mime, label }) => {
    const btn = createDownloadButton({
      getData: async () => {
        const imgData = await getImageData();
        
        if (convertImage && mime !== 'image/png') {
          const converted = await convertImage(imgData, mime, ext);
          return { data: converted, type: mime };
        }
        
        return { data: imgData, type: mime };
      },
      filename: baseFilename + '.' + ext,
      label: label
    });
    
    panel.appendChild(btn);
  });
  
  return panel;
}

export async function convertImageFormat(base64Data, targetMime, ext) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      
      if (targetMime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);
      
      const quality = targetMime === 'image/jpeg' ? 0.92 : undefined;
      const dataUrl = canvas.toDataURL(targetMime, quality);
      resolve(dataUrl);
    };
    img.onerror = reject;
    img.src = base64Data;
  });
}

export function createImageDownloadPanel(imgElement, protocol, baseFilename = 'image') {
  return createDownloadPanel({
    protocol,
    getImageData: () => imgElement.src,
    convertImage: convertImageFormat,
    baseFilename
  });
}
