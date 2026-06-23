import { audioSystem } from './audio.js';
import { loadStore, saveStore, updateDayStreak, normalizeDailyStats, getTodayKey } from './storage.js';
import { calculateXP, getCurrentLevel, getNextLevelXP, checkNewBadges, BADGES } from './achievements.js';

// 代码片段数据
const snippets = {
    code: [
        {
            title: "JavaScript 函数",
            text: `function formatUser(user) {
\tconst name = user.name.trim();
\treturn \`\${name} <\${user.email}>\`;
}`
        },
        {
            title: "React Hook",
            text: `function useLatest(value) {
\tconst ref = useRef(value);
\tuseEffect(() => {
\t\tref.current = value;
\t}, [value]);
\treturn ref;
}`
        },
        {
            title: "数组处理",
            text: `const activeUsers = users
\t.filter(user => user.enabled)
\t.map(user => ({
\t\tid: user.id,
\t\tlabel: user.name
\t}));`
        },
        {
            title: "异步函数",
            text: `async function fetchUser(id) {
\tconst response = await fetch(\`/api/users/\${id}\`);
\tif (!response.ok) {
\t\tthrow new Error('Failed to fetch');
\t}
\treturn response.json();
}`
        }
    ],
    symbols: [
        {
            title: "符号密集",
            text: `() => { return [a, b, c].join("::"); }`
        },
        {
            title: "正则表达式",
            text: `const slug = value.replace(/[^a-z0-9-]/gi, "-").toLowerCase();`
        },
        {
            title: "SQL 查询",
            text: `SELECT id, email FROM users WHERE role = 'admin' AND active = 1;`
        },
        {
            title: "可选链",
            text: `const total = cart?.items?.reduce((sum, item) => sum + item.price, 0) ?? 0;`
        }
    ],
    flow: [
        {
            title: "异步重试",
            text: `async function retry(task, limit = 3) {
\tlet lastError;
\tfor (let attempt = 1; attempt <= limit; attempt++) {
\t\ttry {
\t\t\treturn await task();
\t\t} catch (error) {
\t\t\tlastError = error;
\t\t\tawait wait(attempt * 250);
\t\t}
\t}
\tthrow lastError;
}`
        },
        {
            title: "状态归并",
            text: `function reducer(state, action) {
\tswitch (action.type) {
\t\tcase "start":
\t\t\treturn { ...state, status: "running", errors: 0 };
\t\tcase "finish":
\t\t\treturn { ...state, status: "done", result: action.result };
\t\tdefault:
\t\t\treturn state;
\t}
}`
        }
    ]
};

const difficulty = {
    easy: { max: 90 },
    medium: { max: 180 },
    hard: { max: Infinity }
};

// 全局状态
let store = loadStore();
const state = {
    mode: 'code',
    difficulty: 'medium',
    status: 'idle',
    target: '',
    title: '',
    input: '',
    startedAt: 0,
    pausedAt: 0,
    pausedMs: 0,
    timerId: null,
    combo: 0,
    bestCombo: 0,
    errors: 0,
    corrections: 0,
    customText: store.customText || ''
};

