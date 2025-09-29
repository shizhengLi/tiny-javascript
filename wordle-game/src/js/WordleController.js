import { WordleGame } from './WordleGame.js';
import { WordValidator } from './WordValidator.js';
import { GameStateManager } from './GameStateManager.js';
import { GameBoard } from './GameBoard.js';
import { VirtualKeyboard } from './VirtualKeyboard.js';
import { GameStats } from './GameStats.js';

/**
 * Wordle游戏主控制器
 */
export class WordleController {
  constructor(options = {}) {
    this.options = {
      wordList: [],
      container: document.body,
      ...options
    };

    // 游戏组件
    this.game = null;
    this.validator = null;
    this.stateManager = null;
    this.board = null;
    this.keyboard = null;
    this.stats = null;

    // DOM元素
    this.gameBoard = null;
    this.keyboardContainer = null;
    this.statsContainer = null;
    this.statusElement = null;
    this.gameOverModal = null;

    this.init();
  }

  /**
   * 初始化游戏
   */
  init() {
    this.createDOMStructure();
    this.initializeComponents();
    this.setupEventListeners();
    this.startNewGame();
  }

  /**
   * 创建DOM结构
   */
  createDOMStructure() {
    // 检查容器中是否已有游戏元素
    this.gameBoard = this.options.container.querySelector('#game-board');
    this.keyboardContainer = this.options.container.querySelector('#keyboard');
    this.statsContainer = this.options.container.querySelector('.game-info');
    this.statusElement = this.options.container.querySelector('#game-status');
    this.gameOverModal = this.options.container.querySelector('#game-over-modal');

    // 如果没有找到元素，创建默认结构
    if (!this.gameBoard) {
      this.gameBoard = document.createElement('div');
      this.gameBoard.id = 'game-board';
      this.gameBoard.className = 'game-board';
      this.options.container.appendChild(this.gameBoard);
    }

    if (!this.keyboardContainer) {
      this.keyboardContainer = document.createElement('div');
      this.keyboardContainer.id = 'keyboard';
      this.keyboardContainer.className = 'keyboard';
      this.options.container.appendChild(this.keyboardContainer);
    }
  }

