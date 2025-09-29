/**
 * 游戏棋盘UI组件
 */
export class GameBoard {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = {
      maxGuesses: 6,
      wordLength: 5,
      animations: true,
      ...options
    };

    this.boardElement = null;
    this.rows = [];
    this.currentRow = 0;
    this.currentCol = 0;

    this.init();
  }

  /**
   * 初始化棋盘
   */
  init() {
    this.createBoard();
    this.bindEvents();
  }

  /**
   * 创建棋盘DOM结构
   */
  createBoard() {
    this.boardElement = document.createElement('div');
    this.boardElement.className = 'game-board';

    for (let row = 0; row < this.options.maxGuesses; row++) {
      const rowElement = this.createRow(row);
      this.boardElement.appendChild(rowElement);
      this.rows.push(rowElement);
    }

    this.container.appendChild(this.boardElement);
  }

  /**
   * 创建棋盘行
   */
  createRow(rowIndex) {
    const rowElement = document.createElement('div');
    rowElement.className = 'game-row';
    rowElement.dataset.row = rowIndex;

    for (let col = 0; col < this.options.wordLength; col++) {
      const tileElement = this.createTile(rowIndex, col);
      rowElement.appendChild(tileElement);
    }

    return rowElement;
  }

  /**
   * 创建棋盘格子
   */
  createTile(rowIndex, colIndex) {
    const tileElement = document.createElement('div');
    tileElement.className = 'game-tile';
    tileElement.dataset.row = rowIndex;
    tileElement.dataset.col = colIndex;
    tileElement.textContent = '';
    return tileElement;
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 键盘事件
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // 触摸事件支持
    if ('ontouchstart' in window) {
      this.boardElement.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    }
  }

  /**
   * 处理键盘输入
   */
  handleKeyDown(event) {
    // 阻止默认行为，避免页面滚动等
    if (event.key.match(/^[a-zA-Z]$/) || event.key === 'Enter' || event.key === 'Backspace') {
      event.preventDefault();
    }

    if (this.onKeyPress) {
      this.onKeyPress(event);
    }
  }

  /**
   * 处理触摸开始
   */
  handleTouchStart(event) {
    event.preventDefault();
  }

  /**
   * 添加字母到当前格子
   */
  addLetter(letter) {
    if (this.currentCol < this.options.wordLength) {
      const tile = this.getTile(this.currentRow, this.currentCol);
      if (tile) {
        tile.textContent = letter.toUpperCase();
        if (this.options.animations) {
          tile.classList.add('pop');
          setTimeout(() => tile.classList.remove('pop'), 100);
        }
        this.currentCol++;
        return true;
      }
    }
    return false;
  }

  /**
   * 删除最后一个字母
   */
  removeLetter() {
    if (this.currentCol > 0) {
      this.currentCol--;
      const tile = this.getTile(this.currentRow, this.currentCol);
      if (tile) {
        tile.textContent = '';
        if (this.options.animations) {
          tile.classList.add('shake');
          setTimeout(() => tile.classList.remove('shake'), 300);
        }
        return true;
      }
    }
    return false;
  }

  /**
   * 提交当前行
   */
  submitRow() {
    if (this.currentCol === this.options.wordLength) {
      const word = this.getCurrentWord();
      return word;
    }
    return null;
  }

  /**
   * 获取当前单词
   */
  getCurrentWord() {
    let word = '';
    for (let col = 0; col < this.options.wordLength; col++) {
      const tile = this.getTile(this.currentRow, col);
      word += tile.textContent;
    }
    return word;
  }

  /**
   * 清空当前行
   */
  clearCurrentRow() {
    for (let col = 0; col < this.options.wordLength; col++) {
      const tile = this.getTile(this.currentRow, col);
      tile.textContent = '';
      tile.className = 'game-tile';
    }
    this.currentCol = 0;
  }

  /**
   * 移动到下一行
   */
  moveToNextRow() {
    if (this.currentRow < this.options.maxGuesses - 1) {
      this.currentRow++;
      this.currentCol = 0;
    }
  }

  /**
   * 显示猜测结果
   */
  showGuessResult(rowIndex, result, word) {
    const rowElement = this.rows[rowIndex];
    if (!rowElement) return;

    const tiles = rowElement.querySelectorAll('.game-tile');

    // 延迟显示每个格子的动画
    result.forEach((status, index) => {
      setTimeout(() => {
        const tile = tiles[index];
        if (tile) {
          tile.classList.add('revealed', status);
          tile.textContent = word[index];
        }
      }, index * 100);
    });

    // 如果全部错误，添加摇摆动画
    if (result.every(status => status === 'absent')) {
      setTimeout(() => {
        rowElement.classList.add('shake');
        setTimeout(() => rowElement.classList.remove('shake'), 500);
      }, result.length * 100 + 200);
    }

    // 动画显示完成后，移动到下一行
    setTimeout(() => {
      this.moveToNextRow();
    }, result.length * 100 + 300);
  }

  /**
   * 显示错误信息
   */
  showError(message) {
    const currentRowElement = this.rows[this.currentRow];
    if (currentRowElement) {
      currentRowElement.classList.add('shake');
      setTimeout(() => currentRowElement.classList.remove('shake'), 500);
    }

    // 创建临时提示
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 2000);
    }, 10);
  }

  /**
   * 显示成功信息
   */
  showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 2000);
    }, 10);
  }

  /**
   * 获取指定格子
   */
  getTile(rowIndex, colIndex) {
    const rowElement = this.rows[rowIndex];
    if (!rowElement) return null;
    return rowElement.querySelector(`[data-col="${colIndex}"]`);
  }

  /**
   * 重置棋盘
   */
  reset() {
    this.currentRow = 0;
    this.currentCol = 0;

    this.rows.forEach((rowElement, rowIndex) => {
      const tiles = rowElement.querySelectorAll('.game-tile');
      tiles.forEach((tile, colIndex) => {
        tile.textContent = '';
        tile.className = 'game-tile';
        tile.dataset.row = rowIndex;
        tile.dataset.col = colIndex;
      });
      rowElement.className = 'game-row';
    });
  }

  /**
   * 设置按键回调
   */
  setOnKeyPress(callback) {
    this.onKeyPress = callback;
  }

  /**
   * 启用/禁用棋盘
   */
  setEnabled(enabled) {
    this.boardElement.style.pointerEvents = enabled ? 'auto' : 'none';
    this.boardElement.classList.toggle('disabled', !enabled);
  }

  /**
   * 获取当前行和列
   */
  getCurrentPosition() {
    return {
      row: this.currentRow,
      col: this.currentCol
    };
  }

  /**
   * 聚焦到棋盘
   */
  focus() {
    this.boardElement.focus();
  }

  /**
   * 销毁棋盘
   */
  destroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.boardElement && this.boardElement.parentNode) {
      this.boardElement.parentNode.removeChild(this.boardElement);
    }
  }
}