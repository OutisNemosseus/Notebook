// pyodideEngine.js - Pyodide 引擎封装

let pyodide = null;

export async function load() {
  if (pyodide) return pyodide;
  pyodide = await loadPyodide();
  return pyodide;
}

export async function loadPackages(packages) {
  if (!pyodide) throw new Error('Engine not loaded');
  await pyodide.loadPackage(packages);
}

export async function execute(code) {
  if (!pyodide) throw new Error('Engine not loaded');
  
  // 捕获 stdout 和 stderr
  await pyodide.runPythonAsync(`
import sys
from io import StringIO
__stdout_capture__ = StringIO()
__stderr_capture__ = StringIO()
__old_stdout__ = sys.stdout
__old_stderr__ = sys.stderr
sys.stdout = __stdout_capture__
sys.stderr = __stderr_capture__
`);

  let result;
  let error = null;
  
  try {
    result = await pyodide.runPythonAsync(code);
  } catch (e) {
    error = e;
  }
  
  // 获取捕获的输出
  const stdout = await pyodide.runPythonAsync('__stdout_capture__.getvalue()');
  const stderr = await pyodide.runPythonAsync('__stderr_capture__.getvalue()');
  
  // 恢复 stdout/stderr
  await pyodide.runPythonAsync(`
sys.stdout = __old_stdout__
sys.stderr = __old_stderr__
`);

  if (error) {
    throw error;
  }
  
  // 优先返回 stdout，然后是返回值
  if (stdout && stdout.trim()) {
    return stdout.trim();
  }
  
  if (stderr && stderr.trim()) {
    return 'stderr: ' + stderr.trim();
  }
  
  // 返回表达式的值（如果有）
  if (result !== undefined && result !== null) {
    return String(result);
  }
  
  return '';
}

export function isLoaded() {
  return pyodide !== null;
}

