/**
 * UI 渲染模块
 * @version 1.0.0
 */

import { THEMES } from './config.js';

export class UIRenderer {
    constructor() {
        this.currentTheme = 'purple';
        this.elements = {};
    }

    init(elements) {
        this.elements = elements;
    }

    // 渲染代码显示区域
    renderText(targetText, currentInput) {
        if (!this.elements.codeDisplay) return;

        let html = '';
        const inputLength = currentInput.length;

        for (let i = 0; i < targetText.length; i++) {
            const char = targetText[i];
            let className = '';
            let displayChar = char;

            if (i < inputLength) {
                className = currentInput[i] === char ? 'correct' : 'incorrect';
            } else if (i === inputLength) {
                className = 'current';
            }

            // 处理特殊字符显示
            if (char === ' ') {
                displayChar = '&nbsp;';
            } else if (char === '\n') {
                displayChar = '<br>';
            } else if (char === '\t') {
                displayChar = '&nbsp;&nbsp;&nbsp;&nbsp;';
            } else {
                displayChar = this.escapeHtml(char);
            }

            html += `<span class="${className}" data-index="${i}">${displayChar}</span>`;
        }

        this.elements.codeDisplay.innerHTML = html;
        this.scrollToCurrentChar(inputLength);
    }

    escapeHtml(text) {
        const map = {
            '<': '&lt;',
            '>': '&gt;',
            '&': '&amp;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[<>&"']/g, m => map[m]);
    }

    scrollToCurrentChar(index) {
        const currentChar = this.elements.codeDisplay.querySelector(`[data-index="${index}"]`);
        if (currentChar && this.elements.codeDisplay) {
            const container = this.elements.codeDisplay;
            const charRect = currentChar.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            if (charRect.top < containerRect.top || charRect.bottom > containerRect.bottom) {
                currentChar.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    // 更新统计显示
    updateStats(stats) {
        if (this.elements.timer) {
            const time = Math.floor(stats.time || 0);
            this.elements.timer.textContent = `${time}s`;
        }

        if (this.elements.wpm) {
            this.elements.wpm.textContent = `${stats.wpm || 0} WPM`;
        }

        if (this.elements.accuracy) {
            const accuracy = stats.accuracy || 100;
            this.elements.accuracy.textContent = `${accuracy}%`;

            // 根据准确率添加颜色类
            this.elements.accuracy.className = 'value';
            if (accuracy < 80) {
                this.elements.accuracy.classList.add('low');
            } else if (accuracy >= 95) {
                this.elements.accuracy.classList.add('high');
            }
        }
    }

    // 显示完成模态框
    showCompleteModal(stats) {
        if (!this.elements.modal) return;

        const modal = this.elements.modal;

        // 更新统计数据
        if (this.elements.finalWpm) {
            this.elements.finalWpm.textContent = stats.wpm;
        }
        if (this.elements.finalAccuracy) {
            this.elements.finalAccuracy.textContent = stats.accuracy;
        }
        if (this.elements.finalTime) {
            this.elements.finalTime.textContent = stats.time;
        }
        if (this.elements.finalCpm) {
            this.elements.finalCpm.textContent = stats.cpm;
        }
        if (this.elements.finalConsistency) {
            this.elements.finalConsistency.textContent = stats.consistency;
        }
        if (this.elements.finalCorrections) {
            this.elements.finalCorrections.textContent = stats.corrections;
        }

        modal.classList.add('show');

        // 添加动画效果
        setTimeout(() => {
            modal.querySelector('.modal-content')?.classList.add('animate');
        }, 50);
    }

    hideCompleteModal() {
        if (!this.elements.modal) return;

        this.elements.modal.classList.remove('show');
        this.elements.modal.querySelector('.modal-content')?.classList.remove('animate');
    }

    // 显示成就通知
    showAchievement(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-text">
                <div class="achievement-title">成就解锁!</div>
                <div class="achievement-name">${achievement.name}</div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // 切换主题
    setTheme(themeName) {
        const theme = THEMES[themeName];
        if (!theme) return;

        this.currentTheme = themeName;
        document.body.style.background = theme.gradient;
        document.documentElement.style.setProperty('--primary-color', theme.primary);
        document.documentElement.style.setProperty('--secondary-color', theme.secondary);
        document.documentElement.style.setProperty('--accent-color', theme.accent);

        // 保存主题设置
        localStorage.setItem('typing_game_theme', themeName);
    }

    // 显示进度条
    updateProgress(current, total) {
        if (!this.elements.progressBar) return;

        const percentage = (current / total) * 100;
        this.elements.progressBar.style.width = `${percentage}%`;

        // 添加颜色过渡
        if (percentage < 30) {
            this.elements.progressBar.style.background = '#ef4444';
        } else if (percentage < 70) {
            this.elements.progressBar.style.background = '#f59e0b';
        } else {
            this.elements.progressBar.style.background = '#22c55e';
        }
    }

    // 显示加载动画
    showLoading() {
        if (this.elements.loading) {
            this.elements.loading.style.display = 'flex';
        }
    }

    hideLoading() {
        if (this.elements.loading) {
            this.elements.loading.style.display = 'none';
        }
    }

    // 显示错误消息
    showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        document.body.appendChild(errorEl);

        setTimeout(() => errorEl.classList.add('show'), 100);

        setTimeout(() => {
            errorEl.classList.remove('show');
            setTimeout(() => errorEl.remove(), 300);
        }, 3000);
    }

    // 显示提示
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // 更新按钮状态
    updateButtonState(button, state) {
        if (!button) return;

        switch (state) {
            case 'disabled':
                button.disabled = true;
                button.classList.add('disabled');
                break;
            case 'enabled':
                button.disabled = false;
                button.classList.remove('disabled');
                break;
            case 'loading':
                button.disabled = true;
                button.classList.add('loading');
                break;
            default:
                button.disabled = false;
                button.classList.remove('disabled', 'loading');
        }
    }

    // 高亮当前模式按钮
    highlightModeButton(mode) {
        const buttons = document.querySelectorAll('.mode-btn');
        buttons.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
}

export default new UIRenderer();
