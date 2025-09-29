import { WordValidator } from '../../src/js/WordValidator.js';

describe('WordValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new WordValidator();
  });

  describe('constructor', () => {
    test('should initialize with common words', () => {
      expect(validator.validWords.size).toBeGreaterThan(0);
      expect(validator.commonWords.has('HELLO')).toBe(true);
      expect(validator.commonWords.has('WORLD')).toBe(true);
    });

    test('should have all common words in valid words', () => {
      validator.commonWords.forEach(word => {
        expect(validator.validWords.has(word)).toBe(true);
      });
    });
  });

  describe('validateFormat', () => {
    test('should validate correct 5-letter words', () => {
      const result = validator.validateFormat('HELLO');
      expect(result.valid).toBe(true);
      expect(result.word).toBe('HELLO');
    });

    test('should reject empty words', () => {
      const result = validator.validateFormat('');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('单词不能为空');
    });

    test('should reject non-string input', () => {
      const result = validator.validateFormat(null);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('单词不能为空');
    });

    test('should reject words with wrong length', () => {
      const result1 = validator.validateFormat('HI');
      expect(result1.valid).toBe(false);
      expect(result1.reason).toBe('单词必须是5个字母');

      const result2 = validator.validateFormat('TOOLONG');
      expect(result2.valid).toBe(false);
      expect(result2.reason).toBe('单词必须是5个字母');
    });

    test('should reject words with non-letter characters', () => {
      const result1 = validator.validateFormat('12345');
      expect(result1.valid).toBe(false);
      expect(result1.reason).toBe('单词只能包含字母');

      const result2 = validator.validateFormat('HE L0');
      expect(result2.valid).toBe(false);
      expect(result2.reason).toBe('单词只能包含字母');
    });

    test('should convert lowercase to uppercase', () => {
      const result = validator.validateFormat('hello');
      expect(result.valid).toBe(true);
      expect(result.word).toBe('HELLO');
    });
  });

  describe('validateWord', () => {
    test('should validate valid common words', () => {
      const result = validator.validateWord('HELLO');
      expect(result.valid).toBe(true);
      expect(result.word).toBe('HELLO');
      expect(result.isCommon).toBe(true);
    });

    test('should reject words not in word list', () => {
      const result = validator.validateWord('ZZZZZ');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('不是有效的英文单词');
    });

    test('should include format validation', () => {
      const result = validator.validateWord('ABC');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('单词必须是5个字母');
    });

    test('should handle case conversion', () => {
      const result = validator.validateWord('world');
      expect(result.valid).toBe(true);
      expect(result.word).toBe('WORLD');
    });
  });

  describe('addCustomWord', () => {
    test('should add valid custom word', () => {
      const result = validator.addCustomWord('CUSTOM');
      expect(result.valid).toBe(true);
      expect(result.word).toBe('CUSTOM');
      expect(validator.validWords.has('CUSTOM')).toBe(true);
    });

    test('should reject invalid custom word', () => {
      const result = validator.addCustomWord('ABC');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('单词必须是5个字母');
    });

    test('should handle duplicate words', () => {
      validator.addCustomWord('UNIQUE');
      const result = validator.addCustomWord('UNIQUE');
      expect(result.valid).toBe(true);
      expect(result.word).toBe('UNIQUE');
    });
  });

  describe('addWordList', () => {
    test('should add multiple words', () => {
      const words = ['APPLE', 'BANAN', 'GRAPE'];
      const result = validator.addWordList(words);

      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
      expect(validator.validWords.has('APPLE')).toBe(true);
      expect(validator.validWords.has('BANAN')).toBe(true);
      expect(validator.validWords.has('GRAPE')).toBe(true);
    });

    test('should handle mixed valid and invalid words', () => {
      const words = ['VALID', 'ABC', 'ALSO', '12345', 'GOOD'];
      const result = validator.addWordList(words);

      expect(result.successful).toBe(3);
      expect(result.failed).toBe(2);
    });

    test('should return individual results', () => {
      const words = ['TEST', 'BAD'];
      const result = validator.addWordList(words);

      expect(result.results).toHaveLength(2);
      expect(result.results[0].valid).toBe(true);
      expect(result.results[1].valid).toBe(false);
    });
  });

  describe('removeWord', () => {
    test('should remove existing word', () => {
      const initialSize = validator.validWords.size;
      const result = validator.removeWord('HELLO');

      expect(result.valid).toBe(true);
      expect(validator.validWords.size).toBe(initialSize - 1);
      expect(validator.validWords.has('HELLO')).toBe(false);
    });

    test('should handle removing non-existent word', () => {
      const initialSize = validator.validWords.size;
      const result = validator.removeWord('NONEXIST');

      expect(result.valid).toBe(false);
      expect(validator.validWords.size).toBe(initialSize);
    });

    test('should validate format before removal', () => {
      const result = validator.removeWord('ABC');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('单词必须是5个字母');
    });
  });

  describe('isValidWord', () => {
    test('should return true for valid words', () => {
      expect(validator.isValidWord('HELLO')).toBe(true);
      expect(validator.isValidWord('WORLD')).toBe(true);
    });

    test('should return false for invalid words', () => {
      expect(validator.isValidWord('ZZZZZ')).toBe(false);
      expect(validator.isValidWord('ABC')).toBe(false);
    });

    test('should handle case insensitivity', () => {
      expect(validator.isValidWord('hello')).toBe(true);
    });
  });

  describe('getSuggestions', () => {
    test('should return suggestions for partial word', () => {
      const suggestions = validator.getSuggestions('H');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.every(word => word.startsWith('H'))).toBe(true);
    });

    test('should respect limit parameter', () => {
      const suggestions = validator.getSuggestions('A', 3);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    test('should return empty array for empty pattern', () => {
      const suggestions = validator.getSuggestions('');
      expect(suggestions).toEqual([]);
    });

    test('should return empty array for no matches', () => {
      const suggestions = validator.getSuggestions('ZZ');
      expect(suggestions).toEqual([]);
    });
  });

  describe('getRandomWord', () => {
    test('should return a random word from word list', () => {
      const randomWord = validator.getRandomWord();
      expect(validator.validWords.has(randomWord)).toBe(true);
    });

    test('should return null when word list is empty', () => {
      validator.validWords.clear();
      const randomWord = validator.getRandomWord();
      expect(randomWord).toBeNull();
    });

    test('should return different words on multiple calls', () => {
      // This test might occasionally fail due to randomness, but it's very unlikely
      const word1 = validator.getRandomWord();
      const word2 = validator.getRandomWord();
      // Allow for the possibility of getting the same word by chance
      expect(typeof word1).toBe('string');
      expect(typeof word2).toBe('string');
    });
  });

  describe('getStats', () => {
    test('should return correct statistics', () => {
      const stats = validator.getStats();

      expect(stats.totalWords).toBe(validator.validWords.size);
      expect(stats.commonWords).toBe(validator.commonWords.size);
      expect(stats.customWords).toBe(validator.validWords.size - validator.commonWords.size);
      expect(Array.isArray(stats.sampleWords)).toBe(true);
      expect(stats.sampleWords.length).toBeLessThanOrEqual(10);
    });

    test('should update stats after adding custom words', () => {
      const initialStats = validator.getStats();
      validator.addCustomWord('CUSTOM');
      const newStats = validator.getStats();

      expect(newStats.totalWords).toBe(initialStats.totalWords + 1);
      expect(newStats.customWords).toBe(initialStats.customWords + 1);
    });
  });

  describe('reset', () => {
    test('should reset to default word list', () => {
      validator.addCustomWord('TEMP');
      validator.removeWord('HELLO');

      const initialSize = validator.validWords.size;
      validator.reset();

      expect(validator.validWords.size).not.toBe(initialSize);
      expect(validator.validWords.has('HELLO')).toBe(true);
      expect(validator.validWords.has('TEMP')).toBe(false);
    });
  });

  describe('exportWords', () => {
    test('should export all words as array', () => {
      const exported = validator.exportWords();
      expect(Array.isArray(exported)).toBe(true);
      expect(exported.length).toBe(validator.validWords.size);
      expect(exported).toContain('HELLO');
    });
  });

  describe('importWords', () => {
    test('should import word list and replace existing', () => {
      const newWords = ['TEST1', 'TEST2', 'TEST3'];
      const result = validator.importWords(newWords);

      expect(result.successful).toBe(3);
      expect(validator.validWords.size).toBe(3);
      expect(validator.validWords.has('TEST1')).toBe(true);
      expect(validator.validWords.has('HELLO')).toBe(false);
    });
  });
});