  /**
   * 初始化组件
   */
  initializeComponents() {
    // 初始化单词验证器
    this.validator = new WordValidator();

    // 初始化状态管理器
    this.stateManager = new GameStateManager();

    // 初始化游戏棋盘
    this.board = new GameBoard(this.gameBoard, {
      animations: true,
      maxGuesses: 6,
      wordLength: 5
    });

    // 初始化虚拟键盘
    this.keyboard = new VirtualKeyboard(this.keyboardContainer, {
      onClick: (key) => this.handleKeyPress(key)
    });

    // 初始化统计组件
    if (this.statsContainer) {
      this.stats = new GameStats(this.statsContainer);
    }

    // 设置棋盘按键回调
    this.board.setOnKeyPress((event) => {
      if (event.key.match(/^[a-zA-Z]$/)) {
        this.handleKeyPress(event.key.toUpperCase());
      } else if (event.key === 'Enter') {
        this.handleKeyPress('ENTER');
      } else if (event.key === 'Backspace') {
        this.handleKeyPress('BACK');
      }
    });
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 新游戏按钮
    const newGameBtn = this.options.container.querySelector('#new-game-btn');
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => this.startNewGame());
    }

    // 提示按钮
    const hintBtn = this.options.container.querySelector('#hint-btn');
    if (hintBtn) {
      hintBtn.addEventListener('click', () => this.showHint());
    }

    // 再玩一次按钮
    const playAgainBtn = this.options.container.querySelector('#play-again-btn');
    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => {
        this.hideGameOverModal();
        this.startNewGame();
      });
    }

    // 统计点击事件
    if (this.stats) {
      this.stats.getElement().addEventListener('click', () => {
        this.showDetailedStats();
      });
    }

    // 全局键盘事件监听器
    document.addEventListener('keydown', (event) => this.handleGlobalKeyPress(event));
  }

  /**
   * 开始新游戏
   */
  startNewGame() {
    // 获取单词列表
    const wordList = this.validator.exportWords().slice(0, 100); // 限制单词数量

    // 初始化新游戏
    const gameState = this.stateManager.initializeNewGame(wordList);

    // 创建游戏实例
    this.game = new WordleGame(wordList);
    this.game.targetWord = gameState.targetWord;

    // 重置UI组件
    this.board.reset();
    this.keyboard.reset();

    // 更新状态显示
    this.updateStatus('输入5个字母的单词');

    // 更新统计显示
    if (this.stats) {
      this.stats.updateStats(this.stateManager.getStatistics());
    }

    // 启用输入
    this.setInputEnabled(true);
  }

  /**
   * 处理按键输入
   */
  handleKeyPress(key) {
    if (!this.game || this.game.gameStatus !== 'playing') {
      return;
    }

    switch (key) {
      case 'BACK':
        this.handleBackspace();
        break;
      case 'ENTER':
        this.handleSubmit();
        break;
      default:
        this.handleLetter(key);
        break;
    }
  }

  /**
   * 处理全局键盘输入
   */
  handleGlobalKeyPress(event) {
    if (!this.game || this.game.gameStatus !== 'playing') {
      return;
    }

    // 阻止默认行为，避免页面滚动等
    if (event.key.match(/^[a-zA-Z]$/) || event.key === 'Enter' || event.key === 'Backspace') {
      event.preventDefault();
    }

    if (event.key.match(/^[a-zA-Z]$/)) {
      this.handleLetter(event.key.toUpperCase());
    } else if (event.key === 'Enter') {
      this.handleSubmit();
    } else if (event.key === 'Backspace') {
      this.handleBackspace();
    }
  }

  /**
   * 处理字母输入
   */
  handleLetter(letter) {
    if (this.game.addLetter(letter)) {
      this.board.addLetter(letter);
      this.updateStatus(`输入第 ${this.game.currentGuess.length}/5 个字母`);
    }
  }

  /**
   * 处理删除
   */
  handleBackspace() {
    if (this.game.removeLetter()) {
      this.board.removeLetter();
      this.updateStatus(`输入第 ${this.game.currentGuess.length}/5 个字母`);
    }
  }

  /**
   * 清除当前猜测
   */
  clearCurrentGuess() {
    // 清除游戏中的当前猜测
    while (this.game.currentGuess.length > 0) {
      this.game.removeLetter();
      this.board.removeLetter();
    }
    this.updateStatus('输入5个字母的单词');
  }

  /**
   * 处理提交
   */
  handleSubmit() {
    if (this.game.currentGuess.length !== 5) {
      this.board.showError('请输入5个字母');
      return;
    }

    const word = this.game.currentGuess;
    const validation = this.validator.validateWord(word);

    if (!validation.valid) {
      this.board.showError(validation.reason || '不是有效的单词');
      // 清除当前猜测，让用户可以重新输入
      this.clearCurrentGuess();
      return;
    }

    // 提交猜测到游戏逻辑
    const gameResult = this.game.submitGuess(word);
    if (!gameResult) {
      this.board.showError('提交失败');
      return;
    }

    // 提交猜测到状态管理器
    const gameState = this.stateManager.submitGuess(word);

    // 显示结果
    const currentRow = this.game.guesses.length - 1;
    const result = this.game.evaluateGuess(word, this.game.targetWord);
    this.board.showGuessResult(currentRow, result, word);

    // 更新键盘状态
    this.updateKeyboardState(word, result);

    // 检查游戏状态
    this.checkGameEnd();
  }

  /**
   * 更新键盘状态
   */
  updateKeyboardState(word, result) {
    for (let i = 0; i < word.length; i++) {
      const letter = word[i];
      const currentState = this.keyboard.getKeyState(letter);
      const newState = result[i];

      // 只更新为更好的状态（correct > present > absent）
      if (this.shouldUpdateKeyState(currentState, newState)) {
        this.keyboard.updateKeyState(letter, newState);
      }
    }
  }

  /**
   * 判断是否需要更新按键状态
   */
  shouldUpdateKeyState(currentState, newState) {
    if (newState === 'correct') return true;
    if (newState === 'present' && currentState !== 'correct') return true;
    if (newState === 'absent' && currentState === 'unused') return true;
    return false;
  }

  /**
   * 检查游戏是否结束
   */
  checkGameEnd() {
    if (this.game.gameStatus === 'won') {
      this.handleGameWon();
    } else if (this.game.gameStatus === 'lost') {
      this.handleGameLost();
    } else {
      // 游戏继续
      this.updateStatus(`还剩 ${this.game.maxGuesses - this.game.guesses.length} 次机会`);
    }
  }

  /**
   * 处理游戏获胜
   */
  handleGameWon() {
    this.updateStatus('🎉 恭喜你赢了！');
    this.setInputEnabled(false);

    // 延迟显示胜利弹窗
    setTimeout(() => {
      this.showGameOverModal(true);
      if (this.stats) {
        this.stats.showShareHint();
      }
    }, 1500);

    // 更新统计
    if (this.stats) {
      this.stats.updateStats(this.stateManager.getStatistics());
    }
  }

  /**
   * 处理游戏失败
   */
  handleGameLost() {
    this.updateStatus(`😔 游戏结束，答案是 ${this.game.targetWord}`);
    this.setInputEnabled(false);

    // 延迟显示失败弹窗
    setTimeout(() => {
      this.showGameOverModal(false);
    }, 1000);

    // 更新统计
    if (this.stats) {
      this.stats.updateStats(this.stateManager.getStatistics());
    }
  }

  /**
   * 显示游戏结束弹窗
   */
  showGameOverModal(won) {
    if (!this.gameOverModal) return;

    const resultElement = this.gameOverModal.querySelector('#game-result');
    const correctWordElement = this.gameOverModal.querySelector('#correct-word');

    if (resultElement) {
      resultElement.textContent = won ? '🎉 恭喜获胜！' : '😔 游戏结束';
    }

    if (correctWordElement) {
      correctWordElement.textContent = won ? '你太厉害了！' : `答案是：${this.game.targetWord}`;
    }

    this.gameOverModal.classList.remove('hidden');
  }

  /**
   * 隐藏游戏结束弹窗
   */
  hideGameOverModal() {
    if (this.gameOverModal) {
      this.gameOverModal.classList.add('hidden');
    }
  }

  /**
   * 显示详细统计
   */
  showDetailedStats() {
    if (this.stats) {
      this.stats.showDetailedStats(this.stateManager.getStatistics());
    }
  }

  /**
   * 显示提示
   */
  showHint() {
    if (!this.game || this.game.gameStatus !== 'playing') return;

    // 简单提示：显示一个正确位置的字母
    const targetWord = this.game.targetWord;
    const hints = [];

    for (let i = 0; i < targetWord.length; i++) {
      const letter = targetWord[i];
      const currentState = this.keyboard.getKeyState(letter);

      if (currentState === 'unused') {
        hints.push(`第 ${i + 1} 个字母是 ${letter}`);
        break;
      }
    }

    if (hints.length > 0) {
      this.board.showSuccess(hints[0]);
    } else {
      this.board.showSuccess('没有更多提示了！');
    }
  }

  /**
   * 更新状态显示
   */
  updateStatus(message) {
    if (this.statusElement) {
      this.statusElement.textContent = message;
    }
  }

  /**
   * 启用/禁用输入
   */
  setInputEnabled(enabled) {
    this.board.setEnabled(enabled);
    this.keyboard.setEnabled(enabled);
  }

  /**
   * 获取游戏状态
   */
  getGameState() {
    return {
      game: this.game ? this.game.getGameState() : null,
      statistics: this.stateManager.getStatistics(),
      settings: this.stateManager.getSettings()
    };
  }

  /**
   * 更新设置
   */
  updateSettings(newSettings) {
    this.stateManager.updateSettings(newSettings);

    // 应用设置到UI
    if (newSettings.darkTheme !== undefined) {
      document.body.classList.toggle('dark-theme', newSettings.darkTheme);
    }

    if (newSettings.animations !== undefined) {
      // 更新组件动画设置
      this.board.options.animations = newSettings.animations;
    }
  }

  /**
   * 重置游戏
   */
  reset() {
    this.stateManager.resetAll();
    this.startNewGame();
  }

  /**
   * 销毁游戏
   */
  destroy() {
    // 清理组件
    if (this.board) this.board.destroy();
    if (this.keyboard) this.keyboard.destroy();
    if (this.stats) this.stats.destroy();

    // 清理事件监听器
    this.removeEventListeners();
  }

  /**
   * 移除事件监听器
   */
  removeEventListeners() {
    const newGameBtn = this.options.container.querySelector('#new-game-btn');
    if (newGameBtn) {
      newGameBtn.removeEventListener('click', () => this.startNewGame());
    }

    const hintBtn = this.options.container.querySelector('#hint-btn');
    if (hintBtn) {
      hintBtn.removeEventListener('click', () => this.showHint());
    }

    const playAgainBtn = this.options.container.querySelector('#play-again-btn');
    if (playAgainBtn) {
      playAgainBtn.removeEventListener('click', () => {
        this.hideGameOverModal();
        this.startNewGame();
      });
    }

    // 移除全局键盘事件监听器
    document.removeEventListener('keydown', this.handleGlobalKeyPress);
  }
}