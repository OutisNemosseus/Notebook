// projectLoader.js - 加载项目配置

import { parseGuiProtocol, generateConfig } from './guiProtocol.js';

export async function loadProject(projectName) {
  const project = await import('../../python/' + projectName + '.py.js');
  
  const guiParams = parseGuiProtocol(project.GUI || '');
  const { parameters, order } = generateConfig(guiParams);
  
  return {
    meta: project.META,
    functionName: project.FUNCTION_NAME,
    code: project.CODE,
    parameters,
    order,
    download: project.DOWNLOAD || null
  };
}
