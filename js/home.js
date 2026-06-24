import { audioSystem } from './audio.js';
import { loadStore, saveStore, getStorageKey } from './storage.js?v=20260624-11';

let store = loadStore();
let activeStorageKey = getStorageKey();

// 初始化页面
function init() {
    renderStats();

    // 音效按钮
    const soundBtn = document.getElementById('soundToggle');
    soundBtn.textContent = store.sound ? '🔊' : '🔇';
    soundBtn.addEventListener('click', toggleSound);

    // 主题按钮
    const themeBtn = document.getElementById('themeToggle');
    themeBtn.addEventListener('click', toggleTheme);
    applyTheme();

    window.addEventListener('auth:changed', handleAuthChanged);
    window.setInterval(reloadStoreIfAccountChanged, 500);
}

function renderStats() {
    document.getElementById('totalSessions').textContent = store.totalRuns || 0;
    document.getElementById('bestWpm').textContent = store.bestWpm || 0;
    document.getElementById('dayStreak').textContent = store.dayStreak || 0;
}

function toggleSound() {
    const soundBtn = document.getElementById('soundToggle');
    store.sound = !store.sound;
    audioSystem.setEnabled(store.sound);
    soundBtn.textContent = store.sound ? '🔊' : '🔇';

    saveStore(store);

    if (store.sound) {
        audioSystem.playTone(500, 0.1);
    }
}

function toggleTheme() {
    const themeBtn = document.getElementById('themeToggle');
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    themeBtn.textContent = newTheme === 'light' ? '☀️' : '🌙';

    store.theme = newTheme;
    saveStore(store);
}

function applyTheme() {
    const theme = store.theme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeToggle').textContent = theme === 'light' ? '☀️' : '🌙';
}

function handleAuthChanged(event) {
    if (!['login', 'logout', 'guest'].includes(event.detail?.reason)) return;
    reloadStoreForActiveAccount();
}

function reloadStoreIfAccountChanged() {
    const nextStorageKey = getStorageKey();
    if (nextStorageKey === activeStorageKey) return;
    reloadStoreForActiveAccount(nextStorageKey);
}

function reloadStoreForActiveAccount(nextStorageKey = getStorageKey()) {
    activeStorageKey = nextStorageKey;
    store = loadStore();
    audioSystem.setEnabled(store.sound);
    document.getElementById('soundToggle').textContent = store.sound ? '🔊' : '🔇';
    applyTheme();
    renderStats();
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
