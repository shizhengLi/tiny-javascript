// 简单的测试运行器
import { WordleGame } from './src/js/WordleGame.js';

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
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
    console.log('🧪 运行 WordleGame 测试...\n');

    // 测试构造函数
    this.test('constructor should initialize game with default values', () => {
      const game = new WordleGame(['WORLD', 'HELLO']);
      this.assertEquals(game.maxGuesses, 6);
      this.assertEquals(game.wordLength, 5);
      this.assertEquals(game.gameStatus, 'playing');
      this.assertEquals(game.guesses, []);
      this.assertEquals(game.currentGuess, '');
    });

    // 测试添加字母
    this.test('addLetter should add letter when game is playing', () => {
      const game = new WordleGame(['WORLD', 'HELLO']);
      const result = game.addLetter('A');
      this.assertTrue(result);
      this.assertEquals(game.currentGuess, 'A');
    });

    // 测试删除字母
    this.test('removeLetter should remove last letter', () => {
      const game = new WordleGame(['WORLD', 'HELLO']);
      game.currentGuess = 'ABC';
      const result = game.removeLetter();
      this.assertTrue(result);
      this.assertEquals(game.currentGuess, 'AB');
    });

    // 测试提交猜测
    this.test('submitGuess should submit valid guess', () => {
      const game = new WordleGame(['WORLD', 'HELLO']);
      game.targetWord = 'HELLO';
      game.currentGuess = 'HELLO';

      const result = game.submitGuess();
      this.assertTrue(result);
      this.assertEquals(game.guesses.length, 1);
      this.assertEquals(game.guesses[0].word, 'HELLO');
      this.assertEquals(game.currentGuess, '');
    });

    // 测试评估猜测
    this.test('evaluateGuess should return correct for all correct letters', () => {
      const game = new WordleGame(['WORLD', 'HELLO']);
      game.targetWord = 'HELLO';
      const result = game.evaluateGuess('HELLO');
      this.assertEquals(result, ['correct', 'correct', 'correct', 'correct', 'correct']);
    });

    this.test('evaluateGuess should return absent for letters not in target', () => {
      const game = new WordleGame(['WORLD', 'HELLO']);
      game.targetWord = 'HELLO';
      const result = game.evaluateGuess('WORLD');
      this.assertEquals(result, ['absent', 'present', 'absent', 'correct', 'absent']);
    });

    this.test('evaluateGuess should return present for letters in wrong position', () => {
      const game = new WordleGame(['WORLD', 'HELLO']);
      game.targetWord = 'HELLO';
      const result = game.evaluateGuess('LOHEL');
      this.assertEquals(result, ['present', 'present', 'present', 'present', 'present']);
    });

    // 测试游戏状态检查
    this.test('checkGameStatus should set game status to won when guess is correct', () => {
      const game = new WordleGame(['WORLD', 'HELLO']);
      game.targetWord = 'HELLO';
      game.guesses.push({
        word: 'HELLO',
        result: ['correct', 'correct', 'correct', 'correct', 'correct']
      });

      game.checkGameStatus();
      this.assertEquals(game.gameStatus, 'won');
    });

    this.test('checkGameStatus should set game status to lost when max guesses reached', () => {
      const game = new WordleGame(['WORLD', 'HELLO']);
      game.guesses = Array(6).fill({
        word: 'WRONG',
        result: ['absent', 'absent', 'absent', 'absent', 'absent']
      });

      game.checkGameStatus();
      this.assertEquals(game.gameStatus, 'lost');
    });

    // 测试单词验证
    this.test('isValidWord should validate 5-letter uppercase words', () => {
      const game = new WordleGame(['WORLD', 'HELLO']);
      this.assertTrue(game.isValidWord('HELLO'));
      this.assertTrue(game.isValidWord('WORLD'));
      this.assertFalse(game.isValidWord('HI'));
      this.assertFalse(game.isValidWord('TOOLONG'));
      this.assertFalse(game.isValidWord('12345'));
    });

    // 测试字母状态
    this.test('getLetterStatus should return correct status for letters', () => {
      const game = new WordleGame(['WORLD', 'HELLO']);
      game.targetWord = 'HELLO';
      game.guesses.push({
        word: 'WORLD',
        result: ['absent', 'present', 'absent', 'correct', 'absent']
      });

      this.assertEquals(game.getLetterStatus('L'), 'correct');
      this.assertEquals(game.getLetterStatus('O'), 'present');
      this.assertEquals(game.getLetterStatus('W'), 'absent');
      this.assertEquals(game.getLetterStatus('A'), 'unused');
    });

    // 测试游戏重置
    this.test('resetGame should reset all game state', () => {
      const game = new WordleGame(['WORLD', 'HELLO']);
      game.currentGuess = 'SOMEWORD';
      game.guesses.push({
        word: 'TEST',
        result: ['absent', 'absent', 'absent', 'absent', 'absent']
      });
      game.gameStatus = 'won';

      game.resetGame();

      this.assertEquals(game.currentGuess, '');
      this.assertEquals(game.guesses, []);
      this.assertEquals(game.gameStatus, 'playing');
      this.assertEquals(game.usedLetters.size, 0);
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
  console.log('\n✅ WordleGame 核心逻辑测试通过，可以继续实现下一步。');
} else {
  console.log('\n❌ 测试失败，需要修复代码。');
  process.exit(1);
}