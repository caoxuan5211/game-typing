import { audioSystem } from './audio.js';
import { loadStore, saveStore, getDefaultStore } from './storage.js';
import { getAuthState, initNavAuth, syncLocalStore } from './shell.js';

let store = loadStore();

const dom = {
    accountPill: document.getElementById('accountPill'),
    avatar: document.getElementById('avatar'),
    accountName: document.getElementById('accountName'),
    accountEmail: document.getElementById('accountEmail'),
    loginBtn: document.getElementById('loginBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    dailyGoal: document.getElementById('dailyGoal'),
    codeFontSize: document.getElementById('codeFontSize'),
    tabSize: document.getElementById('tabSize'),
    soundEnabled: document.getElementById('soundEnabled'),
    autoSync: document.getElementById('autoSync'),
    soundToggle: document.getElementById('soundToggle'),
    themeToggle: document.getElementById('themeToggle'),
    totalRuns: document.getElementById('totalRuns'),
    bestWpm: document.getElementById('bestWpm'),
    totalXP: document.getElementById('totalXP'),
    syncBtn: document.getElementById('syncBtn'),
    exportBtn: document.getElementById('exportBtn'),
    importInput: document.getElementById('importInput'),
    clearBtn: document.getElementById('clearBtn'),
    toast: document.getElementById('toast')
};

function init() {
    bindEvents();
    render();
}

function bindEvents() {
    dom.dailyGoal.addEventListener('change', () => updateNumber('dailyGoal', 100, 20000));
    dom.codeFontSize.addEventListener('change', () => updateNumber('codeFontSize', 14, 36));
    dom.tabSize.addEventListener('change', () => updateNumber('tabSize', 2, 8));
    dom.soundEnabled.addEventListener('change', () => {
        store.sound = dom.soundEnabled.checked;
        audioSystem.setEnabled(store.sound);
        saveAndRender('音效设置已保存');
    });
    dom.autoSync.addEventListener('change', () => {
        store.autoSync = dom.autoSync.checked;
        saveAndRender('同步设置已保存');
    });

    document.querySelectorAll('[data-theme-choice]').forEach(button => {
        button.addEventListener('click', () => {
            store.theme = button.dataset.themeChoice;
            saveAndRender('主题已保存');
        });
    });

    dom.soundToggle.addEventListener('click', () => {
        store.sound = !store.sound;
        if (store.sound) audioSystem.playTone(500, 0.1);
        saveAndRender('音效设置已保存');
    });
    dom.themeToggle.addEventListener('click', () => {
        store.theme = (store.theme || 'light') === 'light' ? 'dark' : 'light';
        saveAndRender('主题已保存');
    });
    dom.logoutBtn.addEventListener('click', logout);
    dom.syncBtn.addEventListener('click', syncNow);
    dom.exportBtn.addEventListener('click', exportData);
    dom.importInput.addEventListener('change', importData);
    dom.clearBtn.addEventListener('click', clearLocalData);
}

function updateNumber(key, min, max) {
    const value = Math.min(max, Math.max(min, Number(dom[key].value)));
    store[key] = value;
    saveAndRender('设置已保存');
}

function saveAndRender(message) {
    saveStore(store);
    render();
    showToast(message);
}

function render() {
    const { token, email } = getAuthState();
    const theme = store.theme || 'light';

    document.documentElement.setAttribute('data-theme', theme);
    dom.themeToggle.textContent = theme === 'light' ? '☀️' : '🌙';
    dom.soundToggle.textContent = store.sound ? '🔊' : '🔇';
    audioSystem.setEnabled(store.sound);

    dom.accountPill.textContent = token ? '已登录' : '本地模式';
    dom.accountName.textContent = token ? (email.split('@')[0] || '已登录用户') : '本地用户';
    dom.accountEmail.textContent = token ? email : '未登录，数据仅保存在当前浏览器';
    dom.avatar.textContent = (email || 'U').slice(0, 1).toUpperCase();
    dom.loginBtn.hidden = Boolean(token);
    dom.logoutBtn.hidden = !token;

    dom.dailyGoal.value = store.dailyGoal || 1200;
    dom.codeFontSize.value = store.codeFontSize || 24;
    dom.tabSize.value = store.tabSize || 4;
    dom.soundEnabled.checked = Boolean(store.sound);
    dom.autoSync.checked = store.autoSync !== false;

    document.querySelectorAll('[data-theme-choice]').forEach(button => {
        button.classList.toggle('active', button.dataset.themeChoice === theme);
    });

    dom.totalRuns.textContent = store.totalRuns || 0;
    dom.bestWpm.textContent = store.bestWpm || 0;
    dom.totalXP.textContent = store.totalXP || 0;

    initNavAuth();
}

function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    render();
    showToast('已退出登录，本地数据仍保留');
}

async function syncNow() {
    const { token } = getAuthState();
    if (!token) {
        showToast('请先登录再同步');
        return;
    }

    dom.syncBtn.disabled = true;
    dom.syncBtn.textContent = '同步中...';
    try {
        await syncLocalStore(store);
        showToast('同步完成');
    } catch (error) {
        showToast(error.message || '同步失败');
    } finally {
        dom.syncBtn.disabled = false;
        dom.syncBtn.textContent = '立即同步';
    }
}

function exportData() {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `code-typing-lab-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        try {
            const incoming = JSON.parse(String(reader.result));
            store = { ...getDefaultStore(), ...incoming };
            saveStore(store);
            render();
            showToast('数据已导入');
        } catch (error) {
            showToast('导入失败，文件格式不正确');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function clearLocalData() {
    if (!confirm('确定清空本地训练数据吗？登录状态不会被删除。')) return;
    store = getDefaultStore();
    saveStore(store);
    render();
    showToast('本地数据已清空');
}

function showToast(message) {
    dom.toast.textContent = message;
    dom.toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => dom.toast.classList.remove('show'), 2500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
