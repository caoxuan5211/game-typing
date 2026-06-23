/**
 * 游戏核心逻辑模块
 * @version 1.0.0
 */

import { getRandomText } from './data.js';
import { LiveStats } from './stats.js';
import UIRenderer from './ui.js';
import SoundManager from './sound.js';
import StorageManager from './storage.js';
import { ACHIEVEMENTS } from './config.js';

export class TypingGame {
    constructor() {
        this.mode = 'code';
        this.difficulty = 'medium';
        this.targetText = '';
        this.currentInput = '';
        this.isPlaying = false;
        this.isPaused = false;

        this.liveStats = new LiveStats((stats) => {
            UIRenderer.updateStats(stats);
        });

        this.elements = {};
        this.lastChar = null;
        this.customText = null;
    }

    init() {
        this.cacheElements();
        UIRenderer.init(this.elements);
        this.setupEventListeners();
        this.loadSettings();
        this.newGame();
    }

    cacheElements() {
        this.elements = {
            codeDisplay: document.getElementById('codeDisplay'),
            input: document.getElementById('input'),
            timer: document.getElementById('timer'),
            wpm: document.getElementById('wpm'),
            accuracy: document.getElementById('accuracy'),
            startBtn: document.getElementById('startBtn'),
            resetBtn: document.getElementById('resetBtn'),
            modal: document.getElementById('modal'),
            restartBtn: document.getElementById('restartBtn'),
            finalWpm: document.getElementById('finalWpm'),
            finalAccuracy: document.getElementById('finalAccuracy'),
            finalTime: document.getElementById('finalTime'),
            finalCpm: document.getElementById('finalCpm'),
            finalConsistency: document.getElementById('finalConsistency'),
            finalCorrections: document.getElementById('finalCorrections'),
            progressBar: document.getElementById('progressBar'),
            loading: document.getElementById('loading')
        };
    }

