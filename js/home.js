import { audioSystem } from './audio.js';
import { loadStore } from './storage.js';

const store = loadStore();

// 初始化页面
function init() {
    // 加载统计数据
    document.getElementById('totalSessions').textContent = store.totalRuns || 0;
    document.getElementById('bestWpm').textContent = store.bestWpm || 0;
    document.getElementById('dayStreak').textContent = store.dayStreak || 0;

    // 音效按钮
    const soundBtn = document.getElementById('soundToggle');
    soundBtn.textContent = store.sound ? '🔊' : '🔇';
    soundBtn.addEventListener('click', toggleSound);

    // 主题按钮
    const themeBtn = document.getElementById('themeToggle');
    themeBtn.addEventListener('click', toggleTheme);
    applyTheme();
}

function toggleSound() {
    const soundBtn = document.getElementById('soundToggle');
    store.sound = !store.sound;
    audioSystem.setEnabled(store.sound);
    soundBtn.textContent = store.sound ? '🔊' : '🔇';

    // 保存到 localStorage
    localStorage.setItem('code_typing_lab_v3', JSON.stringify(store));

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
    localStorage.setItem('code_typing_lab_v3', JSON.stringify(store));
}

function applyTheme() {
    const theme = store.theme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeToggle').textContent = theme === 'light' ? '☀️' : '🌙';
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
