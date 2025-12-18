// guiProtocol.js - 解析 @gui 协议

export function parseGuiProtocol(code) {
  const params = [];
  
  if (!code) return params;
  
  const blockMatch = code.match(/@gui-start([\s\S]*?)@gui-end/);
  if (!blockMatch) return params;
  
  const block = blockMatch[1];
  const lineRegex = /@gui\s+(\w+):\s*(\w+)\(([^)]+)\)\s*"([^"]+)"/g;
  
  let match;
  while ((match = lineRegex.exec(block)) !== null) {
    const [_, name, type, argsStr, label] = match;
    const args = argsStr.split(',').map(s => parseFloat(s.trim()));
    
    params.push({
      name,
      type,
      label,
      min: args[0],
      max: args[1],
      step: args[2],
      default: args[3]
    });
  }
  
  return params;
}

export function generateConfig(params) {
  const config = {};
  const order = [];
  
  params.forEach(p => {
    config[p.name] = {
      id: p.name,
      label: p.label,
      min: p.min,
      max: p.max,
      step: p.step,
      default: p.default
    };
    order.push(p.name);
  });
  
  return { parameters: config, order };
}
