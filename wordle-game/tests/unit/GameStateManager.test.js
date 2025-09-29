import { GameStateManager } from '../../src/js/GameStateManager.js';

describe('GameStateManager', () => {
  let manager;

  beforeEach(() => {
    // 清理localStorage
    localStorage.clear();
    manager = new GameStateManager();
  });

  describe('constructor', () => {
    test('should initialize with default state', () => {
      expect(manager.state.currentGame).toBeNull();
      expect(manager.state.gameHistory).toEqual([]);
      expect(manager.state.statistics.gamesPlayed).toBe(0);
      expect(manager.state.settings.hardMode).toBe(false);
      expect(manager.state.achievements).toEqual([]);
    });
  });

  describe('initializeNewGame', () => {
    test('should create new game with default word if no word list', () => {
      const game = manager.initializeNewGame();
      expect(game.id).toBeDefined();
      expect(game.targetWord).toBe('WORLD');
      expect(game.gameStatus).toBe('playing');
      expect(game.guesses).toEqual([]);
      expect(game.maxGuesses).toBe(6);
      expect(game.wordLength).toBe(5);
    });

    test('should create new game with word from list', () => {
      const wordList = ['HELLO', 'WORLD', 'GAMES'];
      const game = manager.initializeNewGame(wordList);
      expect(wordList).toContain(game.targetWord);
    });

    test('should set current game to new game', () => {
      const game = manager.initializeNewGame();
      expect(manager.state.currentGame).toBe(game);
    });
  });

  describe('generateGameId', () => {
    test('should generate unique game IDs', () => {
      const id1 = manager.generateGameId();
      const id2 = manager.generateGameId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^game_\d+_[a-z0-9]+$/);
    });
  });

  describe('updateCurrentGame', () => {
    test('should update current game state', () => {
      manager.initializeNewGame();
      const updates = { currentGuess: 'HELLO' };
      const updated = manager.updateCurrentGame(updates);
      expect(updated.currentGuess).toBe('HELLO');
      expect(manager.state.currentGame.currentGuess).toBe('HELLO');
    });

    test('should throw error if no current game', () => {
      expect(() => manager.updateCurrentGame({ currentGuess: 'TEST' }))
        .toThrow('没有活动的游戏');
    });
  });

  describe('submitGuess', () => {
    beforeEach(() => {
      manager.initializeNewGame(['HELLO']);
      manager.state.currentGame.targetWord = 'HELLO';
    });

    test('should submit valid guess', () => {
      const game = manager.submitGuess('HELLO');
      expect(game.guesses).toHaveLength(1);
      expect(game.guesses[0].word).toBe('HELLO');
      expect(game.guesses[0].result).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
      expect(game.gameStatus).toBe('won');
    });

    test('should throw error if no current game', () => {
      manager.state.currentGame = null;
      expect(() => manager.submitGuess('TEST'))
        .toThrow('游戏未在进行中');
    });

    test('should throw error if game not playing', () => {
      manager.state.currentGame.gameStatus = 'won';
      expect(() => manager.submitGuess('TEST'))
        .toThrow('游戏未在进行中');
    });

    test('should update used letters', () => {
      manager.submitGuess('HELLO');
      expect(manager.state.currentGame.usedLetters.has('H')).toBe(true);
      expect(manager.state.currentGame.usedLetters.has('E')).toBe(true);
      expect(manager.state.currentGame.usedLetters.has('L')).toBe(true);
      expect(manager.state.currentGame.usedLetters.has('O')).toBe(true);
    });
  });

  describe('evaluateGuess', () => {
    test('should evaluate guess correctly', () => {
      const result = manager.evaluateGuess('WORLD', 'HELLO');
      expect(result).toEqual(['absent', 'present', 'absent', 'correct', 'absent']);
    });

    test('should return all correct for perfect guess', () => {
      const result = manager.evaluateGuess('HELLO', 'HELLO');
      expect(result).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
    });
  });

  describe('checkGameStatus', () => {
    test('should set status to won for correct guess', () => {
      const game = {
        targetWord: 'HELLO',
        guesses: [{
          word: 'HELLO',
          result: ['correct', 'correct', 'correct', 'correct', 'correct']
        }],
        maxGuesses: 6
      };

      manager.checkGameStatus(game);
      expect(game.gameStatus).toBe('won');
      expect(game.endTime).toBeDefined();
    });

    test('should set status to lost when max guesses reached', () => {
      const game = {
        targetWord: 'HELLO',
        guesses: Array(6).fill({
          word: 'WRONG',
          result: ['absent', 'absent', 'absent', 'absent', 'absent']
        }),
        maxGuesses: 6
      };

      manager.checkGameStatus(game);
      expect(game.gameStatus).toBe('lost');
      expect(game.endTime).toBeDefined();
    });

    test('should keep playing if game not finished', () => {
      const game = {
        targetWord: 'HELLO',
        guesses: [{
          word: 'WORLD',
          result: ['absent', 'absent', 'absent', 'absent', 'absent']
        }],
        maxGuesses: 6
      };

      manager.checkGameStatus(game);
      expect(game.gameStatus).toBe('playing');
    });
  });

  describe('finalizeGame', () => {
    test('should update statistics for won game', () => {
      const game = {
        id: 'test-game',
        targetWord: 'HELLO',
        gameStatus: 'won',
        guesses: [{
          word: 'HELLO',
          result: ['correct', 'correct', 'correct', 'correct', 'correct']
        }],
        startTime: Date.now() - 1000,
        endTime: Date.now()
      };

      manager.state.currentGame = game;
      manager.finalizeGame(game);

      expect(manager.state.statistics.gamesPlayed).toBe(1);
      expect(manager.state.statistics.gamesWon).toBe(1);
      expect(manager.state.statistics.currentStreak).toBe(1);
      expect(manager.state.statistics.guessDistribution[0]).toBe(1);
    });

    test('should update statistics for lost game', () => {
      const game = {
        id: 'test-game',
        targetWord: 'HELLO',
        gameStatus: 'lost',
        guesses: Array(6).fill({
          word: 'WRONG',
          result: ['absent', 'absent', 'absent', 'absent', 'absent']
        }),
        startTime: Date.now() - 1000,
        endTime: Date.now()
      };

      manager.state.currentGame = game;
      manager.finalizeGame(game);

      expect(manager.state.statistics.gamesPlayed).toBe(1);
      expect(manager.state.statistics.gamesWon).toBe(0);
      expect(manager.state.statistics.currentStreak).toBe(0);
    });

    test('should add game to history', () => {
      const game = {
        id: 'test-game',
        targetWord: 'HELLO',
        gameStatus: 'won',
        guesses: [{
          word: 'HELLO',
          result: ['correct', 'correct', 'correct', 'correct', 'correct']
        }],
        startTime: Date.now() - 1000,
        endTime: Date.now()
      };

      manager.state.currentGame = game;
      manager.finalizeGame(game);

      expect(manager.state.gameHistory).toHaveLength(1);
      expect(manager.state.gameHistory[0].id).toBe('test-game');
      expect(manager.state.gameHistory[0].gameStatus).toBe('won');
    });
  });

  describe('checkAchievements', () => {
    test('should unlock first win achievement', () => {
      const game = {
        gameStatus: 'won',
        guesses: [{
          word: 'HELLO',
          result: ['correct', 'correct', 'correct', 'correct', 'correct']
        }]
      };

      manager.state.statistics.gamesWon = 1;
      manager.checkAchievements(game);

      expect(manager.hasAchievement('first_win')).toBe(true);
    });

    test('should unlock perfect game achievement', () => {
      const game = {
        gameStatus: 'won',
        guesses: [{
          word: 'HELLO',
          result: ['correct', 'correct', 'correct', 'correct', 'correct']
        }]
      };

      manager.checkAchievements(game);

      expect(manager.hasAchievement('perfect_game')).toBe(true);
    });
  });

  describe('getStatistics', () => {
    test('should return statistics with calculated values', () => {
      manager.state.statistics.gamesPlayed = 10;
      manager.state.statistics.gamesWon = 7;

      const stats = manager.getStatistics();
      expect(stats.gamesPlayed).toBe(10);
      expect(stats.gamesWon).toBe(7);
      expect(stats.winPercentage).toBe(70);
      expect(stats.averageGuesses).toBeDefined();
    });

    test('should handle zero games played', () => {
      const stats = manager.getStatistics();
      expect(stats.winPercentage).toBe(0);
      expect(stats.averageGuesses).toBe('0');
    });
  });

  describe('settings management', () => {
    test('should get current settings', () => {
      const settings = manager.getSettings();
      expect(settings.hardMode).toBe(false);
      expect(settings.darkTheme).toBe(false);
    });

    test('should update settings', () => {
      const newSettings = { hardMode: true, darkTheme: true };
      const updated = manager.updateSettings(newSettings);
      expect(updated.hardMode).toBe(true);
      expect(updated.darkTheme).toBe(true);
    });
  });

  describe('persistence', () => {
    test('should save state to localStorage', () => {
      manager.initializeNewGame(['TEST']);
      const saved = localStorage.getItem('wordleGameState');
      expect(saved).toBeDefined();
      expect(JSON.parse(saved).currentGame).toBeDefined();
    });

    test('should load state from localStorage', () => {
      const originalState = {
        currentGame: { id: 'test', targetWord: 'TEST' },
        statistics: { gamesPlayed: 5 },
        settings: { hardMode: true },
        achievements: []
      };

      localStorage.setItem('wordleGameState', JSON.stringify(originalState));
      const newManager = new GameStateManager();
      expect(newManager.state.statistics.gamesPlayed).toBe(5);
      expect(newManager.state.settings.hardMode).toBe(true);
    });
  });

  describe('data management', () => {
    test('should reset statistics', () => {
      manager.state.statistics.gamesPlayed = 10;
      manager.state.statistics.gamesWon = 5;
      manager.resetStatistics();

      expect(manager.state.statistics.gamesPlayed).toBe(0);
      expect(manager.state.statistics.gamesWon).toBe(0);
    });

    test('should reset all data', () => {
      manager.initializeNewGame(['TEST']);
      manager.state.statistics.gamesPlayed = 10;
      manager.resetAll();

      expect(manager.state.currentGame).toBeNull();
      expect(manager.state.statistics.gamesPlayed).toBe(0);
      expect(manager.state.gameHistory).toEqual([]);
    });

    test('should export and import state', () => {
      manager.initializeNewGame(['TEST']);
      manager.state.statistics.gamesPlayed = 5;

      const exported = manager.exportState();
      const newManager = new GameStateManager();
      const imported = newManager.importState(exported);

      expect(imported).toBe(true);
      expect(newManager.state.statistics.gamesPlayed).toBe(5);
    });
  });

  describe('cleanupOldData', () => {
    test('should remove old game history', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 40);

      const recentDate = new Date();

      manager.state.gameHistory = [
        { completedAt: oldDate.getTime() },
        { completedAt: recentDate.getTime() }
      ];

      manager.cleanupOldData(30);

      expect(manager.state.gameHistory).toHaveLength(1);
      expect(manager.state.gameHistory[0].completedAt).toBe(recentDate.getTime());
    });
  });
});