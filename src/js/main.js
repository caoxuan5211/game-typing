import { audioSystem } from './audio.js';

const VERSION = "3.0.0";
const DAILY_GOAL = 1200;
const STORAGE_KEY = "code_typing_lab_v3";
const THEMES = ["light", "dark"];

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
            title: "错误处理",
            text: `try {
\tconst payload = JSON.parse(input);
\tawait saveProfile(payload);
} catch (error) {
\tconsole.error("save failed", error);
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
            title: "SQL 条件",
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
        },
        {
            title: "TypeScript 模型",
            text: `type Result<T> =
\t| { ok: true; value: T }
\t| { ok: false; reason: string };

function unwrap<T>(result: Result<T>): T {
\tif (!result.ok) throw new Error(result.reason);
\treturn result.value;
}`
        }
    ]
};

const difficulty = {
    easy: { label: "短", max: 90 },
    medium: { label: "标准", max: 180 },
    hard: { label: "硬核", max: Infinity }
};

const keyboardRows = [
    "`1234567890-=",
    "qwertyuiop[]\\",
    "asdfghjkl;'",
    "zxcvbnm,./"
];

const dom = {};
const state = {
    mode: "code",
    difficulty: "medium",
    status: "idle",
    target: "",
    title: "",
    input: "",
    startedAt: 0,
    pausedAt: 0,
    pausedMs: 0,
    timerId: null,
    combo: 0,
    bestCombo: 0,
    lastLength: 0,
    errors: 0,
    corrections: 0,
    weakKeys: {},
    customText: "",
    sound: true,
    themeIndex: 0,
    activeSnippetIndex: -1
};

let store = loadStore();

function boot() {
    cacheDom();
    applyStoredSettings();
    renderKeyboard();
    bindEvents();
    selectSnippet();
    renderAll();
    console.info(`Code Typing Lab v${VERSION}`);
}

function cacheDom() {
    [
        "soundBtn", "themeBtn", "startBtn", "resetBtn", "customPanel", "customText",
        "saveCustomBtn", "typingInput", "targetText", "snippetTitle", "snippetMeta",
        "wpm", "accuracy", "combo", "time", "grade", "progressBar", "progressText",
        "statusDot", "statusText", "dailyGoalText", "dailyGoalBar", "bestWpm",
        "totalRuns", "dayStreak", "feedbackState", "feedbackList", "keyboardMap",
        "weakKeyText", "historyList", "clearStatsBtn", "toast"
    ].forEach(id => {
        dom[id] = document.getElementById(id);
    });
}

function bindEvents() {
    document.querySelectorAll("[data-mode]").forEach(button => {
        button.addEventListener("click", () => setMode(button.dataset.mode));
    });

    document.querySelectorAll("[data-difficulty]").forEach(button => {
        button.addEventListener("click", () => setDifficulty(button.dataset.difficulty));
    });

    dom.startBtn.addEventListener("click", handlePrimaryAction);
    dom.resetBtn.addEventListener("click", () => {
        resetRound(true);
        toast("已换一题");
    });

    dom.saveCustomBtn.addEventListener("click", saveCustomText);
    dom.clearStatsBtn.addEventListener("click", clearStats);
    dom.soundBtn.addEventListener("click", toggleSound);
    dom.themeBtn.addEventListener("click", cycleTheme);

    dom.typingInput.addEventListener("keydown", handleTypingKeydown);
    dom.typingInput.addEventListener("input", handleInput);
    dom.typingInput.addEventListener("paste", event => {
        event.preventDefault();
        toast("训练模式已禁用粘贴");
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            if (state.status === "running") pauseRound();
            return;
        }

        if (event.key === "Enter") {
            const typing = document.activeElement === dom.typingInput;
            if (state.status === "running" && typing) return;
            event.preventDefault();
            handlePrimaryAction();
        }
    });
}

function applyStoredSettings() {
    state.sound = store.sound ?? true;
    state.themeIndex = Math.max(0, THEMES.indexOf(store.theme || "light"));
    if (state.themeIndex < 0) state.themeIndex = 0;
    state.customText = store.customText || "";
    dom.customText.value = state.customText;
    dom.soundBtn.setAttribute("aria-pressed", String(state.sound));
    audioSystem.setEnabled(state.sound);
    updateSoundButton();
    applyTheme();
    normalizeDailyStats();
}

