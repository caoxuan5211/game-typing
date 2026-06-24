/**
 * 本地存储管理
 */

const STORAGE_KEY = 'code_typing_lab_v3';
const USER_STORAGE_PREFIX = 'code_typing_lab_v3_user:';
const GUEST_STORAGE_KEY = 'code_typing_lab_guest_session';
const AUTH_MODE_KEY = 'code_typing_auth_mode';
const AUTH_USER_KEY = 'user_profile';
const AUTH_EMAIL_KEY = 'user_email';

export function isGuestMode() {
    return localStorage.getItem(AUTH_MODE_KEY) === 'guest';
}

export function setGuestMode(enabled) {
    if (enabled) {
        localStorage.setItem(AUTH_MODE_KEY, 'guest');
        sessionStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(getDefaultStore()));
    } else {
        localStorage.removeItem(AUTH_MODE_KEY);
        sessionStorage.removeItem(GUEST_STORAGE_KEY);
    }
}

export function loadStore() {
    try {
        const data = isGuestMode()
            ? sessionStorage.getItem(GUEST_STORAGE_KEY)
            : localStorage.getItem(getStorageKey());
        if (data) {
            return { ...getDefaultStore(), ...JSON.parse(data) };
        }
    } catch (error) {
        console.warn('Failed to load store:', error);
    }
    return getDefaultStore();
}

export function saveStore(store) {
    try {
        const target = isGuestMode() ? sessionStorage : localStorage;
        const key = isGuestMode() ? GUEST_STORAGE_KEY : getStorageKey();
        target.setItem(key, JSON.stringify(store));
    } catch (error) {
        console.warn('Failed to save store:', error);
    }
}

export function getStorageKey() {
    const userKey = getAuthenticatedUserKey();
    if (!userKey) return STORAGE_KEY;
    return `${USER_STORAGE_PREFIX}${encodeURIComponent(userKey)}`;
}

function getAuthenticatedUserKey() {
    if (isGuestMode()) return '';

    const user = safeJson(localStorage.getItem(AUTH_USER_KEY), null);
    const rawKey = user?.id || user?.email || localStorage.getItem(AUTH_EMAIL_KEY) || '';
    return String(rawKey).trim().toLowerCase();
}

function safeJson(value, fallback) {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

export function getDefaultStore() {
    return {
        totalRuns: 0,
        bestWpm: 0,
        bestAccuracy: 0,
        todayChars: 0,
        lastPlayedDay: '',
        dayStreak: 0,
        history: [],
        customText: '',
        theme: 'light',
        sound: true,
        dailyGoal: 1200,
        codeFontSize: 24,
        tabSize: 4,
        autoSync: true,

        // 成就系统
        totalXP: 0,
        level: 1,
        earnedBadges: [],
        maxCharsInSession: 0,
        bestCombo: 0,
        hasGradeS: false,
        modesCompleted: 0,
        modesPlayed: []
    };
}

export function getTodayKey(timestamp = Date.now()) {
    return new Date(timestamp).toISOString().slice(0, 10);
}

export function updateDayStreak(store, timestamp = Date.now()) {
    const today = getTodayKey(timestamp);
    const yesterday = getTodayKey(timestamp - 86400000);
    const lastPlayed = store.lastPlayedDay;

    if (lastPlayed === today) {
        // 今天已经玩过，保持连击
        store.dayStreak = Math.max(1, store.dayStreak);
    } else if (lastPlayed === yesterday) {
        // 昨天玩过，连击+1
        store.dayStreak += 1;
    } else {
        // 断了，重置为1
        store.dayStreak = 1;
    }

    store.lastPlayedDay = today;
}

export function normalizeDailyStats(store) {
    const today = getTodayKey();
    if (store.lastPlayedDay && store.lastPlayedDay !== today) {
        store.todayChars = 0;
    }
}
