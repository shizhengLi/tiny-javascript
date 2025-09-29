/**
 * Wordle游戏集成测试
 * 测试完整的游戏流程和用户交互场景
 */

import { WordleController } from './src/js/WordleController.js';
import { WordleGame } from './src/js/WordleGame.js';
import { WordValidator } from './src/js/WordValidator.js';
import { GameStateManager } from './src/js/GameStateManager.js';

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
    querySelector: (selector) => {
      if (selector === '#game-board') return createElement('div');
      if (selector === '#keyboard') return createElement('div');
      if (selector === '.game-info') return createElement('div');
      if (selector === '#game-status') return createElement('div');
      if (selector === '#game-over-modal') return createElement('div');
      if (selector === '#new-game-btn') return createElement('button');
      if (selector === '#hint-btn') return createElement('button');
      if (selector === '#play-again-btn') return createElement('button');
      return null;
    },
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
    console.log('\n📊 Integration Test Summary:');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Total: ${this.passed + this.failed}`);

    if (this.failed > 0) {
      console.log('\n❌ Some integration tests failed!');
      process.exit(1);
    } else {
      console.log('\n🎉 All integration tests passed!');
    }
  }
}

// 测试完整游戏流程
async function testCompleteGameFlow() {
  console.log('\n🎮 Testing Complete Game Flow...');

  const reporter = new TestReporter();

  // 设置模拟DOM环境
  mockDOMEnvironment();

  // 测试1: 游戏控制器初始化
  reporter.startTest('Game Controller Initialization');
  try {
    const container = global.document.createElement('div');
    const wordList = ['APPLE', 'BRAVE', 'CRAZY', 'DREAM', 'EAGLE'];

    const controller = new WordleController({
      container: container,
      wordList: wordList
    });

    reporter.assertExists(controller, 'Controller should be created');
    reporter.assertExists(controller.game, 'Game should be initialized');
    reporter.assertExists(controller.validator, 'Validator should be initialized');
    reporter.assertExists(controller.stateManager, 'State manager should be initialized');
    reporter.assertExists(controller.board, 'Board should be initialized');
    reporter.assertExists(controller.keyboard, 'Keyboard should be initialized');

  } catch (error) {
    reporter.fail(`Controller initialization test failed: ${error.message}`);
  }

  // 测试2: 完整游戏胜利流程
  reporter.startTest('Complete Game Win Flow');
  try {
    const container = global.document.createElement('div');
    const wordList = ['APPLE', 'BRAVE', 'CRAZY', 'DREAM', 'EAGLE'];

    const controller = new WordleController({
      container: container,
      wordList: wordList
    });

    // 获取目标单词
    const targetWord = controller.game.targetWord;
    console.log(`Target word: ${targetWord}`);

    // 使用一个肯定在验证器列表中的单词
    const validWord = 'APPLE';

    // 重置游戏并设置一个我们知道的目标单词
    controller.game.targetWord = validWord;

    // 模拟输入目标单词
    for (let i = 0; i < validWord.length; i++) {
      controller.handleLetter(validWord[i]);
    }

    // 提交猜测
    controller.handleSubmit();

    // 验证游戏状态
    reporter.assertEquals(controller.game.gameStatus, 'won', 'Game should be won');

    // 检查猜测的单词是否在guesses数组中
    const guessedWord = controller.game.guesses.find(guess => guess.word === validWord);
    reporter.assertTrue(guessedWord !== undefined, 'Target word should be in guesses');
    reporter.assertEquals(controller.game.guesses.length, 1, 'Should have 1 guess');

  } catch (error) {
    reporter.fail(`Game win flow test failed: ${error.message}`);
  }

  // 测试3: 多次猜测后胜利
  reporter.startTest('Multiple Guesses Win Flow');
  try {
    const container = global.document.createElement('div');
    const wordList = ['APPLE', 'BRAVE', 'CRAZY', 'DREAM', 'EAGLE'];

    const controller = new WordleController({
      container: container,
      wordList: wordList
    });

    // 设置一个我们知道的目标单词
    const targetWord = 'BRAVE';
    controller.game.targetWord = targetWord;

    // 故意输入错误的单词几次（使用有效的但错误的单词）
    const wrongGuesses = ['APPLE', 'CRAZY', 'DREAM'];
    for (const wrongGuess of wrongGuesses) {
      if (controller.game.gameStatus === 'playing') {
        for (let i = 0; i < wrongGuess.length; i++) {
          controller.handleLetter(wrongGuess[i]);
        }
        controller.handleSubmit();
      }
    }

    // 输入正确的单词
    if (controller.game.gameStatus === 'playing') {
      for (let i = 0; i < targetWord.length; i++) {
        controller.handleLetter(targetWord[i]);
      }
      controller.handleSubmit();
    }

    // 验证游戏状态
    reporter.assertEquals(controller.game.gameStatus, 'won', 'Game should be won');

    // 检查猜测的单词是否在guesses数组中
    const guessedWord = controller.game.guesses.find(guess => guess.word === targetWord);
    reporter.assertTrue(guessedWord !== undefined, 'Target word should be in guesses');
    reporter.assertTrue(controller.game.guesses.length >= 1, 'Should have at least 1 guess');

  } catch (error) {
    reporter.fail(`Multiple guesses win flow test failed: ${error.message}`);
  }

  // 测试4: 游戏失败流程
  reporter.startTest('Game Loss Flow');
  try {
    const container = global.document.createElement('div');
    const wordList = ['APPLE', 'BRAVE', 'CRAZY', 'DREAM', 'EAGLE'];

    const controller = new WordleController({
      container: container,
      wordList: wordList
    });

    // 设置一个我们知道的目标单词
    const targetWord = 'EAGLE';
    controller.game.targetWord = targetWord;

    // 输入6次有效的但错误的单词
    const wrongGuesses = ['APPLE', 'BRAVE', 'CRAZY', 'DREAM', 'ABOUT', 'ABOVE'];
    for (const wrongGuess of wrongGuesses) {
      if (controller.game.gameStatus === 'playing') {
        for (let i = 0; i < wrongGuess.length; i++) {
          controller.handleLetter(wrongGuess[i]);
        }
        controller.handleSubmit();
      }
    }

    // 验证游戏状态
    reporter.assertEquals(controller.game.gameStatus, 'lost', 'Game should be lost');
    reporter.assertEquals(controller.game.guesses.length, 6, 'Should have 6 guesses');

  } catch (error) {
    reporter.fail(`Game loss flow test failed: ${error.message}`);
  }

  // 测试5: 新游戏功能
  reporter.startTest('New Game Functionality');
  try {
    const container = global.document.createElement('div');
    const wordList = ['APPLE', 'BRAVE', 'CRAZY', 'DREAM', 'EAGLE'];

    const controller = new WordleController({
      container: container,
      wordList: wordList
    });

    // 记录第一个游戏的目标单词
    const firstTargetWord = controller.game.targetWord;

    // 完成第一个游戏
    for (let i = 0; i < firstTargetWord.length; i++) {
      controller.handleLetter(firstTargetWord[i]);
    }
    controller.handleSubmit();

    // 开始新游戏
    controller.startNewGame();

    // 验证新游戏状态
    reporter.assertEquals(controller.game.gameStatus, 'playing', 'New game should be playing');
    reporter.assertEquals(controller.game.guesses.length, 0, 'New game should have no guesses');
    reporter.assertEquals(controller.game.currentGuess.length, 0, 'New game should have empty current guess');

    // 验证是否选择了新的目标单词（可能相同，因为随机选择）
    reporter.assertExists(controller.game.targetWord, 'New game should have target word');

  } catch (error) {
    reporter.fail(`New game functionality test failed: ${error.message}`);
  }

  return reporter;
}

// 测试用户交互场景
async function testUserInteractionScenarios() {
  console.log('\n👤 Testing User Interaction Scenarios...');

  const reporter = new TestReporter();

  // 设置模拟DOM环境
  mockDOMEnvironment();

  // 测试1: 键盘输入交互
  reporter.startTest('Keyboard Input Interaction');
  try {
    const container = global.document.createElement('div');
    const wordList = ['APPLE', 'BRAVE', 'CRAZY', 'DREAM', 'EAGLE'];

    const controller = new WordleController({
      container: container,
      wordList: wordList
    });

    // 测试虚拟键盘输入
    controller.handleKeyPress('H');
    controller.handleKeyPress('E');
    controller.handleKeyPress('L');
    controller.handleKeyPress('L');
    controller.handleKeyPress('O');

    reporter.assertEquals(controller.game.currentGuess, 'HELLO', 'Current guess should be HELLO');
    reporter.assertEquals(controller.game.currentGuess.length, 5, 'Current guess should be 5 letters');

    // 测试删除功能
    controller.handleKeyPress('BACK');
    reporter.assertEquals(controller.game.currentGuess, 'HELL', 'Current guess should be HELL after backspace');

    // 测试Enter键提交
    controller.handleKeyPress('ENTER');
    // 应该显示错误，因为HELLO不在单词列表中
    reporter.assertEquals(controller.game.gameStatus, 'playing', 'Game should still be playing');

  } catch (error) {
    reporter.fail(`Keyboard input interaction test failed: ${error.message}`);
  }

  // 测试2: 单词验证交互
  reporter.startTest('Word Validation Interaction');
  try {
    const container = global.document.createElement('div');
    const wordList = ['APPLE', 'BRAVE', 'CRAZY', 'DREAM', 'EAGLE'];

    const controller = new WordleController({
      container: container,
      wordList: wordList
    });

    // 设置一个我们知道的目标单词
    const targetWord = 'BRAVE';
    controller.game.targetWord = targetWord;

    // 输入一个无效单词
    for (let i = 0; i < 5; i++) {
      controller.handleLetter('X');
    }
    controller.handleKeyPress('ENTER');

    reporter.assertEquals(controller.game.gameStatus, 'playing', 'Game should still be playing after invalid word');
    reporter.assertEquals(controller.game.guesses.length, 0, 'No guesses should be recorded for invalid word');

    // 输入有效单词
    for (let i = 0; i < targetWord.length; i++) {
      controller.handleLetter(targetWord[i]);
    }
    controller.handleKeyPress('ENTER');

    // 检查猜测的单词是否在guesses数组中
    const guessedWord = controller.game.guesses.find(guess => guess.word === targetWord);
    reporter.assertTrue(guessedWord !== undefined, 'Valid word should be recorded');

  } catch (error) {
    reporter.fail(`Word validation interaction test failed: ${error.message}`);
  }

  // 测试3: 提示功能交互
  reporter.startTest('Hint Feature Interaction');
  try {
    const container = global.document.createElement('div');
    const wordList = ['APPLE', 'BRAVE', 'CRAZY', 'DREAM', 'EAGLE'];

    const controller = new WordleController({
      container: container,
      wordList: wordList
    });

    // 测试提示功能
    controller.showHint();

    // 验证游戏仍在进行中
    reporter.assertEquals(controller.game.gameStatus, 'playing', 'Game should still be playing after hint');

  } catch (error) {
    reporter.fail(`Hint feature interaction test failed: ${error.message}`);
  }

  // 测试4: 游戏状态管理交互
  reporter.startTest('Game State Management Interaction');
  try {
    const container = global.document.createElement('div');
    const wordList = ['APPLE', 'BRAVE', 'CRAZY', 'DREAM', 'EAGLE'];

    const controller = new WordleController({
      container: container,
      wordList: wordList
    });

    // 获取初始游戏状态
    const initialState = controller.getGameState();
    reporter.assertExists(initialState.game, 'Initial game state should exist');
    reporter.assertExists(initialState.statistics, 'Initial statistics should exist');
    reporter.assertExists(initialState.settings, 'Initial settings should exist');

    // 玩一局游戏
    const targetWord = controller.game.targetWord;
    for (let i = 0; i < targetWord.length; i++) {
      controller.handleLetter(targetWord[i]);
    }
    controller.handleKeyPress('ENTER');

    // 获取更新后的游戏状态
    const updatedState = controller.getGameState();
    reporter.assertExists(updatedState.game, 'Updated game state should exist');
    reporter.assertExists(updatedState.statistics, 'Updated statistics should exist');
    reporter.assertExists(updatedState.settings, 'Updated settings should exist');

    // 验证统计信息更新
    reporter.assertTrue(updatedState.statistics.gamesPlayed >= 1, 'Games played should be at least 1');

  } catch (error) {
    reporter.fail(`Game state management interaction test failed: ${error.message}`);
  }

  // 测试5: 设置更新交互
  reporter.startTest('Settings Update Interaction');
  try {
    const container = global.document.createElement('div');
    const wordList = ['APPLE', 'BRAVE', 'CRAZY', 'DREAM', 'EAGLE'];

    const controller = new WordleController({
      container: container,
      wordList: wordList
    });

    // 更新设置
    const newSettings = {
      darkTheme: true,
      animations: false
    };

    controller.updateSettings(newSettings);

    // 验证设置更新
    const currentSettings = controller.stateManager.getSettings();
    reporter.assertEquals(currentSettings.darkTheme, true, 'Dark theme should be enabled');
    reporter.assertEquals(currentSettings.animations, false, 'Animations should be disabled');

  } catch (error) {
    reporter.fail(`Settings update interaction test failed: ${error.message}`);
  }

  return reporter;
}

// 主测试函数
async function runAllIntegrationTests() {
  console.log('🚀 Starting Integration Tests...\n');

  const gameFlowReporter = await testCompleteGameFlow();
  const interactionReporter = await testUserInteractionScenarios();

  // 汇总所有结果
  const totalPassed = gameFlowReporter.passed + interactionReporter.passed;
  const totalFailed = gameFlowReporter.failed + interactionReporter.failed;

  console.log('\n📊 Final Integration Test Summary:');
  console.log('='.repeat(50));
  console.log(`Game Flow:     ✅ ${gameFlowReporter.passed}  ❌ ${gameFlowReporter.failed}`);
  console.log(`Interactions:  ✅ ${interactionReporter.passed}  ❌ ${interactionReporter.failed}`);
  console.log('='.repeat(50));
  console.log(`Total:         ✅ ${totalPassed}  ❌ ${totalFailed}`);

  if (totalFailed > 0) {
    console.log('\n❌ Some integration tests failed!');
    process.exit(1);
  } else {
    console.log('\n🎉 All integration tests passed successfully!');
    console.log('✅ Wordle game implementation is complete and tested!');
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllIntegrationTests().catch(console.error);
}

export { runAllIntegrationTests };