function setMode(mode) {
    if (state.status === "running") {
        toast("先完成或暂停当前训练");
        return;
    }
    state.mode = mode;
    document.querySelectorAll("[data-mode]").forEach(button => {
        button.classList.toggle("active", button.dataset.mode === mode);
    });
    dom.customPanel.hidden = mode !== "custom";
    resetRound(true);
}

function setDifficulty(level) {
    if (state.status === "running") {
        toast("训练中暂时不能切换难度");
        return;
    }
    state.difficulty = level;
    document.querySelectorAll("[data-difficulty]").forEach(button => {
        button.classList.toggle("active", button.dataset.difficulty === level);
    });
    resetRound(true);
}

function saveCustomText() {
    const text = dom.customText.value.replace(/\r\n/g, "\n");
    if (!text.trim()) {
        toast("自定义文本不能为空");
        return;
    }
    state.customText = text;
    store.customText = text;
    saveStore();
    setMode("custom");
    toast("自定义文本已保存");
}

function handlePrimaryAction() {
    if (state.status === "running") return;
    if (state.status === "paused") {
        resumeRound();
        return;
    }
    if (state.status === "completed") {
        resetRound(true);
    }
    startRound();
}

function startRound() {
    if (state.mode === "custom" && !state.customText.trim()) {
        dom.customPanel.hidden = false;
        dom.customText.focus();
        toast("先保存一段自定义训练文本");
        return;
    }

    state.status = "running";
    state.startedAt = Date.now();
    state.pausedAt = 0;
    state.pausedMs = 0;
    state.input = "";
    state.combo = 0;
    state.bestCombo = 0;
    state.errors = 0;
    state.corrections = 0;
    state.weakKeys = {};
    state.lastLength = 0;

    dom.typingInput.disabled = false;
    dom.typingInput.value = "";
    dom.typingInput.focus();
    startTimer();
    audioSystem.playStart();
    renderAll();
}

function pauseRound() {
    if (state.status !== "running") return;
    state.status = "paused";
    state.pausedAt = Date.now();
    stopTimer();
    dom.typingInput.disabled = true;
    toast("已暂停，按 Enter 继续");
    renderAll();
}

function resumeRound() {
    if (state.status !== "paused") return;
    state.status = "running";
    state.pausedMs += Date.now() - state.pausedAt;
    state.pausedAt = 0;
    dom.typingInput.disabled = false;
    dom.typingInput.focus();
    startTimer();
    renderAll();
}

function resetRound(withNewSnippet = false) {
    stopTimer();
    state.status = "idle";
    state.input = "";
    state.combo = 0;
    state.bestCombo = 0;
    state.errors = 0;
    state.corrections = 0;
    state.weakKeys = {};
    state.startedAt = 0;
    state.pausedAt = 0;
    state.pausedMs = 0;
    state.lastLength = 0;
    dom.typingInput.disabled = true;
    dom.typingInput.value = "";
    if (withNewSnippet) selectSnippet();
    renderAll();
}

function completeRound() {
    state.status = "completed";
    stopTimer();
    dom.typingInput.disabled = true;

    const result = getStats();
    const now = Date.now();
    const previousPlayedDay = store.lastPlayedDay;
    if (previousPlayedDay !== todayKey(now)) {
        store.todayChars = 0;
    }
    store.totalRuns += 1;
    store.bestWpm = Math.max(store.bestWpm, result.wpm);
    store.bestAccuracy = Math.max(store.bestAccuracy, result.accuracy);
    store.todayChars += state.target.length;
    updateDayStreak(previousPlayedDay, now);
    store.lastPlayedDay = todayKey(now);
    store.history.unshift({
        wpm: result.wpm,
        accuracy: result.accuracy,
        time: result.elapsed,
        mode: state.mode,
        chars: state.target.length,
        grade: result.grade,
        createdAt: now
    });
    store.history = store.history.slice(0, 8);
    saveStore();

    audioSystem.playComplete();
    toast(`完成：${result.wpm} WPM，准确率 ${result.accuracy}%`);
    renderAll();
}

