/**
 * 本地存储模块
 * @version 1.0.0
 */

import { STORAGE_KEYS } from './config.js';

class StorageManager {
    constructor() {
        this.prefix = 'typing_game_';
    }

    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    }

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    }

    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    }

    // 高分记录
    saveScore(score) {
        const scores = this.getHighScores();
        scores.push({
            ...score,
            timestamp: Date.now()
        });

        // 保留前20个高分
        scores.sort((a, b) => b.wpm - a.wpm);
        const topScores = scores.slice(0, 20);

        this.set('high_scores', topScores);
        return topScores;
    }

    getHighScores() {
        return this.get('high_scores', []);
    }

    // 统计数据
    updateStats(gameResult) {
        const stats = this.getStats();

        stats.totalGames++;
        stats.totalTime += gameResult.time;
        stats.totalCharacters += gameResult.characters;
        stats.averageWpm = Math.round(
            (stats.averageWpm * (stats.totalGames - 1) + gameResult.wpm) / stats.totalGames
        );
        stats.averageAccuracy = Math.round(
            (stats.averageAccuracy * (stats.totalGames - 1) + gameResult.accuracy) / stats.totalGames
        );

        if (gameResult.wpm > stats.bestWpm) {
            stats.bestWpm = gameResult.wpm;
        }

        if (gameResult.accuracy === 100) {
            stats.perfectGames++;
        }

        stats.lastPlayed = Date.now();

        this.set('stats', stats);
        return stats;
    }

    getStats() {
        return this.get('stats', {
            totalGames: 0,
            totalTime: 0,
            totalCharacters: 0,
            averageWpm: 0,
            averageAccuracy: 0,
            bestWpm: 0,
            perfectGames: 0,
            lastPlayed: null
        });
    }

    resetStats() {
        this.remove('stats');
        this.remove('high_scores');
    }

    // 自定义文本
    saveCustomText(text) {
        const texts = this.getCustomTexts();
        texts.push({
            id: Date.now(),
            text: text,
            createdAt: Date.now()
        });
        this.set('custom_texts', texts);
        return texts;
    }

    getCustomTexts() {
        return this.get('custom_texts', []);
    }

    deleteCustomText(id) {
        const texts = this.getCustomTexts();
        const filtered = texts.filter(t => t.id !== id);
        this.set('custom_texts', filtered);
        return filtered;
    }

    // 成就系统
    unlockAchievement(achievementId) {
        const achievements = this.getAchievements();
        if (!achievements.includes(achievementId)) {
            achievements.push(achievementId);
            this.set('achievements', achievements);
        }
        return achievements;
    }

    getAchievements() {
        return this.get('achievements', []);
    }

    checkAchievements(gameResult, stats) {
        const unlocked = [];

        // 速度恶魔 - WPM >= 100
        if (gameResult.wpm >= 100) {
            unlocked.push('speed_demon');
        }

        // 完美主义者 - 100% 准确率
        if (gameResult.accuracy === 100) {
            unlocked.push('perfectionist');
        }

        // 马拉松选手 - 文本长度 >= 200
        if (gameResult.characters >= 200) {
            unlocked.push('marathon');
        }

        // 稳定发挥 - 10场以上且平均WPM >= 60
        if (stats.totalGames >= 10 && stats.averageWpm >= 60) {
            unlocked.push('consistent');
        }

        // 夜猫子 - 凌晨0-6点游玩
        const hour = new Date().getHours();
        if (hour >= 0 && hour < 6) {
            unlocked.push('night_owl');
        }

        return unlocked;
    }
}

export default new StorageManager();
