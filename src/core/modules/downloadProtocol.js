// downloadProtocol.js - 解析 @download 协议

export function parseDownloadProtocol(code) {
  const formats = [];
  
  if (!code) return formats;
  
  const blockMatch = code.match(/@download-start([\s\S]*?)@download-end/);
  if (!blockMatch) return formats;
  
  const block = blockMatch[1];
  const lineRegex = /@download\s+(\w+):\s*([^\s]+)\s+"([^"]+)"/g;
  
  let match;
  while ((match = lineRegex.exec(block)) !== null) {
    const [_, ext, mime, label] = match;
    formats.push({ ext, mime, label });
  }
  
  return formats;
}