function handleTypingKeydown(event) {
    if (event.key === "Tab") {
        event.preventDefault();
        if (state.status !== "running") return;
        const input = dom.typingInput;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.value = `${input.value.slice(0, start)}\t${input.value.slice(end)}`;
        input.selectionStart = input.selectionEnd = start + 1;
        input.dispatchEvent(new Event("input", { bubbles: true }));
    }
}

function handleInput(event) {
    if (state.status !== "running") return;
    const next = event.target.value.replace(/\r\n/g, "\n");
    const previousLength = state.input.length;
    state.input = next;

    if (next.length < previousLength) {
        state.corrections += 1;
        state.combo = 0;
    } else if (next.length > previousLength) {
        const typed = next.slice(previousLength);
        for (let offset = 0; offset < typed.length; offset += 1) {
            const index = previousLength + offset;
            const actual = typed[offset];
            const expected = state.target[index];
            if (actual === expected) {
                state.combo += 1;
                state.bestCombo = Math.max(state.bestCombo, state.combo);
                audioSystem.playKeystroke();

                // Play combo milestone sounds
                if (state.combo === 10 || state.combo === 25 || state.combo === 50 || state.combo === 100) {
                    audioSystem.playComboMilestone(Math.floor(state.combo / 10));
                }
            } else {
                state.errors += 1;
                state.combo = 0;
                recordWeakKey(expected || actual);
                audioSystem.playError();
            }
        }
    }

    state.lastLength = next.length;
    if (state.input === state.target) {
        completeRound();
    } else {
        renderAll();
    }
}

function selectSnippet() {
    if (state.mode === "custom" && state.customText.trim()) {
        state.target = state.customText.replace(/\r\n/g, "\n");
        state.title = "自定义文本";
        return;
    }

    const pool = snippets[state.mode] || snippets.code;
    const limit = difficulty[state.difficulty].max;
    const candidates = pool.filter(item => item.text.length <= limit);
    const source = candidates.length ? candidates : pool;
    let index = Math.floor(Math.random() * source.length);
    if (source.length > 1 && index === state.activeSnippetIndex) {
        index = (index + 1) % source.length;
    }
    state.activeSnippetIndex = index;
    state.target = source[index].text;
    state.title = source[index].title;
}

function renderAll() {
    const stats = getStats();
    renderTarget();
    renderSession(stats);
    renderFeedback(stats);
    renderKeyboard();
    renderHistory();
    renderDaily();
    updateActions();
}

