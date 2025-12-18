// state.js - 状态管理（每个 section 独立）

/**
 * 创建独立的状态管理器
 */
export function createState(initialParams = {}) {
  const state = {
    parameters: { ...initialParams }
  };
  
  return {
    setParameter(name, value) {
      state.parameters[name] = value;
    },
    
    getParameter(name) {
      return state.parameters[name];
    },
    
    getParameters() {
      return { ...state.parameters };
    },
    
    initParameters(config, order) {
      order.forEach(name => {
        state.parameters[name] = config[name].default;
      });
    }
  };
}

// 全局状态（向后兼容）
export const appState = createState();
