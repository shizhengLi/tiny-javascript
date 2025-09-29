/**
 * 单词验证器 - 验证猜测的单词是否有效
 */
export class WordValidator {
  constructor() {
    this.validWords = new Set();
    this.commonWords = new Set([
      'ABOUT', 'ABOVE', 'ABUSE', 'ACTOR', 'ACUTE', 'ADMIT', 'ADOPT', 'ADULT', 'AFTER', 'AGAIN',
      'AGENT', 'AGREE', 'AHEAD', 'ALARM', 'ALBUM', 'ALERT', 'ALIEN', 'ALIGN', 'ALIVE', 'ALLOW',
      'ALONE', 'ALONG', 'ALTER', 'ANGEL', 'ANGER', 'ANGLE', 'ANGRY', 'APART', 'APPLE', 'APPLY',
      'ARENA', 'ARGUE', 'ARISE', 'ARRAY', 'ASIDE', 'ASSET', 'AVOID', 'AWARD', 'AWARE', 'BADLY',
      'BAKER', 'BASES', 'BASIC', 'BEACH', 'BEGAN', 'BEING', 'BELOW', 'BENCH', 'BILLY', 'BIRTH',
      'BLACK', 'BLAME', 'BLIND', 'BLOCK', 'BLOOD', 'BOARD', 'BOOST', 'BOOTH', 'BOUND', 'BRAIN',
      'BRAND', 'BRAVE', 'BREAD', 'BREAK', 'BREED', 'BRIEF', 'BRING', 'BROAD', 'BROKE', 'BROWN',
      'BUILD', 'BUILT', 'BUYER', 'CABLE', 'CALIF', 'CARRY', 'CATCH', 'CAUSE', 'CHAIN', 'CHAIR',
      'CHAOS', 'CHARM', 'CHART', 'CHASE', 'CHEAP', 'CHECK', 'CHEST', 'CHIEF', 'CHILD', 'CHINA',
      'CHOSE', 'CIVIL', 'CLAIM', 'CLASS', 'CLEAN', 'CLEAR', 'CLICK', 'CLIMB', 'CLOCK', 'CLOSE',
      'CLOUD', 'COACH', 'COAST', 'COULD', 'COUNT', 'COURT', 'COVER', 'CRAFT', 'CRASH', 'CRAZY',
      'CREAM', 'CRIME', 'CROSS', 'CROWD', 'CROWN', 'CRUDE', 'CURVE', 'CYCLE', 'DAILY', 'DANCE',
      'DATED', 'DEALT', 'DEATH', 'DEBUT', 'DELAY', 'DEPTH', 'DOING', 'DOUBT', 'DOZEN', 'DRAFT',
      'DRAMA', 'DRANK', 'DRAWN', 'DREAM', 'DRESS', 'DRILL', 'DRINK', 'DRIVE', 'DROVE', 'DYING',
      'EAGER', 'EARLY', 'EARTH', 'EIGHT', 'ELITE', 'EMPTY', 'ENEMY', 'ENJOY', 'ENTER', 'ENTRY',
      'EQUAL', 'ERROR', 'EVENT', 'EVERY', 'EXACT', 'EXIST', 'EXTRA', 'FAITH', 'FALSE', 'FAULT',
      'FIBER', 'FIELD', 'FIFTH', 'FIFTY', 'FIGHT', 'FINAL', 'FIRST', 'FIXED', 'FLASH', 'FLEET',
      'FLOOR', 'FLUID', 'FOCUS', 'FORCE', 'FORTH', 'FORTY', 'FORUM', 'FOUND', 'FRAME', 'FRANK',
      'FRAUD', 'FRESH', 'FRONT', 'FRUIT', 'FULLY', 'FUNNY', 'GIANT', 'GIVEN', 'GLASS', 'GLOBE',
      'GOING', 'GRACE', 'GRADE', 'GRAND', 'GRANT', 'GRASS', 'GRAVE', 'GREAT', 'GREEN', 'GROSS',
      'GROUP', 'GROWN', 'GUARD', 'GUESS', 'GUEST', 'GUIDE', 'HAPPY', 'HARRY', 'HEART', 'HEAVY',
      'HELLO', 'HENRY', 'HORSE', 'HOTEL', 'HOUSE', 'HUMAN', 'IDEAL', 'IMAGE', 'IMPLY', 'INDEX',
      'INNER', 'INPUT', 'ISSUE', 'JAPAN', 'JIMMY', 'JOINT', 'JONES', 'JUDGE', 'KNOWN', 'LABEL',
      'LARGE', 'LASER', 'LATER', 'LAUGH', 'LAYER', 'LEARN', 'LEASE', 'LEAST', 'LEAVE', 'LEGAL',
      'LEMON', 'LEVEL', 'LEWIS', 'LIGHT', 'LIMIT', 'LINKS', 'LIVES', 'LOCAL', 'LOGIC', 'LOOSE',
      'LOWER', 'LUCKY', 'LUNCH', 'LYING', 'MAGIC', 'MAJOR', 'MAKER', 'MARCH', 'MARIA', 'MATCH',
      'MAYBE', 'MAYOR', 'MEANT', 'MEDIA', 'METAL', 'MIGHT', 'MINOR', 'MINUS', 'MIXED', 'MODEL',
      'MONEY', 'MONTH', 'MORAL', 'MOTOR', 'MOUNT', 'MOUSE', 'MOUTH', 'MOVED', 'MOVIE', 'MUSIC',
      'NEEDS', 'NEVER', 'NEWLY', 'NIGHT', 'NOISE', 'NORTH', 'NOTED', 'NOVEL', 'NURSE', 'OCCUR',
      'OCEAN', 'OFFER', 'OFTEN', 'ORDER', 'OTHER', 'OUGHT', 'OUTER', 'OWNER', 'PAINT', 'PANEL',
      'PAPER', 'PARIS', 'PARTY', 'PEACE', 'PENNY', 'PETER', 'PHASE', 'PHONE', 'PHOTO', 'PIANO',
      'PIECE', 'PILOT', 'PITCH', 'PLACE', 'PLAIN', 'PLANE', 'PLANT', 'PLATE', 'POINT', 'POUND',
      'POWER', 'PRESS', 'PRICE', 'PRIDE', 'PRIME', 'PRINT', 'PRIOR', 'PRIZE', 'PROOF', 'PROUD',
      'PROVE', 'QUEEN', 'QUICK', 'QUIET', 'QUITE', 'RADIO', 'RAISE', 'RANGE', 'RAPID', 'RATIO',
      'REACH', 'READY', 'REALM', 'REFER', 'RELAX', 'REPLY', 'RIDER', 'RIDGE', 'RIFLE', 'RIGHT',
      'RIGID', 'RIVER', 'ROBIN', 'ROCKY', 'ROGER', 'ROMAN', 'ROUGH', 'ROUND', 'ROUTE', 'ROYAL',
      'RURAL', 'SCALE', 'SCENE', 'SCOPE', 'SCORE', 'SENSE', 'SERVE', 'SEVEN', 'SHALL', 'SHAPE',
      'SHARE', 'SHARP', 'SHEET', 'SHELF', 'SHELL', 'SHIFT', 'SHINE', 'SHIRT', 'SHOCK', 'SHOOT',
      'SHORT', 'SHOWN', 'SIGHT', 'SILLY', 'SIMON', 'SINCE', 'SIXTH', 'SIXTY', 'SIZED', 'SKILL',
      'SLASH', 'SLEEP', 'SLIDE', 'SMALL', 'SMART', 'SMILE', 'SMITH', 'SMOKE', 'SOLID', 'SOLVE',
      'SORRY', 'SOUND', 'SOUTH', 'SPACE', 'SPARE', 'SPEAK', 'SPEED', 'SPEND', 'SPENT', 'SPLIT',
      'SPOKE', 'SPORT', 'STAFF', 'STAGE', 'STAKE', 'STAND', 'START', 'STATE', 'STEAM', 'STEEL',
      'STICK', 'STILL', 'STOCK', 'STONE', 'STOOD', 'STORE', 'STORM', 'STORY', 'STRIP', 'STUCK',
      'STUDY', 'STUFF', 'STYLE', 'SUGAR', 'SUITE', 'SUNNY', 'SUPER', 'SURGE', 'SWEET', 'TABLE',
      'TAKEN', 'TASTE', 'TAXES', 'TEACH', 'TEETH', 'TERRY', 'TEXAS', 'THANK', 'THEFT', 'THEIR',
      'THEME', 'THERE', 'THESE', 'THICK', 'THING', 'THINK', 'THIRD', 'THOSE', 'THREE', 'THREW',
      'THROW', 'TIGHT', 'TIMES', 'TIRED', 'TITLE', 'TODAY', 'TOPIC', 'TOTAL', 'TOUCH', 'TOUGH',
      'TOWER', 'TRACK', 'TRADE', 'TRAIN', 'TRASH', 'TREAT', 'TREND', 'TRIAL', 'TRIBE', 'TRICK',
      'TRIED', 'TRIES', 'TROOP', 'TRUCK', 'TRULY', 'TRUST', 'TRUTH', 'TWICE', 'UNDER', 'UNDUE',
      'UNION', 'UNITY', 'UNTIL', 'UPPER', 'UPSET', 'URBAN', 'USAGE', 'USUAL', 'VALID', 'VALUE',
      'VIDEO', 'VIRUS', 'VISIT', 'VITAL', 'VOCAL', 'VOICE', 'WASTE', 'WATCH', 'WATER', 'WHEEL',
      'WHERE', 'WHICH', 'WHILE', 'WHITE', 'WHOLE', 'WHOSE', 'WOMAN', 'WOMEN', 'WORLD', 'WORRY',
      'WORSE', 'WORST', 'WORTH', 'WOULD', 'WOUND', 'WRITE', 'WRONG', 'WROTE', 'YIELD', 'YOUNG',
      'YOUTH'
    ]);

    // 初始化常用单词
    this.commonWords.forEach(word => this.validWords.add(word));
  }

  /**
   * 验证单词格式
   */
  validateFormat(word) {
    if (!word || typeof word !== 'string') {
      return { valid: false, reason: '单词不能为空' };
    }

    const upperWord = word.toUpperCase();

    if (upperWord.length !== 5) {
      return { valid: false, reason: '单词必须是5个字母' };
    }

    if (!/^[A-Z]{5}$/.test(upperWord)) {
      return { valid: false, reason: '单词只能包含字母' };
    }

    return { valid: true, word: upperWord };
  }

  /**
   * 验证单词是否在有效单词列表中
   */
  validateWord(word) {
    const formatResult = this.validateFormat(word);

    if (!formatResult.valid) {
      return formatResult;
    }

    const normalizedWord = formatResult.word;

    if (!this.validWords.has(normalizedWord)) {
      return {
        valid: false,
        reason: '不是有效的英文单词',
        word: normalizedWord
      };
    }

    return {
      valid: true,
      word: normalizedWord,
      isCommon: this.commonWords.has(normalizedWord)
    };
  }

  /**
   * 添加自定义单词到验证列表
   */
  addCustomWord(word) {
    const formatResult = this.validateFormat(word);

    if (!formatResult.valid) {
      return formatResult;
    }

    const normalizedWord = formatResult.word;
    this.validWords.add(normalizedWord);

    return {
      valid: true,
      word: normalizedWord,
      message: '单词已添加到验证列表'
    };
  }

  /**
   * 批量添加单词
   */
  addWordList(words) {
    const results = [];

    words.forEach(word => {
      const result = this.addCustomWord(word);
      results.push(result);
    });

    const successful = results.filter(r => r.valid).length;
    const failed = results.length - successful;

    return {
      successful,
      failed,
      results,
      message: `成功添加 ${successful} 个单词，失败 ${failed} 个`
    };
  }

  /**
   * 移除单词
   */
  removeWord(word) {
    const formatResult = this.validateFormat(word);

    if (!formatResult.valid) {
      return formatResult;
    }

    const normalizedWord = formatResult.word;
    const removed = this.validWords.delete(normalizedWord);

    if (removed) {
      return {
        valid: true,
        word: normalizedWord,
        message: '单词已从验证列表中移除'
      };
    } else {
      return {
        valid: false,
        word: normalizedWord,
        reason: '单词不在验证列表中'
      };
    }
  }

  /**
   * 检查单词是否有效
   */
  isValidWord(word) {
    return this.validateWord(word).valid;
  }

  /**
   * 获取相似单词建议
   */
  getSuggestions(partialWord, limit = 5) {
    if (!partialWord || partialWord.length === 0) {
      return [];
    }

    const upperPattern = partialWord.toUpperCase();
    const suggestions = [];

    for (const word of this.validWords) {
      if (word.startsWith(upperPattern)) {
        suggestions.push(word);
        if (suggestions.length >= limit) {
          break;
        }
      }
    }

    return suggestions;
  }

  /**
   * 获取随机单词
   */
  getRandomWord() {
    const words = Array.from(this.validWords);
    if (words.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * words.length);
    return words[randomIndex];
  }

  /**
   * 获取单词统计信息
   */
  getStats() {
    return {
      totalWords: this.validWords.size,
      commonWords: this.commonWords.size,
      customWords: this.validWords.size - this.commonWords.size,
      sampleWords: Array.from(this.validWords).slice(0, 10)
    };
  }

  /**
   * 重置为默认单词列表
   */
  reset() {
    this.validWords.clear();
    this.commonWords.forEach(word => this.validWords.add(word));
  }

  /**
   * 导出单词列表
   */
  exportWords() {
    return Array.from(this.validWords);
  }

  /**
   * 导入单词列表
   */
  importWords(words) {
    this.validWords.clear();
    const results = this.addWordList(words);
    return results;
  }
}