function renderTarget() {
    const html = Array.from(state.target).map((char, index) => {
        let className = "pending";
        if (index < state.input.length) {
            className = state.input[index] === char ? "correct" : "incorrect";
        } else if (index === state.input.length && state.status === "running") {
            className = "current";
        }

        if (char === "\t") {
            return `<span class="char ${className}" data-index="${index}"><span class="tab-marker">\t</span></span>`;
        }
        return `<span class="char ${className}" data-index="${index}">${escapeHtml(char)}</span>`;
    }).join("");

    dom.targetText.innerHTML = html;
    dom.snippetTitle.textContent = state.title;
    dom.snippetMeta.textContent = `${difficulty[state.difficulty].label} · ${state.target.length} 字符`;

    const current = dom.targetText.querySelector(`[data-index="${Math.min(state.input.length, state.target.length - 1)}"]`);
    if (current && state.status === "running") {
        current.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
}

function renderSession(stats) {
    dom.wpm.textContent = stats.wpm;
    dom.accuracy.textContent = `${stats.accuracy}%`;
    dom.combo.textContent = state.combo;
    dom.time.textContent = `${stats.elapsed}s`;
    dom.grade.textContent = `评级 ${stats.grade}`;
    dom.progressBar.style.width = `${stats.progress}%`;
    dom.progressText.textContent = `${stats.progress}%`;

    dom.statusDot.className = `status-dot ${state.status === "running" ? "running" : state.status === "paused" ? "paused" : state.status === "completed" ? "done" : ""}`;
    const statusMap = {
        idle: "准备开始",
        running: "训练中",
        paused: "已暂停",
        completed: "已完成"
    };
    dom.statusText.textContent = statusMap[state.status];
}

function renderFeedback(stats) {
    const weak = getWeakKeySummary();
    dom.feedbackState.textContent = state.status === "running" ? "实时反馈" : "训练建议";
    dom.weakKeyText.textContent = weak ? `弱项：${weak}` : "暂无弱项";

    const lines = [];
    if (state.status === "idle") {
        lines.push("按 Enter 开始，或用鼠标切换模式和难度。");
    }
    if (state.status === "paused") {
        lines.push("按 Enter 继续，当前输入会保留。");
    }
    if (state.status === "completed") {
        lines.push(`本轮 ${stats.grade} 级，最佳连击 ${state.bestCombo}。`);
        lines.push(stats.accuracy >= 98 ? "准确率很好，可以提高难度。" : "下一轮先压低错误率，再提速。");
    }
    if (state.status === "running") {
        lines.push(stats.accuracy >= 96 ? "节奏稳定，继续保持手型。" : "错误偏多，先放慢半拍。");
        lines.push(state.combo >= 20 ? `连击 ${state.combo}，进入稳定区。` : "连续正确 20 字符后会明显提升评分。");
    }
    if (weak) lines.push(`重点复练：${weak}`);
    if (store.todayChars >= DAILY_GOAL) lines.push("今日目标已达成，可以挑战硬核长段。");
    if (!lines.length) lines.push("完成一轮后这里会给出下一步建议。");

    dom.feedbackList.innerHTML = lines.slice(0, 4).map(line => `<li>${escapeHtml(line)}</li>`).join("");
}

function renderKeyboard() {
    if (!dom.keyboardMap) return;
    const max = Math.max(1, ...Object.values(state.weakKeys));
    const cells = keyboardRows.join("").split("").map(key => {
        const count = state.weakKeys[key] || 0;
        const heat = count === 0 ? "" : count / max > 0.66 ? "hot-3" : count / max > 0.33 ? "hot-2" : "hot-1";
        return `<span class="key-cell ${heat}" title="${escapeHtml(key)} ${count} 次">${escapeHtml(key)}</span>`;
    });
    cells.unshift(`<span class="key-cell ${(state.weakKeys.Tab || 0) > 0 ? "hot-2" : ""}" title="Tab ${state.weakKeys.Tab || 0} 次">Tab</span>`);
    cells.push(`<span class="key-cell ${(state.weakKeys.Enter || 0) > 0 ? "hot-2" : ""}" title="Enter ${state.weakKeys.Enter || 0} 次">Enter</span>`);
    dom.keyboardMap.innerHTML = cells.join("");
}

function renderHistory() {
    if (!store.history.length) {
        dom.historyList.innerHTML = `<li>
            <div class="history-grade">-</div>
            <div class="history-wpm">暂无记录</div>
            <div class="history-meta">完成一轮后显示</div>
        </li>`;
        return;
    }
    dom.historyList.innerHTML = store.history.map(item => {
        const date = new Date(item.createdAt).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
        return `<li>
            <div class="history-grade">${item.grade}</div>
            <div class="history-wpm">${item.wpm} WPM</div>
            <div class="history-meta">${item.accuracy}% · ${date}</div>
        </li>`;
    }).join("");
}

function renderDaily() {
    normalizeDailyStats();
    const goal = Math.min(100, Math.round((store.todayChars / DAILY_GOAL) * 100));
    dom.dailyGoalText.textContent = `${store.todayChars} / ${DAILY_GOAL} 字符`;
    dom.dailyGoalBar.style.width = `${goal}%`;
    dom.bestWpm.textContent = `${store.bestWpm} WPM`;
    dom.totalRuns.textContent = store.totalRuns;
    dom.dayStreak.textContent = `${store.dayStreak} 天`;
}

function updateActions() {
    const labels = {
        idle: "Enter 开始",
        running: "训练中",
        paused: "Enter 继续",
        completed: "Enter 下一题"
    };
    dom.startBtn.textContent = labels[state.status];
    dom.startBtn.disabled = state.status === "running";
    dom.resetBtn.textContent = state.status === "completed" ? "再来一题" : "换一题";
}

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
    if (state.status === "paused") return state.pausedAt - state.startedAt - state.pausedMs;
    if (state.status === "completed") return Date.now() - state.startedAt - state.pausedMs;
    return Date.now() - state.startedAt - state.pausedMs;
}