// DOM 引用
const dom = {
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    wpm: document.getElementById('wpm'),
    accuracy: document.getElementById('accuracy'),
    combo: document.getElementById('combo'),
    time: document.getElementById('time'),
    grade: document.getElementById('grade'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    snippetTitle: document.getElementById('snippetTitle'),
    snippetMeta: document.getElementById('snippetMeta'),
    codeDisplay: document.getElementById('codeDisplay'),
    hiddenInput: document.getElementById('hiddenInput'),
    startBtn: document.getElementById('startBtn'),
    resetBtn: document.getElementById('resetBtn'),
    resetCodeBtn: document.getElementById('resetCodeBtn'),
    soundToggle: document.getElementById('soundToggle'),
    themeToggle: document.getElementById('themeToggle'),
    customModal: document.getElementById('customModal'),
    customText: document.getElementById('customText'),
    saveCustom: document.getElementById('saveCustom'),
    cancelCustom: document.getElementById('cancelCustom'),
    closeModal: document.getElementById('closeModal'),
    toast: document.getElementById('toast'),
    levelBadge: document.getElementById('levelBadge'),
    levelTitle: document.getElementById('levelTitle'),
    xpFill: document.getElementById('xpFill'),
    xpText: document.getElementById('xpText')
};

// 初始化
function init() {
    applySettings();
    bindEvents();
    selectSnippet();
    renderAll();
    console.info('Code Typing Lab v3.0.0 - Train Mode');
}

function applySettings() {
    audioSystem.setEnabled(store.sound);
    dom.soundToggle.textContent = store.sound ? '🔊' : '🔇';

    const theme = store.theme || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    dom.themeToggle.textContent = theme === 'light' ? '☀️' : '🌙';

    dom.customText.value = state.customText;
    normalizeDailyStats(store);
}

function bindEvents() {
    // 模式选择
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    // 难度选择
    document.querySelectorAll('[data-difficulty]').forEach(btn => {
        btn.addEventListener('click', () => setDifficulty(btn.dataset.difficulty));
    });

    // 操作按钮
    dom.startBtn.addEventListener('click', handlePrimaryAction);
    dom.resetBtn.addEventListener('click', () => {
        resetRound(true);
        showToast('已换一题');
    });
    dom.resetCodeBtn.addEventListener('click', () => {
        resetRound(true);
        showToast('已重置');
    });

    // 音效和主题
    dom.soundToggle.addEventListener('click', toggleSound);
    dom.themeToggle.addEventListener('click', toggleTheme);

    // 自定义模态框
    dom.saveCustom.addEventListener('click', saveCustomText);
    dom.cancelCustom.addEventListener('click', closeCustomModal);
    dom.closeModal.addEventListener('click', closeCustomModal);

    // 代码区域点击聚焦
    dom.codeDisplay.addEventListener('click', () => {
        if (state.status === 'running') {
            dom.hiddenInput.focus();
        }
    });

    // 输入事件
    dom.hiddenInput.addEventListener('input', handleInput);
    dom.hiddenInput.addEventListener('keydown', handleKeydown);

    // 全局快捷键
    document.addEventListener('keydown', handleGlobalKey);
}

// 模式和难度切换
function setMode(mode) {
    if (state.status === 'running') {
        showToast('请先完成或暂停当前训练');
        return;
    }

    state.mode = mode;
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    if (mode === 'custom') {
        if (!state.customText.trim()) {
            openCustomModal();
            return;
        }
    }

    resetRound(true);
}

function setDifficulty(level) {
    if (state.status === 'running') {
        showToast('训练中暂时不能切换难度');
        return;
    }

    state.difficulty = level;
    document.querySelectorAll('[data-difficulty]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.difficulty === level);
    });

    resetRound(true);
}

// 自定义文本
function openCustomModal() {
    dom.customModal.classList.add('show');
    dom.customText.focus();
}

function closeCustomModal() {
    dom.customModal.classList.remove('show');
}

function saveCustomText() {
    const text = dom.customText.value.replace(/\r\n/g, '\n');
    if (!text.trim()) {
        showToast('自定义文本不能为空');
        return;
    }

    state.customText = text;
    store.customText = text;
    saveStore(store);
    closeCustomModal();
    setMode('custom');
    showToast('自定义文本已保存');
}

// 音效和主题
function toggleSound() {
    store.sound = !store.sound;
    audioSystem.setEnabled(store.sound);
    dom.soundToggle.textContent = store.sound ? '🔊' : '🔇';
    saveStore(store);

    if (store.sound) {
        audioSystem.playTone(500, 0.1);
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    dom.themeToggle.textContent = newTheme === 'light' ? '☀️' : '🌙';

    store.theme = newTheme;
    saveStore(store);
}

// Toast 通知
function showToast(message) {
    dom.toast.textContent = message;
    dom.toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
        dom.toast.classList.remove('show');
    }, 2500);
}

// 选择代码片段
function selectSnippet() {
    if (state.mode === 'custom' && state.customText.trim()) {
        state.target = state.customText.replace(/\r\n/g, '\n');
        state.title = '自定义文本';
        return;
    }

    const pool = snippets[state.mode] || snippets.code;
    const limit = difficulty[state.difficulty].max;
    const candidates = pool.filter(item => item.text.length <= limit);
    const source = candidates.length ? candidates : pool;
    const index = Math.floor(Math.random() * source.length);

    state.target = source[index].text;
    state.title = source[index].title;
}

