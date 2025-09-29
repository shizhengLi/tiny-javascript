/**
 * 虚拟键盘组件
 */
export class VirtualKeyboard {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = {
      layout: 'qwerty',
      onClick: null,
      letterStates: new Map(),
      ...options
    };

    this.keyboardElement = null;
    this.keys = new Map();

    this.layouts = {
      qwerty: [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
      ]
    };

    this.init();
  }

  /**
   * 初始化键盘
   */
  init() {
    this.createKeyboard();
    this.bindEvents();
  }

  /**
   * 创建键盘DOM结构
   */
  createKeyboard() {
    this.keyboardElement = document.createElement('div');
    this.keyboardElement.className = 'keyboard';

    const layout = this.layouts[this.options.layout];

    layout.forEach((row, rowIndex) => {
      const rowElement = document.createElement('div');
      rowElement.className = 'keyboard-row';

      row.forEach(key => {
        const keyElement = this.createKey(key, rowIndex);
        rowElement.appendChild(keyElement);
        this.keys.set(key, keyElement);
      });

      this.keyboardElement.appendChild(rowElement);
    });

    this.container.appendChild(this.keyboardElement);
  }

  /**
   * 创建按键
   */
  createKey(keyValue, rowIndex) {
    const keyElement = document.createElement('button');
    keyElement.className = 'key';
    keyElement.dataset.key = keyValue;
    keyElement.textContent = this.getKeyDisplay(keyValue);

    // 根据按键类型添加特殊类
    if (keyValue === 'ENTER' || keyValue === 'BACK') {
      keyElement.classList.add('key-wide');
    }

    // 设置按键状态
    const state = this.options.letterStates.get(keyValue);
    if (state) {
      keyElement.classList.add(state);
    }

    return keyElement;
  }

  /**
   * 获取按键显示文本
   */
  getKeyDisplay(keyValue) {
    switch (keyValue) {
      case 'BACK':
        return '⌫';
      case 'ENTER':
        return 'ENTER';
      default:
        return keyValue;
    }
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    this.keyboardElement.addEventListener('click', (e) => {
      if (e.target.classList.contains('key')) {
        this.handleKeyClick(e.target.dataset.key);
      }
    });

    // 支持键盘事件
    document.addEventListener('keydown', (e) => this.handlePhysicalKey(e));
  }

  /**
   * 处理按键点击
   */
  handleKeyClick(keyValue) {
    if (this.options.onClick) {
      this.options.onClick(keyValue);
    }

    // 添加点击动画
    const keyElement = this.keys.get(keyValue);
    if (keyElement) {
      keyElement.classList.add('pressed');
      setTimeout(() => keyElement.classList.remove('pressed'), 100);
    }
  }

  /**
   * 处理物理键盘按键
   */
  handlePhysicalKey(event) {
    let keyValue = null;

    if (event.key === 'Enter') {
      keyValue = 'ENTER';
    } else if (event.key === 'Backspace') {
      keyValue = 'BACK';
    } else if (event.key.match(/^[a-zA-Z]$/)) {
      keyValue = event.key.toUpperCase();
    }

    if (keyValue && this.keys.has(keyValue)) {
      this.handleKeyClick(keyValue);
      event.preventDefault();
    }
  }

  /**
   * 更新按键状态
   */
  updateKeyState(letter, state) {
    const keyElement = this.keys.get(letter.toUpperCase());
    if (keyElement) {
      // 移除旧状态
      keyElement.classList.remove('correct', 'present', 'absent');

      // 添加新状态
      if (state !== 'unused') {
        keyElement.classList.add(state);
      }

      // 更新状态映射
      this.options.letterStates.set(letter.toUpperCase(), state);
    }
  }

  /**
   * 批量更新按键状态
   */
  updateKeyStates(letterStates) {
    letterStates.forEach((state, letter) => {
      this.updateKeyState(letter, state);
    });
  }

  /**
   * 获取按键状态
   */
  getKeyState(letter) {
    return this.options.letterStates.get(letter.toUpperCase()) || 'unused';
  }

  /**
   * 设置按键回调
   */
  setOnClick(callback) {
    this.options.onClick = callback;
  }

  /**
   * 启用/禁用键盘
   */
  setEnabled(enabled) {
    this.keyboardElement.classList.toggle('disabled', !enabled);
    this.keys.forEach(keyElement => {
      keyElement.disabled = !enabled;
    });
  }

  /**
   * 高亮按键
   */
  highlightKey(keyValue, highlight = true) {
    const keyElement = this.keys.get(keyValue);
    if (keyElement) {
      keyElement.classList.toggle('highlight', highlight);
    }
  }

  /**
   * 获取所有按键状态
   */
  getAllKeyStates() {
    const states = {};
    this.options.letterStates.forEach((state, letter) => {
      states[letter] = state;
    });
    return states;
  }

  /**
   * 重置键盘状态
   */
  reset() {
    this.options.letterStates.clear();
    this.keys.forEach(keyElement => {
      keyElement.className = 'key';
      if (keyElement.dataset.key === 'ENTER' || keyElement.dataset.key === 'BACK') {
        keyElement.classList.add('key-wide');
      }
    });
  }

  /**
   * 更改键盘布局
   */
  setLayout(layoutName) {
    if (this.layouts[layoutName]) {
      this.options.layout = layoutName;
      this.rebuildKeyboard();
    }
  }

  /**
   * 重建键盘
   */
  rebuildKeyboard() {
    if (this.keyboardElement && this.keyboardElement.parentNode) {
      this.keyboardElement.parentNode.removeChild(this.keyboardElement);
    }
    this.keys.clear();
    this.createKeyboard();
  }

  /**
   * 获取键盘元素
   */
  getElement() {
    return this.keyboardElement;
  }

  /**
   * 聚焦到键盘
   */
  focus() {
    this.keyboardElement.focus();
  }

  /**
   * 销毁键盘
   */
  destroy() {
    document.removeEventListener('keydown', this.handlePhysicalKey);
    if (this.keyboardElement && this.keyboardElement.parentNode) {
      this.keyboardElement.parentNode.removeChild(this.keyboardElement);
    }
    this.keys.clear();
  }
}