function getGrade(wpm, accuracy, progress) {
    if (progress < 100) return "-";
    const score = wpm * 0.72 + accuracy * 0.58 + Math.min(state.bestCombo, 80) * 0.18 - state.corrections * 1.5;
    if (score >= 116) return "S";
    if (score >= 94) return "A";
    if (score >= 76) return "B";
    if (score >= 58) return "C";
    return "D";
}

function startTimer() {
    stopTimer();
    state.timerId = window.setInterval(() => renderAll(), 250);
}

function stopTimer() {
    if (state.timerId) {
        window.clearInterval(state.timerId);
        state.timerId = null;
    }
}

function recordWeakKey(char) {
    const label = char === "\t" ? "Tab" : char === "\n" ? "Enter" : String(char || "").toLowerCase();
    if (!label.trim() && label !== "Tab" && label !== "Enter") return;
    state.weakKeys[label] = (state.weakKeys[label] || 0) + 1;
}

function getWeakKeySummary() {
    const entries = Object.entries(state.weakKeys).sort((a, b) => b[1] - a[1]);
    return entries.slice(0, 3).map(([key]) => key).join(" ");
}

function clearStats() {
    if (!window.confirm("确定清空本地成绩吗？")) return;
    store = defaultStore();
    saveStore();
    renderAll();
    toast("本地成绩已清空");
}

function toggleSound() {
    state.sound = !state.sound;
    store.sound = state.sound;
    saveStore();
    audioSystem.setEnabled(state.sound);
    dom.soundBtn.setAttribute("aria-pressed", String(state.sound));
    updateSoundButton();
    if (state.sound) {
        audioSystem.playTone(500, 0.1);
    }
}

function updateSoundButton() {
    const icon = state.sound ? "🔊" : "🔇";
    dom.soundBtn.innerHTML = `<span id="soundIcon">${icon}</span> 音效`;
}

function cycleTheme() {
    state.themeIndex = (state.themeIndex + 1) % THEMES.length;
    store.theme = THEMES[state.themeIndex];
    saveStore();
    applyTheme();
    toast(`主题：${store.theme}`);
}

function applyTheme() {
    const theme = THEMES[state.themeIndex] || "light";
    document.documentElement.dataset.theme = theme;
}

function defaultStore() {
    return {
        totalRuns: 0,
        bestWpm: 0,
        bestAccuracy: 0,
        todayChars: 0,
        lastPlayedDay: "",
        dayStreak: 0,
        history: [],
        customText: "",
        theme: "light",
        sound: true
    };
}

function normalizeDailyStats() {
    const today = todayKey();
    if (store.lastPlayedDay && store.lastPlayedDay !== today) {
        store.todayChars = 0;
    }
}

function updateDayStreak(previousDay, timestamp) {
    const today = todayKey(timestamp);
    const yesterday = dayKeyFromOffset(-1, timestamp);
    if (previousDay === today) {
        store.dayStreak = Math.max(1, store.dayStreak);
    } else if (previousDay === yesterday) {
        store.dayStreak += 1;
    } else {
        store.dayStreak = 1;
    }
}

function todayKey(timestamp = Date.now()) {
    return new Date(timestamp).toISOString().slice(0, 10);
}

function dayKeyFromOffset(offset, timestamp = Date.now()) {
    const date = new Date(timestamp);
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
}

function toast(message) {
    dom.toast.textContent = message;
    dom.toast.classList.add("show");
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => dom.toast.classList.remove("show"), 2200);
}

function loadStore() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return { ...defaultStore(), ...parsed };
    } catch {
        return defaultStore();
    }
}

function saveStore() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
} else {
    boot();
}
