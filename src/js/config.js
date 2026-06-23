/**
 * 游戏配置模块
 * @version 1.0.0
 */

export const VERSION = '1.0.0';

export const THEMES = {
    purple: {
        name: '紫罗兰',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        primary: '#667eea',
        secondary: '#764ba2',
        accent: '#f093fb'
    },
    ocean: {
        name: '海洋蓝',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        primary: '#4facfe',
        secondary: '#00f2fe',
        accent: '#43e97b'
    },
    sunset: {
        name: '日落橙',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        primary: '#fa709a',
        secondary: '#fee140',
        accent: '#ff6b6b'
    },
    forest: {
        name: '森林绿',
        gradient: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
        primary: '#0ba360',
        secondary: '#3cba92',
        accent: '#4ade80'
    },
    midnight: {
        name: '午夜黑',
        gradient: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        primary: '#2c3e50',
        secondary: '#34495e',
        accent: '#3498db'
    }
};

export const DIFFICULTY_LEVELS = {
    easy: {
        name: '简单',
        minLength: 30,
        maxLength: 60,
        timeBonus: 1.2
    },
    medium: {
        name: '中等',
        minLength: 60,
        maxLength: 120,
        timeBonus: 1.0
    },
    hard: {
        name: '困难',
        minLength: 120,
        maxLength: 200,
        timeBonus: 0.8
    }
};

export const SOUND_EFFECTS = {
    enabled: true,
    volume: 0.3,
    effects: {
        correct: true,
        incorrect: true,
        complete: true,
        start: true
    }
};

export const GAME_MODES = {
    code: {
        name: '代码片段',
        icon: '💻',
        description: '练习常见代码模式'
    },
    symbols: {
        name: '符号练习',
        icon: '⚡',
        description: '强化特殊字符输入'
    },
    mixed: {
        name: '混合模式',
        icon: '🎯',
        description: '综合练习代码与符号'
    },
    custom: {
        name: '自定义',
        icon: '✏️',
        description: '输入你自己的文本'
    }
};

export const STORAGE_KEYS = {
    theme: 'typing_game_theme',
    difficulty: 'typing_game_difficulty',
    soundEnabled: 'typing_game_sound',
    highScores: 'typing_game_scores',
    stats: 'typing_game_stats',
    customTexts: 'typing_game_custom_texts'
};

export const ACHIEVEMENTS = [
    { id: 'speed_demon', name: '速度恶魔', requirement: 'wpm >= 100', icon: '🚀' },
    { id: 'perfectionist', name: '完美主义者', requirement: 'accuracy === 100', icon: '✨' },
    { id: 'marathon', name: '马拉松选手', requirement: 'textLength >= 200', icon: '🏃' },
    { id: 'consistent', name: '稳定发挥', requirement: 'games >= 10 && avgWpm >= 60', icon: '🎖️' },
    { id: 'night_owl', name: '夜猫子', requirement: 'playTime between 0-6', icon: '🦉' }
];
