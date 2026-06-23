/**
 * 徽章和成就系统
 */

export const BADGES = [
    {
        id: 'first_session',
        name: '初次尝试',
        desc: '完成第一次训练',
        icon: '🎯',
        rarity: 'common',
        condition: (stats) => stats.totalRuns >= 1
    },
    {
        id: 'fast_learner',
        name: '快速学习者',
        desc: '达到 50 WPM',
        icon: '⚡',
        rarity: 'common',
        condition: (stats) => stats.bestWpm >= 50
    },
    {
        id: 'speed_demon',
        name: '速度恶魔',
        desc: '达到 80 WPM',
        icon: '🔥',
        rarity: 'rare',
        condition: (stats) => stats.bestWpm >= 80
    },
    {
        id: 'typing_master',
        name: '打字大师',
        desc: '达到 100 WPM',
        icon: '👑',
        rarity: 'epic',
        condition: (stats) => stats.bestWpm >= 100
    },
    {
        id: 'god_of_typing',
        name: '打字之神',
        desc: '达到 120 WPM',
        icon: '🏆',
        rarity: 'legendary',
        condition: (stats) => stats.bestWpm >= 120
    },
    {
        id: 'accurate',
        name: '精准射手',
        desc: '准确率达到 98%',
        icon: '🎪',
        rarity: 'rare',
        condition: (stats) => stats.bestAccuracy >= 98
    },
    {
        id: 'perfect',
        name: '完美主义',
        desc: '准确率 100%',
        icon: '💎',
        rarity: 'epic',
        condition: (stats) => stats.bestAccuracy >= 100
    },
    {
        id: 'dedicated',
        name: '坚持不懈',
        desc: '完成 10 次训练',
        icon: '📚',
        rarity: 'common',
        condition: (stats) => stats.totalRuns >= 10
    },
    {
        id: 'veteran',
        name: '训练老兵',
        desc: '完成 50 次训练',
        icon: '🎖️',
        rarity: 'rare',
        condition: (stats) => stats.totalRuns >= 50
    },
    {
        id: 'legend',
        name: '传奇',
        desc: '完成 100 次训练',
        icon: '⭐',
        rarity: 'epic',
        condition: (stats) => stats.totalRuns >= 100
    },
    {
        id: 'marathon',
        name: '马拉松选手',
        desc: '单次训练 200+ 字符',
        icon: '🏃',
        rarity: 'rare',
        condition: (stats) => stats.maxCharsInSession >= 200
    },
    {
        id: 'combo_starter',
        name: '连击新手',
        desc: '达到 20 连击',
        icon: '🎮',
        rarity: 'common',
        condition: (stats) => stats.bestCombo >= 20
    },
    {
        id: 'combo_master',
        name: '连击大师',
        desc: '达到 50 连击',
        icon: '🌟',
        rarity: 'rare',
        condition: (stats) => stats.bestCombo >= 50
    },
    {
        id: 'combo_god',
        name: '连击之神',
        desc: '达到 100 连击',
        icon: '✨',
        rarity: 'epic',
        condition: (stats) => stats.bestCombo >= 100
    },
    {
        id: 'daily_warrior',
        name: '每日战士',
        desc: '连续训练 3 天',
        icon: '🔥',
        rarity: 'common',
        condition: (stats) => stats.dayStreak >= 3
    },
    {
        id: 'weekly_champion',
        name: '周冠军',
        desc: '连续训练 7 天',
        icon: '🏅',
        rarity: 'rare',
        condition: (stats) => stats.dayStreak >= 7
    },
    {
        id: 'monthly_legend',
        name: '月度传奇',
        desc: '连续训练 30 天',
        icon: '👑',
        rarity: 'legendary',
        condition: (stats) => stats.dayStreak >= 30
    },
    {
        id: 'grade_s',
        name: 'S级评分',
        desc: '获得 S 级评分',
        icon: '🌈',
        rarity: 'epic',
        condition: (stats) => stats.hasGradeS
    },
    {
        id: 'all_modes',
        name: '全能选手',
        desc: '尝试所有训练模式',
        icon: '🎯',
        rarity: 'rare',
        condition: (stats) => stats.modesCompleted >= 4
    }
];

export const LEVELS = [
    { level: 1, xp: 0, title: '新手' },
    { level: 2, xp: 100, title: '学徒' },
    { level: 3, xp: 250, title: '熟练' },
    { level: 4, xp: 500, title: '精通' },
    { level: 5, xp: 1000, title: '专家' },
    { level: 6, xp: 1800, title: '大师' },
    { level: 7, xp: 3000, title: '宗师' },
    { level: 8, xp: 5000, title: '传奇' },
    { level: 9, xp: 8000, title: '神话' },
    { level: 10, xp: 12000, title: '至尊' }
];

// 计算经验值
export function calculateXP(wpm, accuracy, charsTyped) {
    const baseXP = Math.floor(charsTyped / 5); // 每5个字符1点经验
    const wpmBonus = Math.floor(wpm / 10) * 5; // WPM每10点额外5经验
    const accuracyBonus = accuracy >= 95 ? 20 : accuracy >= 90 ? 10 : 0; // 高准确率奖励
    return baseXP + wpmBonus + accuracyBonus;
}

// 获取当前等级
export function getCurrentLevel(totalXP) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (totalXP >= LEVELS[i].xp) {
            return LEVELS[i];
        }
    }
    return LEVELS[0];
}

// 获取下一级所需经验
export function getNextLevelXP(currentLevel) {
    const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1);
    return nextLevel ? nextLevel.xp : null;
}

// 检查新获得的徽章
export function checkNewBadges(stats, earnedBadges = []) {
    const newBadges = [];

    for (const badge of BADGES) {
        if (!earnedBadges.includes(badge.id) && badge.condition(stats)) {
            newBadges.push(badge);
        }
    }

    return newBadges;
}

// 获取稀有度颜色
export function getRarityColor(rarity) {
    const colors = {
        common: '#9CA3AF',
        rare: '#3B82F6',
        epic: '#8B5CF6',
        legendary: '#F59E0B'
    };
    return colors[rarity] || colors.common;
}

// 获取稀有度名称
export function getRarityName(rarity) {
    const names = {
        common: '普通',
        rare: '稀有',
        epic: '史诗',
        legendary: '传说'
    };
    return names[rarity] || names.common;
}
