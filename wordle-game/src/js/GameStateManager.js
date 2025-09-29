/**
 * 游戏状态管理器 - 管理游戏的整体状态和持久化
 */
export class GameStateManager {
  constructor() {
    this.state = {
      currentGame: null,
      gameHistory: [],
      statistics: {
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        maxStreak: 0,
        guessDistribution: [0, 0, 0, 0, 0, 0]
      },
      settings: {
        hardMode: false,
        darkTheme: false,
        colorblindMode: false,
        animations: true
      },
      achievements: [],
      lastPlayed: null
    };

    this.loadState();
  }

  /**
   * 初始化新游戏
   */
  initializeNewGame(wordList = []) {
    const gameState = {
      id: this.generateGameId(),
      targetWord: this.selectTargetWord(wordList),
      currentGuess: '',
      guesses: [],
      gameStatus: 'playing',
      maxGuesses: 6,
      wordLength: 5,
      startTime: Date.now(),
      endTime: null,
      usedLetters: new Set(),
      wordList: wordList
    };

    this.state.currentGame = gameState;
    this.saveState();
    return gameState;
  }

  /**
   * 生成游戏ID
   */
  generateGameId() {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 选择目标单词
   */
  selectTargetWord(wordList) {
    if (wordList.length === 0) {
      return 'WORLD'; // 默认单词
    }
    const randomIndex = Math.floor(Math.random() * wordList.length);
    return wordList[randomIndex].toUpperCase();
  }

  /**
   * 更新当前游戏状态
   */
  updateCurrentGame(updates) {
    if (!this.state.currentGame) {
      throw new Error('没有活动的游戏');
    }

    this.state.currentGame = {
      ...this.state.currentGame,
      ...updates,
      lastUpdated: Date.now()
    };

    this.saveState();
    return this.state.currentGame;
  }

  /**
   * 提交猜测
   */
  submitGuess(guess) {
    if (!this.state.currentGame || this.state.currentGame.gameStatus !== 'playing') {
      throw new Error('游戏未在进行中');
    }

    const game = this.state.currentGame;

    // 评估猜测
    const result = this.evaluateGuess(guess, game.targetWord);

    // 添加猜测记录
    game.guesses.push({
      word: guess,
      result: result,
      timestamp: Date.now()
    });

    // 更新已使用字母
    guess.split('').forEach(letter => {
      game.usedLetters.add(letter);
    });

    // 更新当前猜测
    game.currentGuess = '';

    // 检查游戏状态
    this.checkGameStatus(game);

    // 如果游戏结束，更新统计
    if (game.gameStatus !== 'playing') {
      this.finalizeGame(game);
    }

    this.saveState();
    return game;
  }

  /**
   * 评估猜测结果
   */
  evaluateGuess(guess, targetWord) {
    const result = new Array(5).fill('absent');
    const targetLetters = targetWord.split('');
    const guessLetters = guess.split('');

    // 第一遍：标记正确位置的字母
    for (let i = 0; i < 5; i++) {
      if (guessLetters[i] === targetLetters[i]) {
        result[i] = 'correct';
        targetLetters[i] = null;
        guessLetters[i] = null;
      }
    }

    // 第二遍：标记存在但位置错误的字母
    for (let i = 0; i < 5; i++) {
      if (guessLetters[i] !== null) {
        const targetIndex = targetLetters.indexOf(guessLetters[i]);
        if (targetIndex !== -1) {
          result[i] = 'present';
          targetLetters[targetIndex] = null;
        }
      }
    }

    return result;
  }

  /**
   * 检查游戏状态
   */
  checkGameStatus(game) {
    const lastGuess = game.guesses[game.guesses.length - 1];
    if (lastGuess && lastGuess.word === game.targetWord) {
      game.gameStatus = 'won';
      game.endTime = Date.now();
    } else if (game.guesses.length >= game.maxGuesses) {
      game.gameStatus = 'lost';
      game.endTime = Date.now();
    }
  }

  /**
   * 完成游戏并更新统计
   */
  finalizeGame(game) {
    const stats = this.state.statistics;
    stats.gamesPlayed++;

    if (game.gameStatus === 'won') {
      stats.gamesWon++;
      stats.currentStreak++;
      stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);

      // 更新猜测分布
      const guessCount = game.guesses.length;
      if (guessCount >= 1 && guessCount <= 6) {
        stats.guessDistribution[guessCount - 1]++;
      }
    } else {
      stats.currentStreak = 0;
    }

    // 添加到游戏历史
    this.state.gameHistory.unshift({
      id: game.id,
      targetWord: game.targetWord,
      gameStatus: game.gameStatus,
      guessCount: game.guesses.length,
      duration: game.endTime - game.startTime,
      date: new Date().toISOString().split('T')[0],
      completedAt: game.endTime
    });

    // 检查成就
    this.checkAchievements(game);

    // 更新最后游戏时间
    this.state.lastPlayed = Date.now();

    // 保存状态
    this.saveState();
  }

