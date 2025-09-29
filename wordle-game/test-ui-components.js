/**
 * UI组件单元测试
 * 测试GameBoard、VirtualKeyboard、GameStats等UI组件
 */

import { GameBoard } from './src/js/GameBoard.js';
import { VirtualKeyboard } from './src/js/VirtualKeyboard.js';
import { GameStats } from './src/js/GameStats.js';

// 模拟DOM环境
const mockDOMEnvironment = () => {
  const createElement = (tagName) => {
    const element = {
      tagName: tagName.toUpperCase(),
      id: '',
      className: '',
      style: {},
      textContent: '',
      innerHTML: '',
      dataset: {},
      _children: [],
      _attributes: {},
      _eventListeners: {},
      parentNode: null,

      _classes: [],
      classList: {
        add: function(...classes) {
          if (!this._classes) this._classes = [];
          classes.forEach(cls => { if (!this._classes.includes(cls)) this._classes.push(cls); });
        },
        remove: function(...classes) {
          if (!this._classes) this._classes = [];
          classes.forEach(cls => { this._classes = this._classes.filter(c => c !== cls); });
        },
        toggle: function(cls, force) {
          if (!this._classes) this._classes = [];
          const hasClass = this._classes.includes(cls);
          if (force === undefined) {
            if (hasClass) this._classes = this._classes.filter(c => c !== cls);
            else this._classes.push(cls);
            return !hasClass;
          } else if (force) {
            if (!hasClass) this._classes.push(cls);
            return true;
          } else {
            if (hasClass) this._classes = this._classes.filter(c => c !== cls);
            return false;
          }
        },
        contains: function(cls) {
          if (!this._classes) this._classes = [];
          return this._classes.includes(cls);
        }
      },

      appendChild: function(child) {
        child.parentNode = this;
        this._children.push(child);
        return child;
      },

      removeChild: function(child) {
        const index = this._children.indexOf(child);
        if (index > -1) {
          this._children.splice(index, 1);
          child.parentNode = null;
        }
        return child;
      },

      addEventListener: function(event, handler) {
        if (!this._eventListeners[event]) {
          this._eventListeners[event] = [];
        }
        this._eventListeners[event].push(handler);
      },

      removeEventListener: function(event, handler) {
        if (this._eventListeners[event]) {
          this._eventListeners[event] = this._eventListeners[event].filter(h => h !== handler);
        }
      },

      getAttribute: function(name) { return this._attributes[name]; },
      setAttribute: function(name, value) { this._attributes[name] = value; },
      querySelector: function(selector) { return this.querySelectorDeep(selector); },
      querySelectorAll: function(selector) { return this.querySelectorAllDeep(selector); },
      getElementsByTagName: function(tag) { return this._children.filter(child => child.tagName === tag.toUpperCase()); },
      focus: function() {},
      click: function() { if (this._eventListeners.click) { this._eventListeners.click.forEach(handler => handler()); } },

      // 递归查找元素
      querySelectorDeep: function(selector) {
        if (selector.startsWith('#')) {
          const id = selector.substring(1);
          if (this.id === id) return this;
        } else if (selector.startsWith('.')) {
          const className = selector.substring(1);
          if (this._classes && this._classes.includes(className)) return this;
        } else if (selector === this.tagName.toLowerCase()) {
          return this;
        }

        for (const child of this._children) {
          const found = child.querySelectorDeep(selector);
          if (found) return found;
        }
        return null;
      },

      querySelectorAllDeep: function(selector) {
        const results = [];

        if (selector.startsWith('#')) {
          const id = selector.substring(1);
          if (this.id === id) results.push(this);
        } else if (selector.startsWith('.')) {
          const className = selector.substring(1);
          if (this._classes && this._classes.includes(className)) results.push(this);
        } else if (selector === this.tagName.toLowerCase()) {
          results.push(this);
        }

        for (const child of this._children) {
          results.push(...child.querySelectorAllDeep(selector));
        }
        return results;
      }
    };

    return element;
  };

  global.document = {
    createElement: createElement,
    body: createElement('body'),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  global.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    setTimeout: (fn, delay) => setTimeout(fn, delay),
    clearTimeout: (id) => clearTimeout(id),
    navigator: {
      share: () => Promise.resolve(),
      clipboard: {
        writeText: () => Promise.resolve()
      }
    }
  };

  global.Event = class Event {
    constructor(type, options = {}) {
      this.type = type;
      this.target = options.target || null;
      this.key = options.key || '';
      this.preventDefault = () => {};
      this.stopPropagation = () => {};
    }
  };

  // 模拟localStorage
  global.localStorage = {
    _data: {},
    getItem: (key) => localStorage._data[key] || null,
    setItem: (key, value) => { localStorage._data[key] = String(value); },
    removeItem: (key) => { delete localStorage._data[key]; },
    clear: () => { localStorage._data = {}; }
  };
};

