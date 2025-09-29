import { WordleGame } from '../../src/js/WordleGame.js';

describe('WordleGame', () => {
  let game;
  const testWordList = ['WORLD', 'HELLO', 'GAMES', 'CODES', 'TODAY'];

  beforeEach(() => {
    game = new WordleGame(testWordList);
  });

  describe('constructor', () => {
    test('should initialize game with default values', () => {
      expect(game.maxGuesses).toBe(6);
      expect(game.wordLength).toBe(5);
      expect(game.gameStatus).toBe('playing');
      expect(game.guesses).toEqual([]);
      expect(game.currentGuess).toBe('');
    });

    test('should set target word from word list', () => {
      expect(testWordList).toContain(game.targetWord);
    });

    test('should use default word if word list is empty', () => {
      const emptyGame = new WordleGame([]);
      expect(emptyGame.targetWord).toBe('WORLD');
    });
  });

  describe('addLetter', () => {
    test('should add letter when game is playing', () => {
      const result = game.addLetter('A');
      expect(result).toBe(true);
      expect(game.currentGuess).toBe('A');
    });

    test('should not add letter when game is not playing', () => {
      game.gameStatus = 'won';
      const result = game.addLetter('A');
      expect(result).toBe(false);
      expect(game.currentGuess).toBe('');
    });

    test('should not add letter when current guess is full', () => {
      game.currentGuess = 'ABCDE';
      const result = game.addLetter('F');
      expect(result).toBe(false);
      expect(game.currentGuess).toBe('ABCDE');
    });

    test('should convert letter to uppercase', () => {
      game.addLetter('a');
      expect(game.currentGuess).toBe('A');
    });
  });

  describe('removeLetter', () => {
    beforeEach(() => {
      game.currentGuess = 'ABC';
    });

    test('should remove last letter when game is playing', () => {
      const result = game.removeLetter();
      expect(result).toBe(true);
      expect(game.currentGuess).toBe('AB');
    });

    test('should not remove letter when game is not playing', () => {
      game.gameStatus = 'lost';
      const result = game.removeLetter();
      expect(result).toBe(false);
      expect(game.currentGuess).toBe('ABC');
    });

    test('should not remove letter when current guess is empty', () => {
      game.currentGuess = '';
      const result = game.removeLetter();
      expect(result).toBe(false);
      expect(game.currentGuess).toBe('');
    });
  });

  describe('submitGuess', () => {
    test('should submit valid guess', () => {
      // 设置一个已知的目标词
      game.targetWord = 'HELLO';
      game.currentGuess = 'HELLO';

      const result = game.submitGuess();
      expect(result).toBe(true);
      expect(game.guesses).toHaveLength(1);
      expect(game.guesses[0].word).toBe('HELLO');
      expect(game.currentGuess).toBe('');
    });

    test('should not submit guess when game is not playing', () => {
      game.gameStatus = 'won';
      game.currentGuess = 'HELLO';

      const result = game.submitGuess();
      expect(result).toBe(false);
      expect(game.guesses).toHaveLength(0);
    });

    test('should not submit incomplete guess', () => {
      game.currentGuess = 'ABC';

      const result = game.submitGuess();
      expect(result).toBe(false);
      expect(game.guesses).toHaveLength(0);
    });

    test('should not submit invalid word format', () => {
      game.currentGuess = '12345';

      const result = game.submitGuess();
      expect(result).toBe(false);
      expect(game.guesses).toHaveLength(0);
    });

    test('should update used letters', () => {
      game.targetWord = 'HELLO';
      game.currentGuess = 'HELLO';

      game.submitGuess();
      expect(game.usedLetters.has('H')).toBe(true);
      expect(game.usedLetters.has('E')).toBe(true);
      expect(game.usedLetters.has('L')).toBe(true);
      expect(game.usedLetters.has('O')).toBe(true);
    });
  });

  describe('evaluateGuess', () => {
    beforeEach(() => {
      game.targetWord = 'HELLO';
    });

    test('should return correct for all correct letters', () => {
      const result = game.evaluateGuess('HELLO');
      expect(result).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
    });

    test('should return absent for letters not in target', () => {
      const result = game.evaluateGuess('WORLD');
      expect(result).toEqual(['absent', 'absent', 'correct', 'absent', 'correct']);
    });

    test('should return present for letters in wrong position', () => {
      const result = game.evaluateGuess('LOHEL');
      expect(result).toEqual(['present', 'present', 'correct', 'correct', 'present']);
    });

    test('should handle duplicate letters correctly', () => {
      game.targetWord = 'HELLO';
      const result = game.evaluateGuess('LLALL');
      expect(result).toEqual(['present', 'correct', 'absent', 'absent', 'correct']);
    });

    test('should not double count duplicate letters', () => {
      game.targetWord = 'BOOKS';
      const result = game.evaluateGuess('BOOST');
      expect(result).toEqual(['correct', 'absent', 'present', 'correct', 'correct']);
    });
  });

  describe('checkGameStatus', () => {
    test('should set game status to won when guess is correct', () => {
      game.targetWord = 'HELLO';
      game.guesses.push({
        word: 'HELLO',
        result: ['correct', 'correct', 'correct', 'correct', 'correct']
      });

      game.checkGameStatus();
      expect(game.gameStatus).toBe('won');
    });

    test('should set game status to lost when max guesses reached', () => {
      game.guesses = Array(6).fill({
        word: 'WRONG',
        result: ['absent', 'absent', 'absent', 'absent', 'absent']
      });

      game.checkGameStatus();
      expect(game.gameStatus).toBe('lost');
    });

    test('should keep game playing when there are remaining guesses', () => {
      game.guesses.push({
        word: 'WRONG',
        result: ['absent', 'absent', 'absent', 'absent', 'absent']
      });

      game.checkGameStatus();
      expect(game.gameStatus).toBe('playing');
    });
  });

  describe('isValidWord', () => {
    test('should validate 5-letter uppercase words', () => {
      expect(game.isValidWord('HELLO')).toBe(true);
      expect(game.isValidWord('WORLD')).toBe(true);
    });

    test('should reject words with wrong length', () => {
      expect(game.isValidWord('HI')).toBe(false);
      expect(game.isValidWord('TOOLONG')).toBe(false);
    });

    test('should reject words with non-letter characters', () => {
      expect(game.isValidWord('12345')).toBe(false);
      expect(game.isValidWord('HE L0')).toBe(false);
    });

    test('should accept lowercase letters and convert them', () => {
      expect(game.isValidWord('hello')).toBe(true);
    });
  });

  describe('getGameState', () => {
    test('should return complete game state', () => {
      game.targetWord = 'HELLO';
      game.currentGuess = 'WORLD';
      game.guesses.push({
        word: 'FIRST',
        result: ['absent', 'absent', 'absent', 'absent', 'absent']
      });

      const state = game.getGameState();

      expect(state.targetWord).toBe('HELLO');
      expect(state.currentGuess).toBe('WORLD');
      expect(state.guesses).toHaveLength(1);
      expect(state.gameStatus).toBe('playing');
      expect(state.maxGuesses).toBe(6);
      expect(state.wordLength).toBe(5);
      expect(state.remainingGuesses).toBe(5);
    });
  });

  describe('getLetterStatus', () => {
    beforeEach(() => {
      game.targetWord = 'HELLO';
      game.guesses.push({
        word: 'WORLD',
        result: ['absent', 'absent', 'correct', 'absent', 'correct']
      });
    });

    test('should return correct status for correct letters', () => {
      expect(game.getLetterStatus('L')).toBe('correct');
      expect(game.getLetterStatus('O')).toBe('correct');
    });

    test('should return absent status for absent letters', () => {
      expect(game.getLetterStatus('W')).toBe('absent');
      expect(game.getLetterStatus('R')).toBe('absent');
    });

    test('should return unused status for unused letters', () => {
      expect(game.getLetterStatus('A')).toBe('unused');
      expect(game.getLetterStatus('B')).toBe('unused');
    });

    test('should handle case insensitivity', () => {
      expect(game.getLetterStatus('l')).toBe('correct');
      expect(game.getLetterStatus('o')).toBe('correct');
    });
  });

  describe('resetGame', () => {
    test('should reset all game state', () => {
      game.currentGuess = 'SOMEWORD';
      game.guesses.push({
        word: 'TEST',
        result: ['absent', 'absent', 'absent', 'absent', 'absent']
      });
      game.gameStatus = 'won';

      game.resetGame();

      expect(game.currentGuess).toBe('');
      expect(game.guesses).toEqual([]);
      expect(game.gameStatus).toBe('playing');
      expect(game.usedLetters.size).toBe(0);
      expect(testWordList).toContain(game.targetWord);
    });
  });

  describe('setWordList', () => {
    test('should set new word list and reset game', () => {
      const newWordList = ['NEW', 'WORD', 'LIST'];
      game.setWordList(newWordList);

      expect(game.wordList).toBe(newWordList);
      expect(newWordList).toContain(game.targetWord);
      expect(game.guesses).toEqual([]);
      expect(game.gameStatus).toBe('playing');
    });
  });
});