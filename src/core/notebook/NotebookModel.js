// notebook/NotebookModel.js - Notebook 数据模型
// 定义 Notebook 的数据结构

/**
 * Cell 类型枚举
 */
export const CellType = {
  CODE: 'code',
  MARKDOWN: 'markdown',
  LATEX: 'latex',
  SLIDER: 'slider',
  IMAGE: 'image',
  HTML: 'html'
};

/**
 * Cell 状态
 */
export const CellStatus = {
  IDLE: 'idle',
  RUNNING: 'running',
  SUCCESS: 'success',
  ERROR: 'error'
};

/**
 * 单个 Cell
 */
export class Cell {
  constructor(options = {}) {
    this.id = options.id || generateId();
    this.type = options.type || CellType.CODE;
    this.language = options.language || 'python';
    this.content = options.content || '';
    this.output = options.output || null;
    this.status = options.status || CellStatus.IDLE;
    this.metadata = options.metadata || {};
    this.createdAt = options.createdAt || Date.now();
    this.updatedAt = options.updatedAt || Date.now();
  }
  
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      language: this.language,
      content: this.content,
      output: this.output,
      status: this.status,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
  
  static fromJSON(json) {
    return new Cell(json);
  }
}

/**
 * 章节 (包含多个 Cells)
 */
export class Chapter {
  constructor(options = {}) {
    this.id = options.id || generateId();
    this.title = options.title || 'Untitled Chapter';
    this.cells = (options.cells || []).map(c => c instanceof Cell ? c : Cell.fromJSON(c));
    this.collapsed = options.collapsed || false;
    this.metadata = options.metadata || {};
    this.order = options.order || 0;
  }
  
  addCell(cell, index = -1) {
    if (index === -1) {
      this.cells.push(cell);
    } else {
      this.cells.splice(index, 0, cell);
    }
    return cell;
  }
  
  removeCell(cellId) {
    const index = this.cells.findIndex(c => c.id === cellId);
    if (index !== -1) {
      return this.cells.splice(index, 1)[0];
    }
    return null;
  }
  
  moveCell(cellId, newIndex) {
    const cell = this.removeCell(cellId);
    if (cell) {
      this.addCell(cell, newIndex);
    }
  }
  
  getCell(cellId) {
    return this.cells.find(c => c.id === cellId);
  }
  
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      cells: this.cells.map(c => c.toJSON()),
      collapsed: this.collapsed,
      metadata: this.metadata,
      order: this.order
    };
  }
  
  static fromJSON(json) {
    return new Chapter(json);
  }
}

/**
 * Notebook (整个文档)
 */
export class Notebook {
  constructor(options = {}) {
    this.id = options.id || generateId();
    this.title = options.title || 'Untitled Notebook';
    this.description = options.description || '';
    this.chapters = (options.chapters || []).map(c => 
      c instanceof Chapter ? c : Chapter.fromJSON(c)
    );
    this.metadata = {
      version: '1.0.0',
      createdAt: options.metadata?.createdAt || Date.now(),
      updatedAt: options.metadata?.updatedAt || Date.now(),
      author: options.metadata?.author || '',
      tags: options.metadata?.tags || [],
      ...options.metadata
    };
    this.settings = {
      theme: 'light',
      defaultLanguage: 'python',
      autoSave: true,
      autoSaveInterval: 30000,  // 30 seconds
      ...options.settings
    };
  }
  
  // ============================================================
  // Chapter 操作
  // ============================================================
  
  addChapter(chapter, index = -1) {
    if (index === -1) {
      chapter.order = this.chapters.length;
      this.chapters.push(chapter);
    } else {
      this.chapters.splice(index, 0, chapter);
      this._reorderChapters();
    }
    this._markUpdated();
    return chapter;
  }
  
  removeChapter(chapterId) {
    const index = this.chapters.findIndex(c => c.id === chapterId);
    if (index !== -1) {
      const removed = this.chapters.splice(index, 1)[0];
      this._reorderChapters();
      this._markUpdated();
      return removed;
    }
    return null;
  }
  
  moveChapter(chapterId, newIndex) {
    const chapter = this.removeChapter(chapterId);
    if (chapter) {
      this.addChapter(chapter, newIndex);
    }
  }
  
  getChapter(chapterId) {
    return this.chapters.find(c => c.id === chapterId);
  }
  
  // ============================================================
  // Cell 快捷操作
  // ============================================================
  
  addCell(chapterId, cell, index = -1) {
    const chapter = this.getChapter(chapterId);
    if (chapter) {
      chapter.addCell(cell, index);
      this._markUpdated();
      return cell;
    }
    return null;
  }
  
  removeCell(chapterId, cellId) {
    const chapter = this.getChapter(chapterId);
    if (chapter) {
      const cell = chapter.removeCell(cellId);
      this._markUpdated();
      return cell;
    }
    return null;
  }
  
  getCell(cellId) {
    for (const chapter of this.chapters) {
      const cell = chapter.getCell(cellId);
      if (cell) return { cell, chapter };
    }
    return null;
  }
  
  // ============================================================
  // 遍历
  // ============================================================
  
  getAllCells() {
    return this.chapters.flatMap(ch => ch.cells);
  }
  
  getCodeCells() {
    return this.getAllCells().filter(c => c.type === CellType.CODE);
  }
  
  // ============================================================
  // 序列化
  // ============================================================
  
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      chapters: this.chapters.map(c => c.toJSON()),
      metadata: this.metadata,
      settings: this.settings
    };
  }
  
  static fromJSON(json) {
    return new Notebook(json);
  }
  
  // 导出为字符串
  serialize() {
    return JSON.stringify(this.toJSON(), null, 2);
  }
  
  // 从字符串导入
  static deserialize(jsonString) {
    return Notebook.fromJSON(JSON.parse(jsonString));
  }
  
  // ============================================================
  // 内部方法
  // ============================================================
  
  _reorderChapters() {
    this.chapters.forEach((ch, i) => ch.order = i);
  }
  
  _markUpdated() {
    this.metadata.updatedAt = Date.now();
  }
}

// ============================================================
// 辅助函数
// ============================================================

function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}

// ============================================================
// 工厂函数
// ============================================================

export function createCodeCell(content = '', language = 'python') {
  return new Cell({
    type: CellType.CODE,
    language,
    content
  });
}

export function createMarkdownCell(content = '') {
  return new Cell({
    type: CellType.MARKDOWN,
    language: 'markdown',
    content
  });
}

export function createSliderCell(config = {}) {
  return new Cell({
    type: CellType.SLIDER,
    content: JSON.stringify(config),
    metadata: { sliderConfig: config }
  });
}

export function createChapter(title, cells = []) {
  return new Chapter({ title, cells });
}

export function createNotebook(title, description = '') {
  const notebook = new Notebook({ title, description });
  // 添加默认章节
  notebook.addChapter(createChapter('Chapter 1', [
    createMarkdownCell('# Welcome\n\nStart writing here...'),
    createCodeCell('# Your code here\nprint("Hello, World!")')
  ]));
  return notebook;
}