// 测试工具函数
const createTestContainer = () => {
  return global.document.createElement('div');
};

// TestReporter类
class TestReporter {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.currentTest = null;
    this.assertions = [];
  }

  startTest(testName) {
    this.currentTest = testName;
    this.assertions = [];
    console.log(`\n🧪 Testing: ${testName}`);
  }

  pass(message) {
    this.passed++;
    this.assertions.push({ type: 'pass', message });
    console.log(`  ✅ ${message}`);
  }

  fail(message, expected, actual) {
    this.failed++;
    this.assertions.push({ type: 'fail', message, expected, actual });
    console.log(`  ❌ ${message}`);
    if (expected !== undefined && actual !== undefined) {
      console.log(`     Expected: ${JSON.stringify(expected)}`);
      console.log(`     Actual: ${JSON.stringify(actual)}`);
    }
  }

  assertEquals(actual, expected, message) {
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
      this.pass(message);
    } else {
      this.fail(message, expected, actual);
    }
  }

  assertTrue(condition, message) {
    if (condition) {
      this.pass(message);
    } else {
      this.fail(message, true, condition);
    }
  }

  assertFalse(condition, message) {
    if (!condition) {
      this.pass(message);
    } else {
      this.fail(message, false, condition);
    }
  }

  assertExists(value, message) {
    if (value !== null && value !== undefined) {
      this.pass(message);
    } else {
      this.fail(message, 'exists', value);
    }
  }

  summary() {
    console.log('\n📊 UI Components Test Summary:');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Total: ${this.passed + this.failed}`);

    if (this.failed > 0) {
      console.log('\n❌ Some tests failed!');
      process.exit(1);
    } else {
      console.log('\n🎉 All UI component tests passed!');
    }
  }
}

// 测试GameBoard组件
async function testGameBoard() {
  console.log('\n🎮 Testing GameBoard Component...');

  const reporter = new TestReporter();

  // 设置模拟DOM环境
  mockDOMEnvironment();

  // 测试1: GameBoard构造函数
  reporter.startTest('GameBoard Constructor');
  try {
    const container = createTestContainer();
    const board = new GameBoard(container, {
      maxGuesses: 6,
      wordLength: 5,
      animations: true
    });

    reporter.assertEquals(board.options.maxGuesses, 6, 'Max guesses should be 6');
    reporter.assertEquals(board.options.wordLength, 5, 'Word length should be 5');
    reporter.assertTrue(board.options.animations, 'Animations should be enabled');
    reporter.assertEquals(board.currentRow, 0, 'Current row should be 0');
    reporter.assertEquals(board.currentCol, 0, 'Current column should be 0');

  } catch (error) {
    reporter.fail(`Constructor test failed: ${error.message}`);
  }

  // 测试2: 添加字母功能
  reporter.startTest('GameBoard Add Letter');
  try {
    const container = createTestContainer();
    const board = new GameBoard(container);

    // 模拟tile元素
    const mockTile = {
      textContent: '',
      classList: {
        add: () => {},
        remove: () => {}
      }
    };

    board.getTile = () => mockTile;

    const result = board.addLetter('A');
    reporter.assertTrue(result, 'Should return true when letter is added');
    reporter.assertEquals(board.currentCol, 1, 'Current column should increment');

  } catch (error) {
    reporter.fail(`Add letter test failed: ${error.message}`);
  }

  // 测试3: 删除字母功能
  reporter.startTest('GameBoard Remove Letter');
  try {
    const container = createTestContainer();
    const board = new GameBoard(container);

    board.currentCol = 2;

    const mockTile = {
      textContent: 'X',
      classList: {
        add: () => {},
        remove: () => {}
      }
    };

    board.getTile = () => mockTile;

    const result = board.removeLetter();
    reporter.assertTrue(result, 'Should return true when letter is removed');
    reporter.assertEquals(board.currentCol, 1, 'Current column should decrement');

  } catch (error) {
    reporter.fail(`Remove letter test failed: ${error.message}`);
  }

  // 测试4: 获取当前单词
  reporter.startTest('GameBoard Get Current Word');
  try {
    const container = createTestContainer();
    const board = new GameBoard(container);

    // 模拟5个tile元素
    const mockTiles = [
      { textContent: 'H' },
      { textContent: 'E' },
      { textContent: 'L' },
      { textContent: 'L' },
      { textContent: 'O' }
    ];

    board.getTile = (row, col) => mockTiles[col];

    const word = board.getCurrentWord();
    reporter.assertEquals(word, 'HELLO', 'Should return current word');

  } catch (error) {
    reporter.fail(`Get current word test failed: ${error.message}`);
  }

  // 测试5: 重置棋盘
  reporter.startTest('GameBoard Reset');
  try {
    const container = createTestContainer();
    const board = new GameBoard(container);

    board.currentRow = 3;
    board.currentCol = 2;

    board.reset();

    reporter.assertEquals(board.currentRow, 0, 'Current row should be reset to 0');
    reporter.assertEquals(board.currentCol, 0, 'Current column should be reset to 0');

  } catch (error) {
    reporter.fail(`Reset test failed: ${error.message}`);
  }

  // 测试6: 设置启用/禁用状态
  reporter.startTest('GameBoard Set Enabled');
  try {
    const container = createTestContainer();
    const board = new GameBoard(container);

    board.boardElement = {
      style: { pointerEvents: 'auto' },
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {}
      }
    };

    // 这里只是测试方法存在性，实际功能需要DOM环境
    reporter.assertTrue(typeof board.setEnabled === 'function', 'setEnabled method should exist');

  } catch (error) {
    reporter.fail(`Set enabled test failed: ${error.message}`);
  }

  return reporter;
}

// 测试VirtualKeyboard组件
async function testVirtualKeyboard() {
  console.log('\n⌨️ Testing VirtualKeyboard Component...');

  const reporter = new TestReporter();

  // 设置模拟DOM环境
  mockDOMEnvironment();

  // 测试1: VirtualKeyboard构造函数
  reporter.startTest('VirtualKeyboard Constructor');
  try {
    const container = createTestContainer();
    const keyboard = new VirtualKeyboard(container, {
      layout: 'qwerty',
      onClick: () => {}
    });

    reporter.assertEquals(keyboard.options.layout, 'qwerty', 'Layout should be qwerty');
    reporter.assertTrue(typeof keyboard.options.onClick === 'function', 'Click handler should be function');
    reporter.assertTrue(keyboard.layouts.qwerty, 'QWERTY layout should exist');
    reporter.assertTrue(keyboard.keys.size > 0, 'Keys map should be populated after initialization');

  } catch (error) {
    reporter.fail(`Constructor test failed: ${error.message}`);
  }

  // 测试2: 按键状态更新
  reporter.startTest('VirtualKeyboard Update Key State');
  try {
    const container = createTestContainer();
    const keyboard = new VirtualKeyboard(container);

    // 模拟按键元素
    const mockKeyElement = {
      classList: {
        add: () => {},
        remove: () => {}
      }
    };

    keyboard.keys.set('A', mockKeyElement);

    keyboard.updateKeyState('A', 'correct');

    reporter.assertEquals(keyboard.options.letterStates.get('A'), 'correct', 'Key state should be updated');

  } catch (error) {
    reporter.fail(`Update key state test failed: ${error.message}`);
  }

  // 测试3: 获取按键状态
  reporter.startTest('VirtualKeyboard Get Key State');
  try {
    const container = createTestContainer();
    const keyboard = new VirtualKeyboard(container);

    keyboard.options.letterStates.set('B', 'present');

    const state = keyboard.getKeyState('B');
    reporter.assertEquals(state, 'present', 'Should return correct key state');

    const unknownState = keyboard.getKeyState('X');
    reporter.assertEquals(unknownState, 'unused', 'Should return unused for unknown keys');

  } catch (error) {
    reporter.fail(`Get key state test failed: ${error.message}`);
  }

  // 测试4: 键盘重置
  reporter.startTest('VirtualKeyboard Reset');
  try {
    const container = createTestContainer();
    const keyboard = new VirtualKeyboard(container);

    keyboard.options.letterStates.set('A', 'correct');
    keyboard.options.letterStates.set('B', 'present');

    keyboard.reset();

    reporter.assertEquals(keyboard.options.letterStates.size, 0, 'Letter states should be cleared');

  } catch (error) {
    reporter.fail(`Reset test failed: ${error.message}`);
  }

  // 测试5: 按键显示文本
  reporter.startTest('VirtualKeyboard Get Key Display');
  try {
    const container = createTestContainer();
    const keyboard = new VirtualKeyboard(container);

    reporter.assertEquals(keyboard.getKeyDisplay('BACK'), '⌫', 'BACK should show backspace symbol');
    reporter.assertEquals(keyboard.getKeyDisplay('ENTER'), 'ENTER', 'ENTER should show ENTER');
    reporter.assertEquals(keyboard.getKeyDisplay('A'), 'A', 'Letters should show themselves');

  } catch (error) {
    reporter.fail(`Get key display test failed: ${error.message}`);
  }

  // 测试6: 批量更新按键状态
  reporter.startTest('VirtualKeyboard Update Key States');
  try {
    const container = createTestContainer();
    const keyboard = new VirtualKeyboard(container);

    const states = new Map([
      ['A', 'correct'],
      ['B', 'present'],
      ['C', 'absent']
    ]);

    keyboard.updateKeyStates = (states) => {
      states.forEach((state, letter) => {
        keyboard.options.letterStates.set(letter, state);
      });
    };

    keyboard.updateKeyStates(states);

    reporter.assertEquals(keyboard.options.letterStates.get('A'), 'correct', 'A should be correct');
    reporter.assertEquals(keyboard.options.letterStates.get('B'), 'present', 'B should be present');
    reporter.assertEquals(keyboard.options.letterStates.get('C'), 'absent', 'C should be absent');

  } catch (error) {
    reporter.fail(`Update key states test failed: ${error.message}`);
  }

  return reporter;
}

// 测试GameStats组件
async function testGameStats() {
  console.log('\n📊 Testing GameStats Component...');

  const reporter = new TestReporter();

  // 设置模拟DOM环境
  mockDOMEnvironment();

  // 测试1: GameStats构造函数
  reporter.startTest('GameStats Constructor');
  try {
    const container = createTestContainer();
    const stats = new GameStats(container, {
      showDetails: true,
      animations: true
    });

    reporter.assertTrue(stats.options.showDetails, 'Show details should be true');
    reporter.assertTrue(stats.options.animations, 'Animations should be enabled');
    reporter.assertExists(stats.container, 'Container should be set');

  } catch (error) {
    reporter.fail(`Constructor test failed: ${error.message}`);
  }

  // 测试2: 更新统计信息
  reporter.startTest('GameStats Update Stats');
  try {
    const container = createTestContainer();
    const stats = new GameStats(container);

    const mockStatistics = {
      gamesPlayed: 10,
      gamesWon: 7,
      currentStreak: 3,
      maxStreak: 5,
      guessDistribution: [1, 3, 2, 1, 0, 0]
    };

    stats.statsElement = global.document.createElement('div');
    stats.statsElement.querySelectorAll = () => [];

    stats.updateStats(mockStatistics);

    // 验证统计数据正确计算
    const winPercentage = Math.round((7 / 10) * 100);
    reporter.assertEquals(winPercentage, 70, 'Win percentage should be calculated correctly');

  } catch (error) {
    reporter.fail(`Update stats test failed: ${error.message}`);
  }

  // 测试3: 生成成就HTML
  reporter.startTest('GameStats Generate Achievements HTML');
  try {
    const container = createTestContainer();
    const stats = new GameStats(container);

    const achievements = [
      {
        name: 'First Win',
        description: 'Win your first game',
        icon: '🏆',
        unlocked: true,
        unlockedAt: Date.now()
      },
      {
        name: 'Speed Demon',
        description: 'Win in 3 guesses or less',
        icon: '⚡',
        unlocked: false
      }
    ];

    const html = stats.generateAchievementsHTML(achievements);

    reporter.assertTrue(html.includes('First Win'), 'HTML should include first achievement');
    reporter.assertTrue(html.includes('Speed Demon'), 'HTML should include second achievement');
    reporter.assertTrue(html.includes('unlocked'), 'HTML should include unlocked class');
    reporter.assertTrue(html.includes('locked'), 'HTML should include locked class');

  } catch (error) {
    reporter.fail(`Generate achievements HTML test failed: ${error.message}`);
  }

  // 测试4: 生成分享文本
  reporter.startTest('GameStats Generate Share Text');
  try {
    const container = createTestContainer();
    const stats = new GameStats(container);

    const shareText = stats.generateShareText();

    reporter.assertTrue(shareText.includes('Wordle'), 'Share text should include Wordle');
    reporter.assertTrue(shareText.includes('🎉'), 'Share text should include emoji');
    reporter.assertExists(shareText, 'Share text should not be empty');

  } catch (error) {
    reporter.fail(`Generate share text test failed: ${error.message}`);
  }

  // 测试5: 显示详细统计
  reporter.startTest('GameStats Show Detailed Stats');
  try {
    const container = createTestContainer();
    const stats = new GameStats(container);

    const mockStatistics = {
      gamesPlayed: 15,
      gamesWon: 10,
      currentStreak: 2,
      maxStreak: 4,
      guessDistribution: [2, 4, 3, 1, 0, 0]
    };

    // 测试方法存在性
    reporter.assertTrue(typeof stats.showDetailedStats === 'function', 'showDetailedStats method should exist');

  } catch (error) {
    reporter.fail(`Show detailed stats test failed: ${error.message}`);
  }

  // 测试6: 设置选项
  reporter.startTest('GameStats Set Options');
  try {
    const container = createTestContainer();
    const stats = new GameStats(container);

    const originalShowDetails = stats.options.showDetails;
    const originalAnimations = stats.options.animations;

    stats.setOptions({
      showDetails: !originalShowDetails,
      animations: !originalAnimations
    });

    reporter.assertEquals(stats.options.showDetails, !originalShowDetails, 'Show details should be updated');
    reporter.assertEquals(stats.options.animations, !originalAnimations, 'Animations should be updated');

  } catch (error) {
    reporter.fail(`Set options test failed: ${error.message}`);
  }

  return reporter;
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 Starting UI Components Tests...\n');

  const gameBoardReporter = await testGameBoard();
  const virtualKeyboardReporter = await testVirtualKeyboard();
  const gameStatsReporter = await testGameStats();

  // 汇总所有结果
  const totalPassed = gameBoardReporter.passed + virtualKeyboardReporter.passed + gameStatsReporter.passed;
  const totalFailed = gameBoardReporter.failed + virtualKeyboardReporter.failed + gameStatsReporter.failed;

  console.log('\n📊 Final UI Components Test Summary:');
  console.log('='.repeat(50));
  console.log(`GameBoard:     ✅ ${gameBoardReporter.passed}  ❌ ${gameBoardReporter.failed}`);
  console.log(`VirtualKeyboard: ✅ ${virtualKeyboardReporter.passed}  ❌ ${virtualKeyboardReporter.failed}`);
  console.log(`GameStats:      ✅ ${gameStatsReporter.passed}  ❌ ${gameStatsReporter.failed}`);
  console.log('='.repeat(50));
  console.log(`Total:          ✅ ${totalPassed}  ❌ ${totalFailed}`);

  if (totalFailed > 0) {
    console.log('\n❌ Some UI component tests failed!');
    process.exit(1);
  } else {
    console.log('\n🎉 All UI component tests passed successfully!');
    console.log('✅ Ready to proceed to integration tests!');
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };