/**
 * 游戏统计显示组件
 */
export class GameStats {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = {
      showDetails: true,
      animations: true,
      ...options
    };

    this.statsElement = null;
    this.modalElement = null;

    this.init();
  }

  /**
   * 初始化统计组件
   */
  init() {
    this.createStatsElement();
    this.bindEvents();
  }

  /**
   * 创建统计DOM结构
   */
  createStatsElement() {
    this.statsElement = document.createElement('div');
    this.statsElement.className = 'game-stats';
    this.container.appendChild(this.statsElement);
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 可以添加点击显示详细统计的事件
  }

  /**
   * 更新统计显示
   */
  updateStats(statistics) {
    const winPercentage = statistics.gamesPlayed > 0
      ? Math.round((statistics.gamesWon / statistics.gamesPlayed) * 100)
      : 0;

    const currentStreak = statistics.currentStreak || 0;
    const maxStreak = statistics.maxStreak || 0;

    this.statsElement.innerHTML = `
      <div class="stats-summary">
        <div class="stat-item">
          <div class="stat-number">${statistics.gamesPlayed}</div>
          <div class="stat-label">游戏次数</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">${winPercentage}%</div>
          <div class="stat-label">胜率</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">${currentStreak}</div>
          <div class="stat-label">当前连胜</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">${maxStreak}</div>
          <div class="stat-label">最高连胜</div>
        </div>
      </div>
    `;

    if (this.options.animations) {
      this.animateStats();
    }
  }

  /**
   * 添加动画效果
   */
  animateStats() {
    const statNumbers = this.statsElement.querySelectorAll('.stat-number');
    statNumbers.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('animate');
      }, index * 100);
    });
  }

  /**
   * 显示详细统计弹窗
   */
  showDetailedStats(statistics) {
    if (this.modalElement) {
      this.closeModal();
    }

    this.modalElement = document.createElement('div');
    this.modalElement.className = 'modal stats-modal';

    const winPercentage = statistics.gamesPlayed > 0
      ? Math.round((statistics.gamesWon / statistics.gamesPlayed) * 100)
      : 0;

    const maxGuessCount = Math.max(...statistics.guessDistribution);
    const maxBarWidth = 200; // 最大条形宽度

    this.modalElement.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>游戏统计</h2>
          <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
        </div>

        <div class="modal-body">
          <div class="stats-grid">
            <div class="stats-overview">
              <div class="overview-stat">
                <div class="big-number">${statistics.gamesPlayed}</div>
                <div class="big-label">游戏次数</div>
              </div>
              <div class="overview-stat">
                <div class="big-number">${winPercentage}%</div>
                <div class="big-label">胜率</div>
              </div>
              <div class="overview-stat">
                <div class="big-number">${statistics.currentStreak}</div>
                <div class="big-label">当前连胜</div>
              </div>
              <div class="overview-stat">
                <div class="big-number">${statistics.maxStreak}</div>
                <div class="big-label">最高连胜</div>
              </div>
            </div>

            <div class="guess-distribution">
              <h3>猜测分布</h3>
              <div class="distribution-bars">
                ${statistics.guessDistribution.map((count, index) => {
                  const percentage = maxGuessCount > 0 ? (count / maxGuessCount) * 100 : 0;
                  const barWidth = (count / maxGuessCount) * maxBarWidth;
                  return `
                    <div class="distribution-row">
                      <div class="guess-number">${index + 1}</div>
                      <div class="bar-container">
                        <div class="bar" style="width: ${barWidth}px">
                          <span class="count">${count}</span>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <div class="stats-achievements">
              <h3>成就</h3>
              <div class="achievements-grid">
                ${this.generateAchievementsHTML(statistics.achievements || [])}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalElement);

    // 添加显示动画
    setTimeout(() => {
      this.modalElement.classList.add('show');
    }, 10);

    // 点击外部关闭
    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) {
        this.closeModal();
      }
    });
  }

  /**
   * 生成成就HTML
   */
  generateAchievementsHTML(achievements) {
    if (achievements.length === 0) {
      return '<div class="no-achievements">还没有解锁成就</div>';
    }

    return achievements.map(achievement => `
      <div class="achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}">
        <div class="achievement-icon">${achievement.icon || '🏆'}</div>
        <div class="achievement-info">
          <div class="achievement-name">${achievement.name}</div>
          <div class="achievement-description">${achievement.description}</div>
          ${achievement.unlockedAt ? `
            <div class="achievement-date">
              解锁于 ${new Date(achievement.unlockedAt).toLocaleDateString()}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  /**
   * 关闭弹窗
   */
  closeModal() {
    if (this.modalElement) {
      this.modalElement.classList.remove('show');
      setTimeout(() => {
        if (this.modalElement && this.modalElement.parentNode) {
          this.modalElement.parentNode.removeChild(this.modalElement);
          this.modalElement = null;
        }
      }, 300);
    }
  }

  /**
   * 显示分享提示
   */
  showShareHint() {
    const toast = document.createElement('div');
    toast.className = 'toast share-hint';
    toast.innerHTML = `
      <div class="toast-content">
        <span>🎉 游戏完成！</span>
        <button class="share-btn">分享结果</button>
      </div>
    `;
    document.body.appendChild(toast);

    // 绑定分享按钮事件
    const shareBtn = toast.querySelector('.share-btn');
    shareBtn.addEventListener('click', () => {
      this.shareResults();
      document.body.removeChild(toast);
    });

    // 显示动画
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // 自动隐藏
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.remove('show');
        setTimeout(() => {
          if (toast.parentNode) {
            document.body.removeChild(toast);
          }
        }, 300);
      }
    }, 5000);
  }

  /**
   * 分享游戏结果
   */
  shareResults() {
    const shareText = this.generateShareText();

    if (navigator.share) {
      navigator.share({
        title: 'Wordle 游戏结果',
        text: shareText
      }).catch(err => console.log('分享失败:', err));
    } else {
      // 复制到剪贴板
      navigator.clipboard.writeText(shareText).then(() => {
        this.showToast('结果已复制到剪贴板！');
      }).catch(err => {
        console.log('复制失败:', err);
        this.showToast('分享失败，请手动复制');
      });
    }
  }

  /**
   * 生成分享文本
   */
  generateShareText() {
    // 这里需要从游戏状态中获取实际结果
    // 简化版本，实际应该根据具体游戏结果生成
    const date = new Date().toLocaleDateString();
    const emoji = ['⬛', '🟨', '🟩'];

    return `Wordle ${date}

${emoji[0]}${emoji[1]}${emoji[0]}${emoji[0]}${emoji[0]}
${emoji[0]}${emoji[0]}${emoji[1]}${emoji[0]}${emoji[0]}
${emoji[2]}${emoji[2]}${emoji[2]}${emoji[2]}${emoji[2]}

🎉 游戏完成！`;
  }

  /**
   * 显示提示信息
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          if (toast.parentNode) {
            document.body.removeChild(toast);
          }
        }, 300);
      }, 2000);
    }, 10);
  }

  /**
   * 设置选项
   */
  setOptions(options) {
    this.options = { ...this.options, ...options };
  }

  /**
   * 获取统计元素
   */
  getElement() {
    return this.statsElement;
  }

  /**
   * 销毁统计组件
   */
  destroy() {
    this.closeModal();
    if (this.statsElement && this.statsElement.parentNode) {
      this.statsElement.parentNode.removeChild(this.statsElement);
    }
  }
}