  /**
   * 检查成就
   */
  checkAchievements(game) {
    const stats = this.state.statistics;
    const newAchievements = [];

    // 首次获胜
    if (stats.gamesWon === 1 && !this.hasAchievement('first_win')) {
      newAchievements.push({
        id: 'first_win',
        name: '首次获胜',
        description: '完成你的第一个Wordle游戏',
        icon: '🎉',
        unlockedAt: Date.now()
      });
    }

    // 连胜大师
    if (stats.currentStreak >= 5 && !this.hasAchievement('streak_master')) {
      newAchievements.push({
        id: 'streak_master',
        name: '连胜大师',
        description: '连续赢得5场游戏',
        icon: '🔥',
        unlockedAt: Date.now()
      });
    }

    // 完美游戏
    if (game.gameStatus === 'won' && game.guesses.length === 1 && !this.hasAchievement('perfect_game')) {
      newAchievements.push({
        id: 'perfect_game',
        name: '完美游戏',
        description: '一次就猜中目标单词',
        icon: '💯',
        unlockedAt: Date.now()
      });
    }

    // 词汇大师
    if (stats.gamesPlayed >= 10 && !this.hasAchievement('word_master')) {
      newAchievements.push({
        id: 'word_master',
        name: '词汇大师',
        description: '完成10场游戏',
        icon: '📚',
        unlockedAt: Date.now()
      });
    }

    // 添加新成就
    newAchievements.forEach(achievement => {
      this.state.achievements.push(achievement);
    });
  }

  /**
   * 检查是否已有成就
   */
  hasAchievement(achievementId) {
    return this.state.achievements.some(a => a.id === achievementId);
  }

  /**
   * 获取当前游戏状态
   */
  getCurrentGame() {
    return this.state.currentGame;
  }

  /**
   * 获取游戏统计
   */
  getStatistics() {
    const stats = this.state.statistics;
    return {
      ...stats,
      winPercentage: stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0,
      averageGuesses: this.calculateAverageGuesses()
    };
  }

  /**
   * 计算平均猜测次数
   */
  calculateAverageGuesses() {
    const wonGames = this.state.gameHistory.filter(game => game.gameStatus === 'won');
    if (wonGames.length === 0) return 0;

    const totalGuesses = wonGames.reduce((sum, game) => sum + game.guessCount, 0);
    return (totalGuesses / wonGames.length).toFixed(1);
  }

  /**
   * 获取设置
   */
  getSettings() {
    return { ...this.state.settings };
  }

  /**
   * 更新设置
   */
  updateSettings(newSettings) {
    this.state.settings = {
      ...this.state.settings,
      ...newSettings
    };
    this.saveState();
    return this.state.settings;
  }

  /**
   * 获取成就
   */
  getAchievements() {
    return [...this.state.achievements];
  }

  /**
   * 获取游戏历史
   */
  getGameHistory(limit = 10) {
    return this.state.gameHistory.slice(0, limit);
  }

  /**
   * 重置统计
   */
  resetStatistics() {
    this.state.statistics = {
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: [0, 0, 0, 0, 0, 0]
    };
    this.state.achievements = [];
    this.saveState();
  }

  /**
   * 重置所有数据
   */
  resetAll() {
    this.state = {
      currentGame: null,
      gameHistory: [],
      statistics: {
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        maxStreak: 0,
        guessDistribution: [0, 0, 0, 0, 0, 0]
      },
      settings: {
        hardMode: false,
        darkTheme: false,
        colorblindMode: false,
        animations: true
      },
      achievements: [],
      lastPlayed: null
    };
    this.saveState();
  }

  /**
   * 保存状态到本地存储
   */
  saveState() {
    try {
      const serializedState = JSON.stringify(this.state, (key, value) => {
        // 处理Set对象
        if (value instanceof Set) {
          return { __type__: 'Set', values: Array.from(value) };
        }
        return value;
      });
      localStorage.setItem('wordleGameState', serializedState);
    } catch (error) {
      console.error('保存游戏状态失败:', error);
    }
  }

  /**
   * 从本地存储加载状态
   */
  loadState() {
    try {
      const serializedState = localStorage.getItem('wordleGameState');
      if (serializedState) {
        const loadedState = JSON.parse(serializedState, (key, value) => {
          // 恢复Set对象
          if (value && value.__type__ === 'Set') {
            return new Set(value.values);
          }
          return value;
        });

        // 验证状态结构
        if (this.isValidState(loadedState)) {
          this.state = loadedState;

          // 恢复当前游戏的usedLetters Set
          if (this.state.currentGame && !this.state.currentGame.usedLetters) {
            this.state.currentGame.usedLetters = new Set();
          }
        }
      }
    } catch (error) {
      console.error('加载游戏状态失败:', error);
    }
  }

  /**
   * 验证状态结构
   */
  isValidState(state) {
    return state &&
           typeof state === 'object' &&
           'statistics' in state &&
           'settings' in state &&
           'achievements' in state;
  }

  /**
   * 导出状态
   */
  exportState() {
    return JSON.stringify(this.state);
  }

  /**
   * 导入状态
   */
  importState(serializedState) {
    try {
      const importedState = JSON.parse(serializedState);
      if (this.isValidState(importedState)) {
        this.state = importedState;
        this.saveState();
        return true;
      }
      return false;
    } catch (error) {
      console.error('导入状态失败:', error);
      return false;
    }
  }

  /**
   * 清理旧数据
   */
  cleanupOldData(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    this.state.gameHistory = this.state.gameHistory.filter(game => {
      const gameDate = new Date(game.completedAt);
      return gameDate > cutoffDate;
    });

    this.saveState();
  }
}