// libraries/PythonLibraries.js - Python 预置库配置
// 职责：定义可用的 Python 库

import { LibraryConfig, LibraryType, LibraryBundle } from './LibraryInterface.js';

/**
 * 科学计算库
 */
export const numpy = new LibraryConfig({
  name: 'numpy',
  language: 'python',
  version: '1.24.0',
  description: 'Numerical computing library',
  type: LibraryType.PACKAGE,
  packages: ['numpy']
});

export const scipy = new LibraryConfig({
  name: 'scipy',
  language: 'python',
  version: '1.11.0',
  description: 'Scientific computing library',
  type: LibraryType.PACKAGE,
  packages: ['scipy'],
  dependencies: ['numpy']
});

export const matplotlib = new LibraryConfig({
  name: 'matplotlib',
  language: 'python',
  version: '3.7.0',
  description: 'Plotting library',
  type: LibraryType.PACKAGE,
  packages: ['matplotlib']
});

export const pandas = new LibraryConfig({
  name: 'pandas',
  language: 'python',
  version: '2.0.0',
  description: 'Data analysis library',
  type: LibraryType.PACKAGE,
  packages: ['pandas'],
  dependencies: ['numpy']
});

/**
 * 自定义绘图辅助库（源代码注入）
 */
export const plotHelper = new LibraryConfig({
  name: 'plotHelper',
  language: 'python',
  version: '1.0.0',
  description: 'Custom plotting helper functions',
  type: LibraryType.SOURCE,
  dependencies: ['matplotlib'],
  sourceCode: `
import matplotlib.pyplot as plt
import io
import base64

def get_plot_base64():
    """Convert current matplotlib figure to base64 string"""
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    buf.close()
    plt.close()
    return f"data:image/png;base64,{img_base64}"

def show_plot():
    """Display plot and return base64"""
    return get_plot_base64()
`
});

/**
 * 预定义的库组合
 */
export const ScienceBundle = new LibraryBundle('science')
  .add(numpy)
  .add(scipy)
  .add(matplotlib)
  .add(plotHelper);

export const DataAnalysisBundle = new LibraryBundle('data-analysis')
  .add(numpy)
  .add(pandas)
  .add(matplotlib)
  .add(plotHelper);

export const BasicBundle = new LibraryBundle('basic')
  .add(numpy)
  .add(matplotlib)
  .add(plotHelper);

/**
 * 所有可用的 Python 库
 */
export const pythonLibraries = {
  numpy,
  scipy,
  matplotlib,
  pandas,
  plotHelper
};

/**
 * 所有预定义的组合
 */
export const pythonBundles = {
  science: ScienceBundle,
  dataAnalysis: DataAnalysisBundle,
  basic: BasicBundle
};

export default pythonLibraries;
