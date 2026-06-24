import { audioSystem } from './audio.js';
import { loadStore, saveStore } from './storage.js';
import { getAuthState, openAuthModal, route } from './shell.js?v=20260624-7';

let store = loadStore();

// 初始化
function init() {
    applySettings();
    bindEvents();
    renderStats();
    renderAuthGate();
    console.info('Code Typing Lab v3.0.0 - Stats Mode');
}

function applySettings() {
    audioSystem.setEnabled(store.sound);
    document.getElementById('soundToggle').textContent = store.sound ? '🔊' : '🔇';

    const theme = store.theme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeToggle').textContent = theme === 'light' ? '☀️' : '🌙';
}

function bindEvents() {
    document.getElementById('soundToggle').addEventListener('click', toggleSound);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('clearHistory').addEventListener('click', clearHistory);
}

function toggleSound() {
    const btn = document.getElementById('soundToggle');
    store.sound = !store.sound;
    audioSystem.setEnabled(store.sound);
    btn.textContent = store.sound ? '🔊' : '🔇';
    saveStore(store);

    if (store.sound) {
        audioSystem.playTone(500, 0.1);
    }
}

function toggleTheme() {
    const btn = document.getElementById('themeToggle');
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    btn.textContent = newTheme === 'light' ? '☀️' : '🌙';

    store.theme = newTheme;
    saveStore(store);
}

function clearHistory() {
    if (!confirm('确定要清空所有训练记录吗？此操作不可恢复。')) {
        return;
    }

    store.history = [];
    store.totalRuns = 0;
    store.bestWpm = 0;
    store.bestAccuracy = 0;
    store.todayChars = 0;
    store.dayStreak = 0;
    saveStore(store);

    renderStats();
    showToast('已清空所有记录');
}

function renderStats() {
    // 概览数据
    document.getElementById('bestWpm').textContent = store.bestWpm || 0;
    document.getElementById('bestAccuracy').innerHTML = `${store.bestAccuracy || 0}<span class="overview-unit">%</span>`;
    document.getElementById('totalRuns').textContent = store.totalRuns || 0;
    document.getElementById('dayStreak').textContent = store.dayStreak || 0;

    // 今日进度
    const dailyGoal = store.dailyGoal || 1200;
    const todayProgress = Math.min(100, Math.round((store.todayChars / dailyGoal) * 100));
    document.getElementById('dailyGoalText').textContent = `${store.todayChars} / ${dailyGoal} 字符`;
    document.getElementById('dailyProgressBar').style.width = `${todayProgress}%`;

    // 历史记录
    renderHistory();
}

function renderAuthGate() {
    const { token } = getAuthState();
    let gate = document.getElementById('statsAuthGate');

    if (token) {
        gate?.remove();
        document.querySelector('.stats-container')?.classList.remove('gated');
        return;
    }

    document.querySelector('.stats-container')?.classList.add('gated');
    if (!gate) {
        gate = document.createElement('div');
        gate.id = 'statsAuthGate';
        gate.className = 'stats-auth-gate';
        gate.innerHTML = `
            <div>
                <strong>登录后查看完整统计</strong>
                <span>云端同步训练记录、等级、历史成绩和跨设备进度。</span>
            </div>
            <button class="btn btn-primary" type="button">登录 / 注册</button>
        `;
        document.body.appendChild(gate);
        gate.querySelector('button').addEventListener('click', () => openAuthModal('login'));
    }
}

function renderHistory() {
    const historyList = document.getElementById('historyList');

    if (!store.history || store.history.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <p>暂无训练记录</p>
                <a href="${route('/train')}" class="btn btn-primary">开始训练</a>
            </div>
        `;
        return;
    }

    historyList.innerHTML = store.history.map(item => {
        const date = new Date(item.createdAt);
        const dateStr = date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        const modeMap = {
            javascript: 'JavaScript',
            cpp: 'CPP',
            html: 'HTML',
            sql: 'SQL',
            code: '代码',
            symbols: '符号',
            flow: '长段',
            custom: '自定义'
        };

        return `
            <div class="history-item">
                <div class="history-grade">${item.grade}</div>
                <div class="history-info">
                    <div class="history-mode">${modeMap[item.mode] || item.mode}</div>
                    <div class="history-chars">${item.chars} 字符 · ${item.time}s</div>
                </div>
                <div class="history-wpm">${item.wpm} <span style="font-size:0.875rem;color:var(--color-text-tertiary)">WPM</span></div>
                <div class="history-accuracy">${item.accuracy}%</div>
            </div>
        `;
    }).join('');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
