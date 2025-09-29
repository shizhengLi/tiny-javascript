import { WordValidator } from './src/js/WordValidator.js';

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
    console.log('🧪 运行 WordValidator 测试...\n');

    let validator;

    this.test('constructor should initialize with common words', () => {
      validator = new WordValidator();
      this.assertTrue(validator.validWords.size > 0);
      this.assertTrue(validator.commonWords.has('HELLO'));
      this.assertTrue(validator.commonWords.has('WORLD'));
    });

    this.test('validateFormat should validate correct 5-letter words', () => {
      const result = validator.validateFormat('HELLO');
      this.assertTrue(result.valid);
      this.assertEquals(result.word, 'HELLO');
    });

    this.test('validateFormat should reject empty words', () => {
      const result = validator.validateFormat('');
      this.assertFalse(result.valid);
      this.assertEquals(result.reason, '单词不能为空');
    });

    this.test('validateFormat should reject words with wrong length', () => {
      const result1 = validator.validateFormat('HI');
      this.assertFalse(result1.valid);
      this.assertEquals(result1.reason, '单词必须是5个字母');

      const result2 = validator.validateFormat('TOOLONG');
      this.assertFalse(result2.valid);
      this.assertEquals(result2.reason, '单词必须是5个字母');
    });

    this.test('validateFormat should convert lowercase to uppercase', () => {
      const result = validator.validateFormat('hello');
      this.assertTrue(result.valid);
      this.assertEquals(result.word, 'HELLO');
    });

    this.test('validateWord should validate valid common words', () => {
      const result = validator.validateWord('HELLO');
      this.assertTrue(result.valid);
      this.assertEquals(result.word, 'HELLO');
      this.assertTrue(result.isCommon);
    });

    this.test('validateWord should reject words not in word list', () => {
      const result = validator.validateWord('ZZZZZ');
      this.assertFalse(result.valid);
      this.assertEquals(result.reason, '不是有效的英文单词');
    });

    this.test('addCustomWord should add valid custom word', () => {
      const initialSize = validator.validWords.size;
      const result = validator.addCustomWord('TRULY');
      this.assertTrue(result.valid);
      this.assertEquals(result.word, 'TRULY');
      this.assertTrue(validator.validWords.has('TRULY'));
      this.assertTrue(validator.validWords.size > initialSize);
    });

    this.test('addCustomWord should reject invalid custom word', () => {
      const result = validator.addCustomWord('ABC');
      this.assertFalse(result.valid);
      this.assertEquals(result.reason, '单词必须是5个字母');
    });

    this.test('addWordList should add multiple words', () => {
      const words = ['APPLE', 'BANAN', 'GRAPE'];
      const result = validator.addWordList(words);

      this.assertEquals(result.successful, 3);
      this.assertEquals(result.failed, 0);
      this.assertTrue(validator.validWords.has('APPLE'));
      this.assertTrue(validator.validWords.has('BANAN'));
      this.assertTrue(validator.validWords.has('GRAPE'));
    });

    this.test('removeWord should remove existing word', () => {
      const initialSize = validator.validWords.size;
      const result = validator.removeWord('HELLO');

      this.assertTrue(result.valid);
      this.assertTrue(validator.validWords.size < initialSize);
      this.assertFalse(validator.validWords.has('HELLO'));
    });

    this.test('isValidWord should return true for valid words', () => {
      this.assertTrue(validator.isValidWord('WORLD'));
      this.assertFalse(validator.isValidWord('ZZZZZ'));
      this.assertFalse(validator.isValidWord('ABC'));
    });

    this.test('getSuggestions should return suggestions for partial word', () => {
      const suggestions = validator.getSuggestions('H');
      this.assertTrue(suggestions.length > 0);
      this.assertTrue(suggestions.every(word => word.startsWith('H')));
    });

    this.test('getSuggestions should respect limit parameter', () => {
      const suggestions = validator.getSuggestions('A', 3);
      this.assertTrue(suggestions.length <= 3);
    });

    this.test('getRandomWord should return a random word from word list', () => {
      const randomWord = validator.getRandomWord();
      this.assertTrue(validator.validWords.has(randomWord));
      this.assertTrue(typeof randomWord === 'string');
      this.assertEquals(randomWord.length, 5);
    });

    this.test('getStats should return correct statistics', () => {
      const stats = validator.getStats();

      this.assertEquals(stats.totalWords, validator.validWords.size);
      this.assertEquals(stats.commonWords, validator.commonWords.size);
      this.assertEquals(stats.customWords, validator.validWords.size - validator.commonWords.size);
      this.assertTrue(Array.isArray(stats.sampleWords));
    });

    this.test('reset should reset to default word list', () => {
      const freshValidator = new WordValidator();
      freshValidator.addCustomWord('TRULY');
      freshValidator.removeWord('WORLD');

      const initialSize = freshValidator.validWords.size;
      freshValidator.reset();

      this.assertTrue(freshValidator.validWords.size !== initialSize);
      this.assertTrue(freshValidator.validWords.has('WORLD'));
      this.assertFalse(freshValidator.validWords.has('TRULY'));
    });

    this.test('exportWords should export all words as array', () => {
      const exported = validator.exportWords();
      this.assertTrue(Array.isArray(exported));
      this.assertEquals(exported.length, validator.validWords.size);
      this.assertTrue(exported.includes('WORLD'));
    });

    this.test('importWords should import word list and replace existing', () => {
      const newWords = ['TESTA', 'TESTB', 'TESTC'];
      const result = validator.importWords(newWords);

      this.assertEquals(result.successful, 3);
      this.assertEquals(validator.validWords.size, 3);
      this.assertTrue(validator.validWords.has('TESTA'));
      this.assertFalse(validator.validWords.has('HELLO'));
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
  console.log('\n✅ WordValidator 测试通过，可以继续实现下一步。');
} else {
  console.log('\n❌ 测试失败，需要修复代码。');
  process.exit(1);
}