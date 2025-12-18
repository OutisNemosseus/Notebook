// pythonRunner.js - Python 运行时

import * as engine from './pyodideEngine.js';

let initialized = false;

export async function init({ packages = [], onStatus = () => {} } = {}) {
  if (initialized) return;
  
  onStatus('Loading Python runtime...');
  await engine.load();

  if (packages.length > 0) {
    onStatus('Loading packages: ' + packages.join(', ') + '...');
    await engine.loadPackages(packages);
  }

  initialized = true;
  onStatus('Runtime ready');
}

export async function registerFunction(name, code) {
  if (!initialized) throw new Error('Runtime not initialized');
  await engine.execute(code);
}

export async function call(funcName, params = {}) {
  if (!initialized) throw new Error('Runtime not initialized');
  
  const args = Object.entries(params)
    .map(([k, v]) => k + '=' + v)
    .join(', ');
  
  return await engine.execute(funcName + '(' + args + ')');
}

export async function execute(code) {
  if (!initialized) throw new Error('Runtime not initialized');
  return await engine.execute(code);
}

export function isReady() {
  return initialized;
}