    setupEventListeners() {
        // 开始按钮
        this.elements.startBtn?.addEventListener('click', () => this.start());

        // 重置按钮
        this.elements.resetBtn?.addEventListener('click', () => this.reset());

        // 重新开始按钮
        this.elements.restartBtn?.addEventListener('click', () => {
            UIRenderer.hideCompleteModal();
            this.reset();
        });

        // 输入框事件
        this.elements.input?.addEventListener('input', (e) => this.handleInput(e));
        this.elements.input?.addEventListener('paste', (e) => e.preventDefault());
        this.elements.input?.addEventListener('keydown', (e) => this.handleKeydown(e));

        // 模式选择按钮
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setMode(e.target.dataset.mode);
            });
        });

        // 难度选择
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setDifficulty(e.target.dataset.difficulty);
            });
        });

        // 主题选择由 modal.js 处理，这里不重复绑定

        // 音效开关
        const soundToggle = document.getElementById('soundToggle');
        soundToggle?.addEventListener('change', (e) => {
            SoundManager.setEnabled(e.target.checked);
            StorageManager.set('sound_enabled', e.target.checked);
        });

        // 模态框点击外部关闭
        this.elements.modal?.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) {
                UIRenderer.hideCompleteModal();
            }
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            // ESC 暂停
            if (e.key === 'Escape') {
                if (this.isPlaying) {
                    this.pause();
                }
            }

            // Ctrl/Cmd + Enter 开始
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                if (!this.isPlaying) {
                    e.preventDefault();
                    this.start();
                }
            }

            // Enter 开始/继续
            if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                const modalVisible = this.elements.modal?.classList.contains('show');
                const inputFocused = document.activeElement === this.elements.input;

                console.log(`[Game] Enter键被按下 - modal可见:${modalVisible}, input聚焦:${inputFocused}, 游戏中:${this.isPlaying}`);

                if (modalVisible) {
                    // 完成模态框显示时，Enter继续
                    e.preventDefault();
                    console.log('[Game] 关闭完成模态框并重置');
                    UIRenderer.hideCompleteModal();
                    this.reset();
                } else if (!inputFocused && !this.isPlaying) {
                    // 没有在输入且游戏未开始，Enter开始游戏（模拟点击开始按钮）
                    e.preventDefault();
                    const startBtn = document.getElementById('startBtn');
                    console.log(`[Game] 尝试启动游戏 - 按钮存在:${!!startBtn}, 禁用:${startBtn?.disabled}`);
                    if (startBtn && !startBtn.disabled) {
                        console.log('[Game] 点击开始按钮');
                        startBtn.click();
                    }
                }
            }

            // Alt + C 重置（模拟点击重置按钮）
            if (e.altKey && e.key === 'c') {
                e.preventDefault();
                console.log('[Game] Alt+C被按下，触发重置');
                this.elements.resetBtn?.click();
            }
        });
    }

    loadSettings() {
        // 加载主题
        const savedTheme = StorageManager.get('theme', 'purple');
        UIRenderer.setTheme(savedTheme);

        // 加载音效设置
        const soundEnabled = StorageManager.get('sound_enabled', true);
        SoundManager.setEnabled(soundEnabled);
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.checked = soundEnabled;
        }

        // 加载难度
        const savedDifficulty = StorageManager.get('difficulty', 'medium');
        this.setDifficulty(savedDifficulty);
    }

    newGame() {
        if (this.customText) {
            this.targetText = this.customText;
        } else {
            this.targetText = getRandomText(this.mode, this.difficulty);
        }

        this.currentInput = '';
        UIRenderer.renderText(this.targetText, this.currentInput);
        UIRenderer.updateProgress(0, this.targetText.length);
    }

    start() {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.isPaused = false;

        // 启用输入框
        if (this.elements.input) {
            this.elements.input.disabled = false;
            this.elements.input.value = '';
            this.elements.input.focus();
        }

        // 更新按钮状态
        if (this.elements.startBtn) {
            this.elements.startBtn.textContent = '进行中...';
            this.elements.startBtn.disabled = true;
        }

        // 初始化音效
        SoundManager.init();
        SoundManager.playStart();

        // 开始统计
        this.liveStats.start();
    }

    pause() {
        if (!this.isPlaying || this.isPaused) return;

        this.isPaused = true;
        this.liveStats.stop();

        if (this.elements.input) {
            this.elements.input.disabled = true;
        }

        UIRenderer.showToast('游戏已暂停 (按ESC继续)', 'info');
    }

    resume() {
        if (!this.isPlaying || !this.isPaused) return;

        this.isPaused = false;
        this.liveStats.start();

        if (this.elements.input) {
            this.elements.input.disabled = false;
            this.elements.input.focus();
        }

        UIRenderer.showToast('继续游戏', 'info');
    }

    handleInput(event) {
        if (!this.isPlaying || this.isPaused) return;

        this.currentInput = event.target.value;

        // 记录统计数据
        this.liveStats.recordInput(this.currentInput, this.targetText);

        // 渲染文本
        UIRenderer.renderText(this.targetText, this.currentInput);

        // 更新进度条
        UIRenderer.updateProgress(this.currentInput.length, this.targetText.length);

        // 检查完成
        if (this.currentInput === this.targetText) {
            this.complete();
        } else {
            // 音效反馈
            const lastIndex = this.currentInput.length - 1;
            if (lastIndex >= 0) {
                const isCorrect = this.currentInput[lastIndex] === this.targetText[lastIndex];
                if (isCorrect && this.lastChar !== this.currentInput[lastIndex]) {
                    SoundManager.playCorrect();
                } else if (!isCorrect) {
                    SoundManager.playIncorrect();
                }
            }
        }

        this.lastChar = this.currentInput[this.currentInput.length - 1];
    }

    handleKeydown(event) {
        if (!this.isPlaying || this.isPaused) return;

        // 处理Tab键 - 插入制表符而不是失去焦点
        if (event.key === 'Tab') {
            event.preventDefault();
            const input = this.elements.input;
            const start = input.selectionStart;
            const end = input.selectionEnd;

            // 插入Tab字符
            const value = input.value;
            input.value = value.substring(0, start) + '\t' + value.substring(end);

            // 设置光标位置
            input.selectionStart = input.selectionEnd = start + 1;

            // 触发input事件
            const inputEvent = new Event('input', { bubbles: true });
            input.dispatchEvent(inputEvent);
            return;
        }

        // 禁止 Ctrl/Cmd + A/C/V/X 等组合键
        if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
            if (event.key.toLowerCase() !== 'a') {
                event.preventDefault();
            }
        }
    }

    complete() {
        this.isPlaying = false;
        this.liveStats.stop();

        // 播放完成音效
        SoundManager.playComplete();

        // 获取最终统计
        const finalStats = this.liveStats.getFinalStats(this.targetText);

        // 保存成绩
        StorageManager.saveScore({
            mode: this.mode,
            difficulty: this.difficulty,
            ...finalStats
        });

        // 更新统计
        const stats = StorageManager.updateStats(finalStats);

        // 检查成就
        const newAchievements = StorageManager.checkAchievements(finalStats, stats);
        newAchievements.forEach(achievementId => {
            const unlocked = StorageManager.unlockAchievement(achievementId);
            if (unlocked) {
                const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
                if (achievement) {
                    setTimeout(() => {
                        UIRenderer.showAchievement(achievement);
                        SoundManager.playAchievement();
                    }, 1000);
                }
            }
        });

        // 显示完成模态框
        setTimeout(() => {
            UIRenderer.showCompleteModal(finalStats);
        }, 500);

        // 禁用输入框
        if (this.elements.input) {
            this.elements.input.disabled = true;
        }
    }

    reset() {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentInput = '';
        this.lastChar = null;

        // 重置统计
        this.liveStats.reset();

        // 重置UI
        if (this.elements.input) {
            this.elements.input.value = '';
            this.elements.input.disabled = true;
        }

        if (this.elements.startBtn) {
            this.elements.startBtn.textContent = '开始练习';
            this.elements.startBtn.disabled = false;
        }

        UIRenderer.updateStats({ time: 0, wpm: 0, accuracy: 100 });
        UIRenderer.hideCompleteModal();

        // 加载新文本
        this.newGame();
    }

    setMode(mode) {
        if (this.isPlaying) {
            UIRenderer.showToast('请先结束当前练习', 'warning');
            return;
        }

        this.mode = mode;
        UIRenderer.highlightModeButton(mode);
        this.reset();
    }

    setDifficulty(difficulty) {
        if (this.isPlaying) {
            UIRenderer.showToast('请先结束当前练习', 'warning');
            return;
        }

        this.difficulty = difficulty;
        StorageManager.set('difficulty', difficulty);

        // 更新难度按钮状态
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            if (btn.dataset.difficulty === difficulty) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        this.reset();
    }

    setCustomText(text) {
        if (!text || text.trim().length === 0) {
            UIRenderer.showError('自定义文本不能为空');
            return false;
        }

        this.customText = text;
        this.mode = 'custom';
        this.reset();
        return true;
    }

    clearCustomText() {
        this.customText = null;
        this.mode = 'code';
        this.reset();
    }
}