// 训练控制
function handlePrimaryAction() {
    if (state.status === 'running') return;

    if (state.status === 'paused') {
        resumeRound();
        return;
    }

    if (state.status === 'completed') {
        resetRound(true);
    }

    startRound();
}

function startRound() {
    if (state.mode === 'custom' && !state.customText.trim()) {
        openCustomModal();
        showToast('请先设置自定义文本');
        return;
    }

    state.status = 'running';
    state.startedAt = Date.now();
    state.pausedAt = 0;
    state.pausedMs = 0;
    state.input = '';
    state.combo = 0;
    state.bestCombo = 0;
    state.errors = 0;
    state.corrections = 0;

    dom.hiddenInput.disabled = false;
    dom.hiddenInput.value = '';
    dom.hiddenInput.focus();

    startTimer();
    audioSystem.playStart();
    renderAll();
}

function pauseRound() {
    if (state.status !== 'running') return;

    state.status = 'paused';
    state.pausedAt = Date.now();
    stopTimer();
    dom.hiddenInput.disabled = true;

    showToast('已暂停，按 Enter 继续');
    renderAll();
}

function resumeRound() {
    if (state.status !== 'paused') return;

    state.status = 'running';
    state.pausedMs += Date.now() - state.pausedAt;
    state.pausedAt = 0;

    dom.hiddenInput.disabled = false;
    dom.hiddenInput.focus();

    startTimer();
    renderAll();
}

function resetRound(withNewSnippet = false) {
    stopTimer();
    state.status = 'idle';
    state.input = '';
    state.combo = 0;
    state.bestCombo = 0;
    state.errors = 0;
    state.corrections = 0;
    state.startedAt = 0;
    state.pausedAt = 0;
    state.pausedMs = 0;

    dom.hiddenInput.disabled = true;
    dom.hiddenInput.value = '';

    if (withNewSnippet) selectSnippet();
    renderAll();
}

function completeRound() {
    state.status = 'completed';
    stopTimer();
    dom.hiddenInput.disabled = true;

    const result = getStats();
    const now = Date.now();
    const previousPlayedDay = store.lastPlayedDay;

    if (previousPlayedDay !== getTodayKey(now)) {
        store.todayChars = 0;
    }

    const oldLevel = getCurrentLevel(store.totalXP);

    store.totalRuns += 1;
    store.bestWpm = Math.max(store.bestWpm, result.wpm);
    store.bestAccuracy = Math.max(store.bestAccuracy, result.accuracy);
    store.todayChars += state.target.length;
    store.bestCombo = Math.max(store.bestCombo, state.bestCombo);
    store.maxCharsInSession = Math.max(store.maxCharsInSession, state.target.length);

    // 记录评分
    if (result.grade === 'S') {
        store.hasGradeS = true;
    }

    // 记录模式
    if (!store.modesPlayed) store.modesPlayed = [];
    if (!store.modesPlayed.includes(state.mode)) {
        store.modesPlayed.push(state.mode);
        store.modesCompleted = store.modesPlayed.length;
    }

    // 计算经验值
    const xpGained = calculateXP(result.wpm, result.accuracy, state.target.length);
    store.totalXP = (store.totalXP || 0) + xpGained;

    const newLevel = getCurrentLevel(store.totalXP);
    const leveledUp = newLevel.level > oldLevel.level;

    // 检查新徽章
    const newBadges = checkNewBadges({
        totalRuns: store.totalRuns,
        bestWpm: store.bestWpm,
        bestAccuracy: store.bestAccuracy,
        maxCharsInSession: store.maxCharsInSession,
        bestCombo: store.bestCombo,
        dayStreak: store.dayStreak,
        hasGradeS: store.hasGradeS,
        modesCompleted: store.modesCompleted
    }, store.earnedBadges || []);

    if (newBadges.length > 0) {
        if (!store.earnedBadges) store.earnedBadges = [];
        newBadges.forEach(badge => {
            store.earnedBadges.push(badge.id);
        });
    }

    updateDayStreak(store, now);

    store.history.unshift({
        wpm: result.wpm,
        accuracy: result.accuracy,
        time: result.elapsed,
        mode: state.mode,
        chars: state.target.length,
        grade: result.grade,
        xp: xpGained,
        createdAt: now
    });
    store.history = store.history.slice(0, 20);

    saveStore(store);

    audioSystem.playComplete();

    // 显示成就通知
    if (leveledUp) {
        showLevelUpNotification(newLevel);
    }

    if (newBadges.length > 0) {
        setTimeout(() => {
            showBadgeNotification(newBadges[0]);
        }, leveledUp ? 2000 : 0);
    }

    showToast(`完成！${result.wpm} WPM，准确率 ${result.accuracy}% (+${xpGained} XP)`);
    renderAll();
}

