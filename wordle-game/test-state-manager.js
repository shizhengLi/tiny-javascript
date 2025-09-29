// 模拟localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

import { GameStateManager } from './src/js/GameStateManager.js';

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  test(description, testFn) {
    try {
      testFn();
      console.log(`✅ ${description}`);
      this.passed++;
    } catch (error) {
      console.log(`❌ ${description}`);
      console.log(`   ${error.message}`);
      this.failed++;
    }
  }

  assertEquals(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  }

  assertTrue(condition, message) {
    if (!condition) {
      throw new Error(message || 'Expected true, got false');
    }
  }

  assertFalse(condition, message) {
    if (condition) {
      throw new Error(message || 'Expected false, got true');
    }
  }

  runTests() {
    console.log('🧪 运行 GameStateManager 测试...\n');

    // 清理localStorage
    global.localStorage.clear();

    let manager;

    this.test('constructor should initialize with default state', () => {
      manager = new GameStateManager();
      this.assertTrue(manager.state.currentGame === null);
      this.assertEquals(manager.state.gameHistory, []);
      this.assertEquals(manager.state.statistics.gamesPlayed, 0);
      this.assertFalse(manager.state.settings.hardMode);
      this.assertEquals(manager.state.achievements, []);
    });

    this.test('initializeNewGame should create new game with default word', () => {
      const game = manager.initializeNewGame();
      this.assertTrue(game.id !== undefined);
      this.assertEquals(game.targetWord, 'WORLD');
      this.assertEquals(game.gameStatus, 'playing');
      this.assertEquals(game.guesses, []);
      this.assertEquals(game.maxGuesses, 6);
      this.assertEquals(game.wordLength, 5);
    });

    this.test('initializeNewGame should create new game with word from list', () => {
      const wordList = ['HELLO', 'WORLD', 'GAMES'];
      const game = manager.initializeNewGame(wordList);
      this.assertTrue(wordList.includes(game.targetWord));
    });

    this.test('generateGameId should generate unique game IDs', () => {
      const id1 = manager.generateGameId();
      const id2 = manager.generateGameId();
      this.assertTrue(id1 !== id2);
      this.assertTrue(/^game_\d+_[a-z0-9]+$/.test(id1));
    });

    this.test('updateCurrentGame should update current game state', () => {
      manager.initializeNewGame();
      const updates = { currentGuess: 'HELLO' };
      const updated = manager.updateCurrentGame(updates);
      this.assertEquals(updated.currentGuess, 'HELLO');
      this.assertEquals(manager.state.currentGame.currentGuess, 'HELLO');
    });

    this.test('updateCurrentGame should throw error if no current game', () => {
      manager.state.currentGame = null;
      let threwError = false;
      try {
        manager.updateCurrentGame({ currentGuess: 'TEST' });
      } catch (error) {
        threwError = true;
        this.assertEquals(error.message, '没有活动的游戏');
      }
      this.assertTrue(threwError);
    });

    this.test('submitGuess should submit valid guess', () => {
      manager.initializeNewGame(['HELLO']);
      manager.state.currentGame.targetWord = 'HELLO';

      const game = manager.submitGuess('HELLO');
      this.assertEquals(game.guesses.length, 1);
      this.assertEquals(game.guesses[0].word, 'HELLO');
      this.assertEquals(game.guesses[0].result, ['correct', 'correct', 'correct', 'correct', 'correct']);
      this.assertEquals(game.gameStatus, 'won');
    });

    this.test('submitGuess should throw error if no current game', () => {
      manager.state.currentGame = null;
      let threwError = false;
      try {
        manager.submitGuess('TEST');
      } catch (error) {
        threwError = true;
        this.assertEquals(error.message, '游戏未在进行中');
      }
      this.assertTrue(threwError);
    });

    this.test('evaluateGuess should evaluate guess correctly', () => {
      const result = manager.evaluateGuess('WORLD', 'HELLO');
      this.assertEquals(result, ['absent', 'present', 'absent', 'correct', 'absent']);
    });

    this.test('evaluateGuess should return all correct for perfect guess', () => {
      const result = manager.evaluateGuess('HELLO', 'HELLO');
      this.assertEquals(result, ['correct', 'correct', 'correct', 'correct', 'correct']);
    });

    this.test('checkGameStatus should set status to won for correct guess', () => {
      const game = {
        targetWord: 'HELLO',
        guesses: [{
          word: 'HELLO',
          result: ['correct', 'correct', 'correct', 'correct', 'correct']
        }],
        maxGuesses: 6
      };

      manager.checkGameStatus(game);
      this.assertEquals(game.gameStatus, 'won');
      this.assertTrue(game.endTime !== undefined);
    });

    this.test('checkGameStatus should set status to lost when max guesses reached', () => {
      const game = {
        targetWord: 'HELLO',
        guesses: Array(6).fill({
          word: 'WRONG',
          result: ['absent', 'absent', 'absent', 'absent', 'absent']
        }),
        maxGuesses: 6
      };

      manager.checkGameStatus(game);
      this.assertEquals(game.gameStatus, 'lost');
      this.assertTrue(game.endTime !== undefined);
    });

    this.test('getStatistics should return statistics with calculated values', () => {
      manager.state.statistics.gamesPlayed = 10;
      manager.state.statistics.gamesWon = 7;

      const stats = manager.getStatistics();
      this.assertEquals(stats.gamesPlayed, 10);
      this.assertEquals(stats.gamesWon, 7);
      this.assertEquals(stats.winPercentage, 70);
      this.assertTrue(stats.averageGuesses !== undefined);
    });

    this.test('settings management should work', () => {
      const settings = manager.getSettings();
      this.assertFalse(settings.hardMode);
      this.assertFalse(settings.darkTheme);

      const newSettings = { hardMode: true, darkTheme: true };
      const updated = manager.updateSettings(newSettings);
      this.assertTrue(updated.hardMode);
      this.assertTrue(updated.darkTheme);
    });

    this.test('should save and load state from localStorage', () => {
      manager.initializeNewGame(['TEST']);
      const saved = localStorage.getItem('wordleGameState');
      this.assertTrue(saved !== undefined);
      this.assertTrue(JSON.parse(saved).currentGame !== undefined);

      // 创建新的manager测试加载
      const newManager = new GameStateManager();
      this.assertTrue(newManager.state.currentGame !== null);
    });

    this.test('should reset statistics', () => {
      manager.state.statistics.gamesPlayed = 10;
      manager.state.statistics.gamesWon = 5;
      manager.resetStatistics();

      this.assertEquals(manager.state.statistics.gamesPlayed, 0);
      this.assertEquals(manager.state.statistics.gamesWon, 0);
    });

    this.test('should reset all data', () => {
      manager.initializeNewGame(['TEST']);
      manager.state.statistics.gamesPlayed = 10;
      manager.resetAll();

      this.assertTrue(manager.state.currentGame === null);
      this.assertEquals(manager.state.statistics.gamesPlayed, 0);
      this.assertEquals(manager.state.gameHistory, []);
    });

    this.test('should export and import state', () => {
      manager.initializeNewGame(['TEST']);
      manager.state.statistics.gamesPlayed = 5;

      const exported = manager.exportState();
      const newManager = new GameStateManager();
      const imported = newManager.importState(exported);

      this.assertTrue(imported);
      this.assertEquals(newManager.state.statistics.gamesPlayed, 5);
    });

    console.log(`\n📊 测试结果: ${this.passed} 通过, ${this.failed} 失败`);

    if (this.failed === 0) {
      console.log('🎉 所有测试通过！可以继续下一步。');
      return true;
    } else {
      console.log('❌ 有测试失败，请修复后再继续。');
      return false;
    }
  }
}

// 运行测试
const runner = new TestRunner();
const success = runner.runTests();

if (success) {
  console.log('\n✅ GameStateManager 测试通过，可以继续实现下一步。');
} else {
  console.log('\n❌ 测试失败，需要修复代码。');
  process.exit(1);
}