// plotService.js - 绑图服务

import * as pythonRunner from '../runtime/pythonRunner.js';

let currentFunctionName = null;

export async function init(pythonCode, functionName, onStatus = () => {}) {
  currentFunctionName = functionName;
  
  await pythonRunner.init({
    packages: ['numpy', 'matplotlib'],
    onStatus
  });

  onStatus('Loading plot function...');
  await pythonRunner.registerFunction(functionName, pythonCode);
  onStatus('Ready');
}

export async function generatePlot(params) {
  return await pythonRunner.call(currentFunctionName, params);
}

export function isReady() {
  return pythonRunner.isReady();
}
