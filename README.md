# Chladni Patterns v3 - 协议驱动架构

## 核心理念

**GUI 与业务完全解耦，通过协议通信**

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  SliderGUI  │ ←── │   Protocol   │ ──→ │ plotService │
│  (纯UI)     │     │ {params,     │     │ (业务逻辑)  │
│             │     │  getPlot()}  │     │             │
└─────────────┘     └──────────────┘     └─────────────┘
```

## 目录结构

```
src/
├── core/
│   ├── gui/                    # 纯 GUI 组件（不知道业务）
│   │   ├── SliderGUI.js
│   │   ├── IDEGUI.js
│   │   ├── ManualInputGUI.js
│   │   ├── HeaderGUI.js
│   │   ├── CodeDisplayGUI.js
│   │   └── AddSectionGUI.js
│   ├── modules/
│   ├── services/
│   └── ...
├── sections/
│   └── index.js                # 所有 Section 声明（超简洁！）
└── python/
    └── *.py.js                 # Python 项目定义
```

## Section 声明有多简洁？

```javascript
// sections/index.js
export function createSections(project) {
  return [
    { name: 'header', order: 10, hasOutput: false, gui: HeaderGUI,
      protocol: { title: project.meta.title, description: project.meta.description } },

    { name: 'sliders', title: '🎛️ Slider Controls', order: 20, hasOutput: true, gui: SliderGUI,
      protocol: createParamsProtocol(project) },

    { name: 'ide', title: '🧪 Python IDE', order: 50, hasOutput: true, gui: IDEGUI,
      protocol: createIDEProtocol(project) },
    
    // 添加10个不同配置的 section？只需复制粘贴改参数！
  ];
}
```

## 协议设计

### Slider/ManualInput 协议
```javascript
{
  params: {
    a: { min: -10, max: 10, step: 0.5, default: 1, label: '系数 a' },
    n: { min: 0, max: 10, step: 1, default: 2, label: '频率 n' },
  },
  getPlot: (params) => plotService.generatePlot(params)
}
```

### IDE 协议
```javascript
{
  code: '...',                    // Python 代码
  defaultCall: 'func(a=1, n=2)', // 默认调用
  execute: (code) => pythonRunner.execute(code)
}
```

## GUI 组件完全不知道业务

```javascript
// SliderGUI.js
export async function SliderGUI(container, protocol, updatePlot) {
  const { params, getPlot } = protocol;  // 只知道协议
  
  // 渲染 UI...
  // 调用 getPlot(state) 获取结果
  // 不知道 plotService 存在！
}
```

## 好处

1. **GUI 可复用** - 同一个 SliderGUI 可以配不同协议
2. **声明式** - 添加 Section 只需几行配置
3. **可测试** - mock 协议就能测 GUI
4. **解耦** - 改业务不影响 UI，改 UI 不影响业务