// 输入处理
function handleKeydown(event) {
    if (event.key === 'Tab') {
        event.preventDefault();
        if (state.status !== 'running') return;

        const input = dom.hiddenInput;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.value = `${input.value.slice(0, start)}\t${input.value.slice(end)}`;
        input.selectionStart = input.selectionEnd = start + 1;
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

function handleInput(event) {
    if (state.status !== 'running') return;

    const next = event.target.value.replace(/\r\n/g, '\n');
    const previousLength = state.input.length;
    state.input = next;

    if (next.length < previousLength) {
        // 删除字符
        state.corrections += 1;
        state.combo = 0;
    } else if (next.length > previousLength) {
        // 新增字符
        const typed = next.slice(previousLength);
        for (let offset = 0; offset < typed.length; offset += 1) {
            const index = previousLength + offset;
            const actual = typed[offset];
            const expected = state.target[index];

            if (actual === expected) {
                state.combo += 1;
                state.bestCombo = Math.max(state.bestCombo, state.combo);
                audioSystem.playKeystroke();

                // 连击里程碑
                if (state.combo === 10 || state.combo === 25 || state.combo === 50 || state.combo === 100) {
                    audioSystem.playComboMilestone(Math.floor(state.combo / 10));
                    showComboEffect(state.combo);
                }
            } else {
                state.errors += 1;
                state.combo = 0;
                audioSystem.playError();
            }
        }
    }

    if (state.input === state.target) {
        completeRound();
    } else {
        renderAll();
    }
}

function handleGlobalKey(event) {
    if (event.key === 'Escape') {
        if (state.status === 'running') {
            pauseRound();
        }
        return;
    }

    if (event.key === 'Enter') {
        const isTyping = document.activeElement === dom.hiddenInput;
        if (state.status === 'running' && isTyping) return;

        event.preventDefault();
        handlePrimaryAction();
    }
}

// 统计计算
function getStats() {
    const elapsedMs = getElapsedMs();
    const elapsed = Math.max(0, Math.round(elapsedMs / 1000));
    const minutes = Math.max(elapsedMs / 60000, 1 / 60000);
    const inputLength = state.input.length;

    let correct = 0;
    for (let i = 0; i < inputLength; i += 1) {
        if (state.input[i] === state.target[i]) correct += 1;
    }

    const accuracy = inputLength === 0 ? 100 : Math.max(0, Math.round((correct / inputLength) * 100));
    const wpm = Math.round((correct / 5) / minutes);
    const progress = Math.min(100, Math.round((Math.min(inputLength, state.target.length) / state.target.length) * 100));
    const grade = getGrade(wpm, accuracy, progress);

    return { elapsed, accuracy, wpm, progress, grade, correct };
}

function getElapsedMs() {
    if (!state.startedAt) return 0;
    if (state.status === 'paused') return state.pausedAt - state.startedAt - state.pausedMs;
    return Date.now() - state.startedAt - state.pausedMs;
}

function getGrade(wpm, accuracy, progress) {
    if (progress < 100) return '-';
    const score = wpm * 0.72 + accuracy * 0.58 + Math.min(state.bestCombo, 80) * 0.18 - state.corrections * 1.5;
    if (score >= 116) return 'S';
    if (score >= 94) return 'A';
    if (score >= 76) return 'B';
    if (score >= 58) return 'C';
    return 'D';
}

// 定时器
function startTimer() {
    stopTimer();
    state.timerId = setInterval(() => renderAll(), 250);
}

function stopTimer() {
    if (state.timerId) {
        clearInterval(state.timerId);
        state.timerId = null;
    }
}

// 渲染
function renderAll() {
    const stats = getStats();
    renderLevel();
    renderStatus();
    renderStats(stats);
    renderProgress(stats);
    renderCode();
    renderMeta();
    renderButtons();
}

function renderLevel() {
    const currentLevel = getCurrentLevel(store.totalXP || 0);
    const nextLevelXP = getNextLevelXP(currentLevel);

    dom.levelBadge.textContent = `Lv.${currentLevel.level}`;
    dom.levelTitle.textContent = currentLevel.title;

    if (nextLevelXP) {
        const currentXP = store.totalXP || 0;
        const xpInLevel = currentXP - currentLevel.xp;
        const xpNeeded = nextLevelXP - currentLevel.xp;
        const percentage = Math.min(100, (xpInLevel / xpNeeded) * 100);

        dom.xpFill.style.width = `${percentage}%`;
        dom.xpText.textContent = `${xpInLevel} / ${xpNeeded} XP`;
    } else {
        dom.xpFill.style.width = '100%';
        dom.xpText.textContent = '已达到最高等级';
    }
}

function renderStatus() {
    const statusMap = {
        idle: '准备开始',
        running: '训练中',
        paused: '已暂停',
        completed: '已完成'
    };

    dom.statusDot.className = `status-dot ${state.status}`;
    dom.statusText.textContent = statusMap[state.status];
}

function renderStats(stats) {
    dom.wpm.textContent = stats.wpm;
    dom.accuracy.innerHTML = `${stats.accuracy}<span class="stat-unit">%</span>`;
    dom.combo.textContent = state.combo;
    dom.time.innerHTML = `${stats.elapsed}<span class="stat-unit">s</span>`;
}

function renderProgress(stats) {
    dom.grade.textContent = stats.grade;
    dom.progressText.textContent = `${stats.progress}%`;
    dom.progressBar.style.width = `${stats.progress}%`;
}

function renderCode() {
    if (!state.target) {
        dom.codeDisplay.innerHTML = `
            <div class="code-hint">
                <div class="hint-icon">⌨️</div>
                <h3>开始打字训练</h3>
                <p>点击"开始训练"按钮，然后直接在此区域开始打字</p>
                <p class="hint-tip">提示：按 ESC 暂停，按 Enter 可快速开始/继续</p>
            </div>
        `;
        return;
    }

    const html = Array.from(state.target).map((char, index) => {
        let className = 'pending';

        if (index < state.input.length) {
            className = state.input[index] === char ? 'correct' : 'incorrect';
        } else if (index === state.input.length && state.status === 'running') {
            className = 'current';
        }

        if (char === '\t') {
            return `<span class="char ${className}"><span class="tab-marker">\t</span></span>`;
        }

        return `<span class="char ${className}">${escapeHtml(char)}</span>`;
    }).join('');

    dom.codeDisplay.innerHTML = html;

    // 自动滚动到当前位置
    if (state.status === 'running') {
        const currentChar = dom.codeDisplay.querySelector('.char.current');
        if (currentChar) {
            currentChar.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
        }
    }
}

function renderMeta() {
    dom.snippetTitle.textContent = state.title || '选择模式开始';
    dom.snippetMeta.textContent = `${state.target.length} 字符`;
}

function renderButtons() {
    const buttonText = {
        idle: '开始训练',
        running: '训练中...',
        paused: '继续训练',
        completed: '下一题'
    };

    dom.startBtn.innerHTML = `
        <span>${buttonText[state.status]}</span>
        <span class="btn-icon">→</span>
    `;
    dom.startBtn.disabled = state.status === 'running';
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 显示连击特效
function showComboEffect(combo) {
    const effect = document.createElement('div');
    effect.className = 'combo-effect';
    effect.textContent = `${combo} COMBO!`;
    document.body.appendChild(effect);

    setTimeout(() => effect.remove(), 800);
}

// 显示升级通知
function showLevelUpNotification(newLevel) {
    const notification = document.createElement('div');
    notification.className = 'level-up-notification';
    notification.innerHTML = `
        <div class="level-up-content">
            <div class="level-up-icon">🎉</div>
            <div class="level-up-text">
                <div class="level-up-title">升级了！</div>
                <div class="level-up-level">Lv.${newLevel.level} ${newLevel.title}</div>
            </div>
        </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// 显示徽章通知
function showBadgeNotification(badge) {
    const notification = document.createElement('div');
    notification.className = 'badge-notification';
    notification.innerHTML = `
        <div class="badge-content">
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-text">
                <div class="badge-title">解锁成就！</div>
                <div class="badge-name">${badge.name}</div>
                <div class="badge-desc">${badge.desc}</div>
            </div>
        </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 500);
    }, 3500);
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
