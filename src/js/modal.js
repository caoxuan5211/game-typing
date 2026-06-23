/**
 * 模态框和UI交互扩展
 * @version 1.0.0
 */

import { THEMES } from './config.js';
import StorageManager from './storage.js';

export class ModalManager {
    constructor() {
        this.modals = {};
        this.init();
    }

    init() {
        // 注册所有模态框
        this.registerModal('theme', 'themeModal', 'themeToggle', 'themeModalClose');
        this.registerModal('stats', 'statsModal', 'statsBtn', 'statsModalClose');
        this.registerModal('customText', 'customTextModal', 'customModeBtn', 'customTextModalClose');
        this.registerModal('complete', 'modal', null, 'modalClose');

        // 设置事件监听
        this.setupEventListeners();
    }

    registerModal(name, modalId, triggerId, closeId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        this.modals[name] = {
            element: modal,
            trigger: triggerId ? document.getElementById(triggerId) : null,
            closeBtn: closeId ? document.getElementById(closeId) : null
        };
    }

    setupEventListeners() {
        // 主题模态框
        if (this.modals.theme) {
            this.modals.theme.trigger?.addEventListener('click', () => this.show('theme'));
            this.modals.theme.closeBtn?.addEventListener('click', () => this.hide('theme'));

            // 主题选择
            document.querySelectorAll('.theme-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const theme = e.currentTarget.dataset.theme;
                    this.selectTheme(theme);
                });
            });
        }

        // 统计模态框
        if (this.modals.stats) {
            this.modals.stats.trigger?.addEventListener('click', () => {
                this.renderStats();
                this.show('stats');
            });
            this.modals.stats.closeBtn?.addEventListener('click', () => this.hide('stats'));
        }

        // 自定义文本模态框
        if (this.modals.customText) {
            this.modals.customText.trigger?.addEventListener('click', () => this.show('customText'));
            this.modals.customText.closeBtn?.addEventListener('click', () => this.hide('customText'));

            document.getElementById('saveCustomTextBtn')?.addEventListener('click', () => {
                this.saveCustomText();
            });

            document.getElementById('cancelCustomTextBtn')?.addEventListener('click', () => {
                this.hide('customText');
            });
        }

        // 完成模态框
        if (this.modals.complete) {
            this.modals.complete.closeBtn?.addEventListener('click', () => this.hide('complete'));
        }

        // 点击遮罩层关闭
        Object.values(this.modals).forEach(modal => {
            modal.element?.addEventListener('click', (e) => {
                if (e.target === modal.element || e.target.classList.contains('modal-overlay')) {
                    const name = Object.keys(this.modals).find(key => this.modals[key] === modal);
                    this.hide(name);
                }
            });
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                Object.keys(this.modals).forEach(name => {
                    if (this.modals[name].element?.classList.contains('show')) {
                        this.hide(name);
                    }
                });
            }
        });
    }

    show(name) {
        const modal = this.modals[name];
        if (modal && modal.element) {
            modal.element.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    hide(name) {
        const modal = this.modals[name];
        if (modal && modal.element) {
            modal.element.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    selectTheme(themeName) {
        // 更新UI
        document.querySelectorAll('.theme-btn').forEach(btn => {
            if (btn.dataset.theme === themeName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 应用主题
        const theme = THEMES[themeName];
        if (theme) {
            document.body.style.background = theme.gradient;
            document.documentElement.style.setProperty('--primary-color', theme.primary);
            document.documentElement.style.setProperty('--secondary-color', theme.secondary);
            document.documentElement.style.setProperty('--accent-color', theme.accent);

            StorageManager.set('theme', themeName);
        }

        // 关闭模态框
        setTimeout(() => this.hide('theme'), 300);
    }

    renderStats() {
        const stats = StorageManager.getStats();
        const highScores = StorageManager.getHighScores();
        const achievements = StorageManager.getAchievements();

        const content = document.getElementById('statsContent');
        if (!content) return;

        content.innerHTML = `
            <div class="stats-section">
                <h3 class="stats-section-title">总体统计</h3>
                <div class="stats-grid">
                    <div class="stats-card">
                        <div class="stats-card-title">总游戏次数</div>
                        <div class="stats-card-value">${stats.totalGames}</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-card-title">平均速度</div>
                        <div class="stats-card-value">${stats.averageWpm}</div>
                        <div class="stats-card-label">WPM</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-card-title">最高速度</div>
                        <div class="stats-card-value">${stats.bestWpm}</div>
                        <div class="stats-card-label">WPM</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-card-title">平均正确率</div>
                        <div class="stats-card-value">${stats.averageAccuracy}%</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-card-title">完美游戏</div>
                        <div class="stats-card-value">${stats.perfectGames}</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-card-title">总字符数</div>
                        <div class="stats-card-value">${stats.totalCharacters.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            <div class="stats-section">
                <h3 class="stats-section-title">高分榜 (前10名)</h3>
                ${highScores.length > 0 ? `
                    <table class="high-scores-table">
                        <thead>
                            <tr>
                                <th>排名</th>
                                <th>速度</th>
                                <th>正确率</th>
                                <th>模式</th>
                                <th>日期</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${highScores.slice(0, 10).map((score, index) => {
                                let rankClass = '';
                                if (index === 0) rankClass = 'gold';
                                else if (index === 1) rankClass = 'silver';
                                else if (index === 2) rankClass = 'bronze';

                                return `
                                    <tr>
                                        <td><span class="rank-badge ${rankClass}">${index + 1}</span></td>
                                        <td><strong>${score.wpm}</strong> WPM</td>
                                        <td>${score.accuracy}%</td>
                                        <td>${this.getModeName(score.mode)}</td>
                                        <td>${new Date(score.timestamp).toLocaleDateString()}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                ` : '<p class="empty-state">暂无记录</p>'}
            </div>

            <div class="stats-section">
                <h3 class="stats-section-title">成就 (${achievements.length}/5)</h3>
                <div class="achievements-grid">
                    ${this.renderAchievements(achievements)}
                </div>
            </div>

            <div class="stats-actions">
                <button class="btn btn-secondary" id="resetStatsBtn">重置统计</button>
            </div>
        `;

        // 重置统计按钮
        document.getElementById('resetStatsBtn')?.addEventListener('click', () => {
            if (confirm('确定要重置所有统计数据吗？此操作不可撤销。')) {
                StorageManager.resetStats();
                this.renderStats();
            }
        });
    }

    getModeName(mode) {
        const names = {
            code: '代码片段',
            symbols: '符号练习',
            mixed: '混合模式',
            custom: '自定义'
        };
        return names[mode] || mode;
    }

    renderAchievements(unlocked) {
        const allAchievements = [
            { id: 'speed_demon', name: '速度恶魔', icon: '🚀', description: 'WPM达到100+' },
            { id: 'perfectionist', name: '完美主义者', icon: '✨', description: '100%正确率' },
            { id: 'marathon', name: '马拉松选手', icon: '🏃', description: '完成200+字符' },
            { id: 'consistent', name: '稳定发挥', icon: '🎖️', description: '10场以上平均60+ WPM' },
            { id: 'night_owl', name: '夜猫子', icon: '🦉', description: '凌晨0-6点游玩' }
        ];

        return allAchievements.map(achievement => {
            const isUnlocked = unlocked.includes(achievement.id);
            return `
                <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-card-icon">${achievement.icon}</div>
                    <div class="achievement-card-name">${achievement.name}</div>
                    <div class="achievement-card-description">${achievement.description}</div>
                    ${isUnlocked ? '<div class="achievement-badge">✓ 已解锁</div>' : ''}
                </div>
            `;
        }).join('');
    }

    saveCustomText() {
        const input = document.getElementById('customTextInput');
        const text = input?.value.trim();

        if (!text) {
            alert('请输入文本内容');
            return;
        }

        // 触发自定义文本设置
        const event = new CustomEvent('customTextSet', { detail: { text } });
        window.dispatchEvent(event);

        this.hide('customText');
        input.value = '';
    }
}

export default new ModalManager();
