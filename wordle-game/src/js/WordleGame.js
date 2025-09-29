/**
 * Wordle游戏核心逻辑类
 */
export class WordleGame {
  constructor(wordList = []) {
    this.wordList = wordList;
    this.targetWord = '';
    this.currentGuess = '';
    this.guesses = [];
    this.maxGuesses = 6;
    this.wordLength = 5;
    this.gameStatus = 'playing'; // playing, won, lost
    this.usedLetters = new Set();
    this.initializeGame();
  }

  /**
   * 初始化游戏
   */
  initializeGame() {
    this.targetWord = this.selectRandomWord();
    this.currentGuess = '';
    this.guesses = [];
    this.gameStatus = 'playing';
    this.usedLetters.clear();
  }

  /**
   * 选择随机目标单词
   */
  selectRandomWord() {
    if (this.wordList.length === 0) {
      return 'WORLD'; // 默认单词
    }
    const randomIndex = Math.floor(Math.random() * this.wordList.length);
    return this.wordList[randomIndex].toUpperCase();
  }

  /**
   * 添加字母到当前猜测
   */
  addLetter(letter) {
    if (this.gameStatus !== 'playing') return false;
    if (this.currentGuess.length < this.wordLength) {
      this.currentGuess += letter.toUpperCase();
      return true;
    }
    return false;
  }

  /**
   * 删除最后一个字母
   */
  removeLetter() {
    if (this.gameStatus !== 'playing') return false;
    if (this.currentGuess.length > 0) {
      this.currentGuess = this.currentGuess.slice(0, -1);
      return true;
    }
    return false;
  }

  /**
   * 提交猜测
   */
  submitGuess() {
    if (this.gameStatus !== 'playing') return false;
    if (this.currentGuess.length !== this.wordLength) return false;

    // 验证是否是有效单词
    if (!this.isValidWord(this.currentGuess)) return false;

    const result = this.evaluateGuess(this.currentGuess);
    this.guesses.push({
      word: this.currentGuess,
      result: result
    });

    // 更新已使用字母
    this.currentGuess.split('').forEach(letter => {
      this.usedLetters.add(letter);
    });

    // 检查游戏状态
    this.checkGameStatus();

    // 清空当前猜测
    this.currentGuess = '';

    return true;
  }

  /**
   * 评估猜测结果
   */
  evaluateGuess(guess) {
    const result = new Array(this.wordLength).fill('absent');
    const targetLetters = this.targetWord.split('');
    const guessLetters = guess.split('');

    // 第一遍：标记正确位置的字母
    for (let i = 0; i < this.wordLength; i++) {
      if (guessLetters[i] === targetLetters[i]) {
        result[i] = 'correct';
        targetLetters[i] = null; // 标记为已使用
        guessLetters[i] = null; // 标记为已使用
      }
    }

    // 第二遍：标记存在但位置错误的字母
    for (let i = 0; i < this.wordLength; i++) {
      if (guessLetters[i] !== null) {
        const targetIndex = targetLetters.indexOf(guessLetters[i]);
        if (targetIndex !== -1) {
          result[i] = 'present';
          targetLetters[targetIndex] = null; // 标记为已使用
        }
      }
    }

    return result;
  }

  /**
   * 检查游戏状态
   */
  checkGameStatus() {
    const lastGuess = this.guesses[this.guesses.length - 1];
    if (lastGuess && lastGuess.word === this.targetWord) {
      this.gameStatus = 'won';
    } else if (this.guesses.length >= this.maxGuesses) {
      this.gameStatus = 'lost';
    }
  }

  /**
   * 验证单词是否有效
   */
  isValidWord(word) {
    // 简单验证：5个字母，只包含字母
    return /^[A-Z]{5}$/.test(word);
  }

  /**
   * 获取游戏状态
   */
  getGameState() {
    return {
      targetWord: this.targetWord,
      currentGuess: this.currentGuess,
      guesses: this.guesses,
      gameStatus: this.gameStatus,
      maxGuesses: this.maxGuesses,
      wordLength: this.wordLength,
      usedLetters: Array.from(this.usedLetters),
      remainingGuesses: this.maxGuesses - this.guesses.length
    };
  }

  /**
   * 获取字母状态
   */
  getLetterStatus(letter) {
    const upperLetter = letter.toUpperCase();

    // 检查所有猜测中的字母状态
    for (const guess of this.guesses) {
      const letterIndex = guess.word.indexOf(upperLetter);
      if (letterIndex !== -1) {
        return guess.result[letterIndex];
      }
    }

    return 'unused';
  }

  /**
   * 设置单词列表
   */
  setWordList(wordList) {
    this.wordList = wordList;
    this.initializeGame();
  }

  /**
   * 重置游戏
   */
  resetGame() {
    this.initializeGame();
  }
}