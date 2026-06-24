import { audioSystem } from './audio.js';
import { loadStore, saveStore, updateDayStreak, normalizeDailyStats, getTodayKey } from './storage.js';
import { calculateXP, getCurrentLevel, getNextLevelXP, checkNewBadges, BADGES } from './achievements.js';
import { syncLocalStore } from './shell.js?v=20260624-8';

// 代码片段数据
const snippets = {
    javascript: [
        {
            title: "JavaScript 函数",
            language: "javascript",
            text: `function formatUser(user) {
\tconst name = user.name.trim();
\treturn \`\${name} <\${user.email}>\`;
}`
        },
        {
            title: "React Hook",
            language: "javascript",
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
            language: "javascript",
            text: `const activeUsers = users
\t.filter(user => user.enabled)
\t.map(user => ({
\t\tid: user.id,
\t\tlabel: user.name
\t}));`
        },
        {
            title: "异步函数",
            language: "javascript",
            text: `async function fetchUser(id) {
\tconst response = await fetch(\`/api/users/\${id}\`);
\tif (!response.ok) {
\t\tthrow new Error('Failed to fetch');
\t}
\treturn response.json();
}`
        },
        {
            title: "事件委托",
            language: "javascript",
            text: `document.addEventListener('click', event => {
\tconst button = event.target.closest('[data-action]');
\tif (!button) return;
\thandleAction(button.dataset.action);
});`
        },
        {
            title: "Map 缓存",
            language: "javascript",
            text: `const cache = new Map();
function remember(key, factory) {
\tif (!cache.has(key)) cache.set(key, factory());
\treturn cache.get(key);
}`
        },
        {
            title: "Promise 并发",
            language: "javascript",
            text: `const results = await Promise.allSettled(tasks.map(task => task()));
const failed = results.filter(item => item.status === 'rejected');
if (failed.length > 0) reportFailures(failed);`
        }
    ],
    cpp: [
        {
            title: "CPP STL 遍历",
            language: "cpp",
            text: `vector<int> filterEven(const vector<int>& nums) {
\tvector<int> result;
\tfor (int value : nums) {
\t\tif (value % 2 == 0) result.push_back(value);
\t}
\treturn result;
}`
        },
        {
            title: "CPP 模板函数",
            language: "cpp",
            text: `template <typename T>
T clampValue(T value, T low, T high) {
\tif (value < low) return low;
\tif (value > high) return high;
\treturn value;
}`
        },
        {
            title: "CPP 指针检查",
            language: "cpp",
            text: `Node* find(Node* head, int target) {
\twhile (head != nullptr) {
\t\tif (head->value == target) return head;
\t\thead = head->next;
\t}
\treturn nullptr;
}`
        },
        {
            title: "CPP unordered_map",
            language: "cpp",
            text: `unordered_map<string, int> countWords(const vector<string>& words) {
\tunordered_map<string, int> counts;
\tfor (const auto& word : words) {
\t\tcounts[word] += 1;
\t}
\treturn counts;
}`
        },
        {
            title: "CPP lambda 排序",
            language: "cpp",
            text: `sort(users.begin(), users.end(), [](const User& a, const User& b) {
\tif (a.score != b.score) return a.score > b.score;
\treturn a.name < b.name;
});`
        },
        {
            title: "CPP RAII",
            language: "cpp",
            text: `class Timer {
public:
\texplicit Timer(string label) : label_(move(label)) {}
\t~Timer() { cout << label_ << " done\\n"; }
private:
\tstring label_;
};`
        }
    ],
    html: [
        {
            title: "HTML 表单",
            language: "html",
            text: `<form class="login-form" method="post">
\t<label for="email">Email</label>
\t<input id="email" name="email" type="email" required>
\t<button type="submit">Sign in</button>
</form>`
        },
        {
            title: "HTML 卡片",
            language: "html",
            text: `<article class="profile-card">
\t<header>
\t\t<h2>Typing Progress</h2>
\t\t<p>Keep the daily streak alive.</p>
\t</header>
</article>`
        },
        {
            title: "HTML 导航",
            language: "html",
            text: `<nav aria-label="Primary">
\t<a href="/train" class="active">Train</a>
\t<a href="/stats">Stats</a>
\t<a href="/profile">Profile</a>
</nav>`
        },
        {
            title: "HTML 对话框",
            language: "html",
            text: `<dialog id="confirmDialog">
\t<form method="dialog">
\t\t<p>Delete this record?</p>
\t\t<button value="cancel">Cancel</button>
\t\t<button value="confirm">Confirm</button>
\t</form>
</dialog>`
        },
        {
            title: "HTML 表格",
            language: "html",
            text: `<table>
\t<thead><tr><th>Name</th><th>WPM</th></tr></thead>
\t<tbody>
\t\t<tr><td>Ada</td><td>96</td></tr>
\t</tbody>
</table>`
        },
        {
            title: "HTML 图片",
            language: "html",
            text: `<figure>
\t<img src="/assets/chart.png" alt="Weekly typing progress">
\t<figcaption>Practice volume by day</figcaption>
</figure>`
        }
    ],
    sql: [
        {
            title: "SQL 用户查询",
            language: "sql",
            text: `SELECT id, email, last_login
FROM users
WHERE role = 'admin'
\tAND active = 1
ORDER BY last_login DESC;`
        },
        {
            title: "SQL 聚合",
            language: "sql",
            text: `SELECT mode, COUNT(*) AS runs, AVG(wpm) AS avg_wpm
FROM training_sessions
WHERE created_at >= DATE('now', '-7 days')
GROUP BY mode
HAVING runs >= 3;`
        },
        {
            title: "SQL 更新",
            language: "sql",
            text: `UPDATE user_stats
SET total_runs = total_runs + 1,
\tbest_wpm = MAX(best_wpm, 92)
WHERE user_id = ?;`
        },
        {
            title: "SQL Join",
            language: "sql",
            text: `SELECT u.email, s.best_wpm, s.day_streak
FROM users AS u
INNER JOIN user_stats AS s ON s.user_id = u.id
WHERE u.is_active = 1;`
        },
        {
            title: "SQL 插入记录",
            language: "sql",
            text: `INSERT INTO training_sessions
(user_id, wpm, accuracy, time, mode, chars, grade)
VALUES (?, ?, ?, ?, ?, ?, ?);`
        },
        {
            title: "SQL 清理验证码",
            language: "sql",
            text: `DELETE FROM verification_codes
WHERE used = 1
\tOR expires_at < datetime('now', '-1 day');`
        }
    ]
};

const languageLabels = {
    javascript: 'JavaScript',
    cpp: 'CPP',
    html: 'HTML',
    sql: 'SQL',
    custom: 'Custom',
    words: 'Words'
};

const wordBanks = {
    cet4: {
        title: '四级核心',
        desc: '高频基础词',
        words: [
            'ability', 'absence', 'accept', 'achieve', 'active', 'address', 'advance', 'advice',
            'afford', 'against', 'amount', 'appear', 'arrange', 'article', 'attention', 'average',
            'balance', 'benefit', 'career', 'challenge', 'college', 'compare', 'condition', 'culture',
            'degree', 'develop', 'economy', 'education', 'environment', 'experience', 'favorite', 'foreign',
            'general', 'history', 'improve', 'include', 'language', 'material', 'natural', 'opinion',
            'practice', 'quality', 'reason', 'research', 'science', 'similar', 'society', 'technology'
        ]
    },
    cet6: {
        title: '六级进阶',
        desc: '阅读写作词',
        words: [
            'abstract', 'academic', 'acquire', 'alternative', 'analyze', 'apparent', 'approach', 'authority',
            'capacity', 'category', 'commitment', 'component', 'consequence', 'consistent', 'construct', 'contribute',
            'criterion', 'demonstrate', 'dimension', 'distinct', 'domestic', 'emphasis', 'evaluate', 'evidence',
            'framework', 'hypothesis', 'identify', 'implement', 'indicate', 'interpret', 'maintain', 'objective',
            'perspective', 'phenomenon', 'principle', 'priority', 'proportion', 'relevant', 'significant', 'strategy'
        ]
    },
    cpp: {
        title: 'CPP 常用',
        desc: '关键字 / STL',
        words: [
            'include', 'namespace', 'using', 'define', 'main', 'return', 'class', 'struct',
            'public', 'private', 'protected', 'template', 'typename', 'vector', 'string', 'unordered_map',
            'iterator', 'const', 'static', 'inline', 'nullptr', 'override', 'virtual', 'lambda',
            'begin', 'end', 'push_back', 'emplace_back', 'size_t', 'iostream', 'algorithm', 'memory'
        ]
    },
    javascript: {
        title: 'JS 常用',
        desc: '语法 / DOM',
        words: [
            'const', 'let', 'function', 'return', 'async', 'await', 'promise', 'callback',
            'document', 'querySelector', 'addEventListener', 'preventDefault', 'dataset', 'classList', 'localStorage', 'sessionStorage',
            'fetch', 'response', 'request', 'module', 'export', 'import', 'template', 'literal'
        ]
    },
    sql: {
        title: 'SQL 常用',
        desc: '查询关键字',
        words: [
            'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'VALUES', 'JOIN',
            'LEFT', 'RIGHT', 'INNER', 'GROUP', 'ORDER', 'HAVING', 'COUNT', 'AVG',
            'PRIMARY', 'FOREIGN', 'INDEX', 'CREATE', 'ALTER', 'TABLE', 'DATABASE', 'TRANSACTION'
        ]
    }
};

const wordMeanings = {
    ability: '能力；才能',
    absence: '缺席；不存在',
    accept: '接受；认可',
    achieve: '实现；达到',
    active: '活跃的；积极的',
    address: '地址；处理',
    advance: '前进；进步',
    advice: '建议',
    afford: '负担得起',
    against: '反对；倚着',
    amount: '数量；总额',
    appear: '出现；显得',
    arrange: '安排；整理',
    article: '文章；物品',
    attention: '注意力',
    average: '平均的；平均数',
    balance: '平衡',
    benefit: '好处；受益',
    career: '职业；事业',
    challenge: '挑战',
    college: '大学',
    compare: '比较',
    condition: '条件；状态',
    culture: '文化',
    degree: '程度；学位',
    develop: '发展；开发',
    economy: '经济',
    education: '教育',
    environment: '环境',
    experience: '经验；经历',
    favorite: '最喜欢的',
    foreign: '外国的',
    general: '一般的；将军',
    history: '历史',
    improve: '改善；提高',
    include: '包含；引入头文件',
    language: '语言',
    material: '材料；资料',
    natural: '自然的',
    opinion: '观点',
    practice: '练习；实践',
    quality: '质量；品质',
    reason: '原因；理由',
    research: '研究',
    science: '科学',
    similar: '相似的',
    society: '社会',
    technology: '技术',
    abstract: '抽象的；摘要',
    academic: '学术的',
    acquire: '获得；习得',
    alternative: '替代方案；可选的',
    analyze: '分析',
    apparent: '明显的',
    approach: '方法；接近',
    authority: '权威；权限',
    capacity: '容量；能力',
    category: '类别',
    commitment: '承诺；投入',
    component: '组件；组成部分',
    consequence: '后果；结果',
    consistent: '一致的；稳定的',
    construct: '构造；建立',
    contribute: '贡献',
    criterion: '标准',
    demonstrate: '证明；演示',
    dimension: '维度；尺寸',
    distinct: '不同的；清楚的',
    domestic: '国内的；家庭的',
    emphasis: '强调；重点',
    evaluate: '评估',
    evidence: '证据',
    framework: '框架',
    hypothesis: '假设',
    identify: '识别；确认',
    implement: '实现；执行',
    indicate: '表明；指示',
    interpret: '解释；翻译',
    maintain: '维护；保持',
    objective: '目标；客观的',
    perspective: '视角',
    phenomenon: '现象',
    principle: '原则',
    priority: '优先级',
    proportion: '比例',
    relevant: '相关的',
    significant: '重要的；显著的',
    strategy: '策略',
    namespace: '命名空间',
    using: '使用；引入命名',
    define: '定义宏',
    main: '主函数入口',
    return: '返回',
    class: '类',
    struct: '结构体',
    public: '公有访问权限',
    private: '私有访问权限',
    protected: '受保护访问权限',
    template: '模板',
    typename: '类型名',
    vector: '动态数组容器',
    string: '字符串类型',
    unordered_map: '哈希映射容器',
    iterator: '迭代器',
    const: '常量限定',
    static: '静态存储',
    inline: '内联',
    nullptr: '空指针',
    override: '重写虚函数',
    virtual: '虚函数',
    lambda: '匿名函数',
    begin: '起始迭代器',
    end: '结束迭代器',
    push_back: '尾部追加',
    emplace_back: '原地构造追加',
    size_t: '无符号大小类型',
    iostream: '输入输出流头文件',
    algorithm: '算法库',
    memory: '内存工具库',
    let: '块级变量声明',
    function: '函数',
    async: '异步函数标记',
    await: '等待 Promise',
    promise: '异步结果对象',
    callback: '回调函数',
    document: 'DOM 文档对象',
    queryselector: '查询 DOM 元素',
    addeventlistener: '绑定事件监听',
    preventdefault: '阻止默认行为',
    dataset: '元素自定义数据集',
    classlist: '元素类名列表',
    localstorage: '本地持久存储',
    sessionstorage: '会话存储',
    fetch: '网络请求',
    response: '响应对象',
    request: '请求对象',
    module: '模块',
    export: '导出',
    import: '导入',
    literal: '字面量',
    select: '查询',
    from: '来自表',
    where: '筛选条件',
    insert: '插入',
    update: '更新',
    delete: '删除',
    values: '值列表',
    join: '连接表',
    left: '左连接',
    right: '右连接',
    inner: '内连接',
    group: '分组',
    order: '排序',
    having: '分组过滤',
    count: '计数',
    avg: '平均值',
    primary: '主键',
    foreign: '外键',
    index: '索引',
    create: '创建',
    alter: '修改表结构',
    table: '数据表',
    database: '数据库',
    transaction: '事务'
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
    language: store.preferredLanguage || 'javascript',
    wordBank: store.preferredWordBank || 'cet4',
    wordQueue: [],
    wordIndex: 0,
    wordTotalChars: 0,
    wordCompletedChars: 0,
    wordCompletedTyped: 0,
    wordCompletedCorrect: 0,
    difficulty: 'medium',
    status: 'idle',
    target: '',
    title: '',
    snippetLanguage: 'javascript',
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
    pauseBtn: document.getElementById('pauseBtn'),
    resetBtn: document.getElementById('resetBtn'),
    resetCodeBtn: document.getElementById('resetCodeBtn'),
    soundToggle: document.getElementById('soundToggle'),
    themeToggle: document.getElementById('themeToggle'),
    customModal: document.getElementById('customModal'),
    customText: document.getElementById('customText'),
    wordBankGrid: document.getElementById('wordBankGrid'),
    resourceUrl: document.getElementById('resourceUrl'),
    fetchResourceBtn: document.getElementById('fetchResourceBtn'),
    editCustomBtn: document.getElementById('editCustomBtn'),
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
    document.querySelectorAll('[data-language]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.language === state.language);
    });
    document.querySelectorAll('[data-word-bank]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.wordBank === state.wordBank);
    });
    selectSnippet();
    renderAll();
    console.info('Code Typing Lab v3.0.0 - Train Mode');
}

function applySettings() {
    audioSystem.setEnabled(store.sound);
    dom.soundToggle.textContent = store.sound ? '🔊' : '🔇';

    const theme = store.theme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    dom.themeToggle.textContent = theme === 'light' ? '☀️' : '🌙';
    document.documentElement.style.setProperty('--typing-font-size', `${store.codeFontSize || 24}px`);
    document.documentElement.style.setProperty('--typing-tab-size', String(store.tabSize || 4));

    dom.customText.value = state.customText;
    normalizeDailyStats(store);
}

function bindEvents() {
    document.querySelectorAll('[data-category]').forEach(btn => {
        btn.addEventListener('click', () => setCategory(btn.dataset.category));
    });

    document.querySelectorAll('[data-language]').forEach(btn => {
        btn.addEventListener('click', () => setLanguage(btn.dataset.language));
    });

    document.querySelectorAll('[data-word-bank]').forEach(btn => {
        btn.addEventListener('click', () => setWordBank(btn.dataset.wordBank));
    });

    // 难度选择
    document.querySelectorAll('[data-difficulty]').forEach(btn => {
        btn.addEventListener('click', () => setDifficulty(btn.dataset.difficulty));
    });

    // 操作按钮
    dom.startBtn.addEventListener('click', handlePrimaryAction);
    dom.pauseBtn.addEventListener('click', pauseRound);
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
    dom.editCustomBtn.addEventListener('click', openCustomModal);
    dom.fetchResourceBtn.addEventListener('click', fetchResourceText);

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
function setCategory(mode) {
    if (state.status === 'running') {
        showToast('请先完成或暂停当前训练');
        return;
    }

    state.mode = mode;
    document.querySelectorAll('[data-category]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === mode);
    });

    document.getElementById('languageGrid').classList.toggle('hidden', mode !== 'code');
    dom.wordBankGrid.classList.toggle('hidden', mode !== 'words');
    dom.editCustomBtn.classList.toggle('hidden', mode !== 'custom');

    if (mode === 'custom') {
        if (!state.customText.trim()) {
            openCustomModal();
            return;
        }
    }

    resetRound(true);
}

function setWordBank(wordBank) {
    if (state.status === 'running') {
        showToast('训练中暂时不能切换词库');
        return;
    }

    if (!wordBanks[wordBank]) return;

    state.wordBank = wordBank;
    store.preferredWordBank = wordBank;
    saveStore(store);

    document.querySelectorAll('[data-word-bank]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.wordBank === wordBank);
    });

    resetRound(true);
}

function setLanguage(language) {
    if (state.status === 'running') {
        showToast('训练中暂时不能切换语言');
        return;
    }

    state.language = language;
    store.preferredLanguage = language;
    saveStore(store);

    document.querySelectorAll('[data-language]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.language === language);
    });

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
    setCategory('custom');
    showToast('自定义文本已保存');
}

async function fetchResourceText() {
    const url = dom.resourceUrl.value.trim();
    if (!/^https?:\/\//i.test(url)) {
        showToast('请输入有效的 http/https 地址');
        return;
    }

    dom.fetchResourceBtn.disabled = true;
    dom.fetchResourceBtn.textContent = '导入中';
    try {
        const response = await fetch(url, { mode: 'cors' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = (await response.text()).replace(/\r\n/g, '\n').slice(0, 12000);
        if (!text.trim()) throw new Error('资源内容为空');
        dom.customText.value = text;
        showToast('资源已导入，可编辑后保存');
    } catch (error) {
        showToast('导入失败，请确认资源允许跨域或手动粘贴');
    } finally {
        dom.fetchResourceBtn.disabled = false;
        dom.fetchResourceBtn.textContent = '从 URL 导入';
    }
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
        state.snippetLanguage = 'custom';
        return;
    }

    if (state.mode === 'words') {
        prepareWordRound();
        return;
    }

    const pool = snippets[state.language] || snippets.javascript;
    const limit = difficulty[state.difficulty].max;
    const candidates = pool.filter(item => item.text.length <= limit);
    const source = candidates.length ? candidates : pool;
    const index = Math.floor(Math.random() * source.length);

    state.target = source[index].text;
    state.title = source[index].title;
    state.snippetLanguage = source[index].language || state.language;
}

function prepareWordRound() {
    const bank = wordBanks[state.wordBank] || wordBanks.cet4;
    state.wordQueue = shuffleWords(bank.words);
    state.wordIndex = 0;
    state.wordTotalChars = state.wordQueue.reduce((sum, word) => sum + word.length, 0);
    state.wordCompletedChars = 0;
    state.wordCompletedTyped = 0;
    state.wordCompletedCorrect = 0;
    state.target = state.wordQueue[0] || '';
    state.title = bank.title;
    state.snippetLanguage = 'words';
}

function shuffleWords(words) {
    const copy = [...words];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

// 训练控制
function handlePrimaryAction() {
    if (state.status === 'running') {
        pauseRound();
        return;
    }

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

    if (state.mode === 'words' && state.wordQueue.length === 0) {
        prepareWordRound();
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
    if (state.mode === 'words') {
        state.wordIndex = 0;
        state.wordCompletedChars = 0;
        state.wordCompletedTyped = 0;
        state.wordCompletedCorrect = 0;
        state.target = state.wordQueue[0] || '';
    }

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
    state.wordCompletedChars = 0;
    state.wordCompletedTyped = 0;
    state.wordCompletedCorrect = 0;
    state.wordIndex = 0;
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
    const roundChars = getRoundTargetLength();
    const now = Date.now();
    const previousPlayedDay = store.lastPlayedDay;

    if (previousPlayedDay !== getTodayKey(now)) {
        store.todayChars = 0;
    }

    const oldLevel = getCurrentLevel(store.totalXP);

    store.totalRuns += 1;
    store.bestWpm = Math.max(store.bestWpm, result.wpm);
    store.bestAccuracy = Math.max(store.bestAccuracy, result.accuracy);
    store.todayChars += roundChars;
    store.bestCombo = Math.max(store.bestCombo, state.bestCombo);
    store.maxCharsInSession = Math.max(store.maxCharsInSession, roundChars);

    // 记录评分
    if (result.grade === 'S') {
        store.hasGradeS = true;
    }

    // 记录模式
    const playedMode = getPlayedMode();
    if (!store.modesPlayed) store.modesPlayed = [];
    if (!store.modesPlayed.includes(playedMode)) {
        store.modesPlayed.push(playedMode);
        store.modesCompleted = store.modesPlayed.length;
    }

    // 计算经验值
    const xpGained = calculateXP(result.wpm, result.accuracy, roundChars);
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
        mode: playedMode,
        chars: roundChars,
        grade: result.grade,
        xp: xpGained,
        createdAt: now
    });
    store.history = store.history.slice(0, 20);

    saveStore(store);
    if (store.autoSync) {
        syncLocalStore(store).catch(error => {
            console.warn('Sync failed:', error);
        });
    }

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

function getPlayedMode() {
    if (state.mode === 'custom') return 'custom';
    if (state.mode === 'words') return `words:${state.wordBank}`;
    return state.snippetLanguage;
}

function getRoundTargetLength() {
    if (state.mode === 'words') return state.wordTotalChars || state.target.length;
    return state.target.length;
}

// 输入处理
function handleKeydown(event) {
    if (event.key === 'Enter' && state.status === 'running') {
        event.preventDefault();
        event.stopPropagation();
        if (state.mode === 'words') return;
        insertSmartNewline();
        return;
    }

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

function insertSmartNewline() {
    const input = dom.hiddenInput;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const value = input.value.replace(/\r\n/g, '\n');
    const insertText = getSmartNewlineText(value, state.input.length);

    input.value = `${value.slice(0, start)}${insertText}${value.slice(end)}`;
    input.selectionStart = input.selectionEnd = start + insertText.length;
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

function getSmartNewlineText(value, cursor) {
    const targetIndentText = getTargetNewlineIndentText(cursor);
    if (targetIndentText !== null) return targetIndentText;

    const beforeCursor = value.slice(0, cursor);
    const currentLine = beforeCursor.slice(beforeCursor.lastIndexOf('\n') + 1);
    const baseIndent = currentLine.match(/^[\t ]*/)?.[0] || '';
    const targetIndent = getTargetNextLineIndent(cursor);
    const indentUnit = getIndentUnit(baseIndent || targetIndent || '');
    const shouldIndentBlock = /[{[(]\s*$/.test(currentLine);

    if (targetIndent !== null && (shouldIndentBlock || targetIndent.length >= baseIndent.length)) {
        return `\n${targetIndent}`;
    }

    return `\n${baseIndent}${shouldIndentBlock ? indentUnit : ''}`;
}

function getTargetNewlineIndentText(cursor) {
    if (state.target[cursor] !== '\n') return null;

    let index = cursor + 1;
    while (index < state.target.length && /[\t ]/.test(state.target[index])) {
        index += 1;
    }
    return state.target.slice(cursor, index);
}

function getTargetNextLineIndent(cursor) {
    const targetAfterCursor = state.target.slice(cursor);
    const match = targetAfterCursor.match(/^\n([\t ]*)/);
    return match ? match[1] : null;
}

function getIndentUnit(indentSample) {
    if (indentSample && !indentSample.includes('\t')) {
        return ' '.repeat(store.tabSize || 4);
    }
    return '\t';
}

function handleInput(event) {
    if (state.status !== 'running') return;

    let next = event.target.value.replace(/\r\n/g, '\n');
    const shouldCompleteCurrent = next.length >= state.target.length;
    if (shouldCompleteCurrent) {
        next = next.slice(0, state.target.length);
        event.target.value = next;
    }
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

    if (state.mode === 'words' && shouldCompleteCurrent) {
        advanceWordOrComplete();
    } else if (state.mode !== 'words' && shouldCompleteCurrent) {
        completeRound();
    } else {
        renderAll();
    }
}

function advanceWordOrComplete() {
    state.wordCompletedChars += state.target.length;
    state.wordCompletedTyped += state.input.length;
    state.wordCompletedCorrect += countCorrectChars(state.input, state.target);

    if (state.wordIndex >= state.wordQueue.length - 1) {
        completeRound();
        return;
    }

    state.wordIndex += 1;
    state.target = state.wordQueue[state.wordIndex];
    state.input = '';
    dom.hiddenInput.value = '';
    audioSystem.playKeystroke();
    renderAll();
}

function countCorrectChars(input, target) {
    let correct = 0;
    for (let i = 0; i < input.length; i += 1) {
        if (input[i] === target[i]) correct += 1;
    }
    return correct;
}

function handleGlobalKey(event) {
    if (event.key === 'Escape') {
        if (state.status === 'running') {
            pauseRound();
        } else if (state.status === 'paused') {
            resumeRound();
        }
        return;
    }

    if (event.key === 'Enter') {
        const isTextEditing = document.activeElement === dom.hiddenInput
            || document.activeElement === dom.customText
            || document.activeElement?.tagName === 'INPUT';
        if (state.status === 'running' && isTextEditing) return;
        if (state.status === 'idle' && isTextEditing && document.activeElement !== dom.hiddenInput) return;

        event.preventDefault();
        handlePrimaryAction();
    }
}

// 统计计算
function getStats() {
    const elapsedMs = getElapsedMs();
    const elapsed = Math.max(0, Math.round(elapsedMs / 1000));
    const minutes = Math.max(elapsedMs / 60000, 1 / 60000);
    const inputLength = getInputProgressLength();
    const targetLength = getRoundTargetLength();
    const currentCorrect = countCorrectChars(state.input, state.target);
    const correct = state.mode === 'words'
        ? state.wordCompletedCorrect + currentCorrect
        : currentCorrect;
    const typedLength = state.mode === 'words'
        ? state.wordCompletedTyped + state.input.length
        : inputLength;

    const accuracy = typedLength === 0 ? 100 : Math.max(0, Math.round((correct / typedLength) * 100));
    const wpm = Math.round((correct / 5) / minutes);
    const progress = targetLength === 0 ? 0 : Math.min(100, Math.round((Math.min(inputLength, targetLength) / targetLength) * 100));
    const grade = getGrade(wpm, accuracy, progress);

    return { elapsed, accuracy, wpm, progress, grade, correct };
}

function getInputProgressLength() {
    if (state.mode === 'words') {
        return state.wordCompletedChars + Math.min(state.input.length, state.target.length);
    }
    return Math.min(state.input.length, state.target.length);
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
    dom.codeDisplay.classList.toggle('word-mode', state.mode === 'words');

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

    if (state.mode === 'words') {
        renderWordCode();
        return;
    }

    const syntaxMap = getSyntaxMap(state.target, state.snippetLanguage);
    const html = Array.from(state.target).map((char, index) => {
        let className = 'pending';

        if (index < state.input.length) {
            className = state.input[index] === char ? 'correct' : 'incorrect';
        } else if (index === state.input.length && state.status === 'running') {
            className = 'current';
        }

        const syntaxClass = syntaxMap[index] || '';
        const classes = ['char', className, syntaxClass].filter(Boolean).join(' ');

        if (char === '\n') {
            return `<span class="${classes} newline"></span><br>`;
        }

        if (char === '\t') {
            return `<span class="${classes}"><span class="tab-marker">\t</span></span>`;
        }

        return `<span class="${classes}">${escapeHtml(char)}</span>`;
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

function renderWordCode() {
    const wordHtml = Array.from(state.target).map((char, index) => {
        let className = 'pending';

        if (index < state.input.length) {
            className = state.input[index] === char ? 'correct' : 'incorrect';
        } else if (index === state.input.length && state.status === 'running') {
            className = 'current';
        }

        return `<span class="char ${className}">${escapeHtml(char)}</span>`;
    }).join('');

    dom.codeDisplay.innerHTML = `
        <div class="word-panel">
            <div class="word-text" aria-label="${escapeHtml(state.target)}">${wordHtml}</div>
            <div class="word-meaning">${escapeHtml(getWordMeaning(state.target))}</div>
            <div class="word-step">第 ${state.wordIndex + 1} 个 / 共 ${state.wordQueue.length} 个</div>
        </div>
    `;
}

function getWordMeaning(word) {
    return wordMeanings[String(word || '').toLowerCase()] || '暂无释义';
}

function renderMeta() {
    dom.snippetTitle.textContent = state.title || '选择模式开始';
    if (state.mode === 'words') {
        const bank = wordBanks[state.wordBank] || wordBanks.cet4;
        dom.snippetMeta.textContent = `${bank.title} · ${state.wordIndex + 1}/${state.wordQueue.length || bank.words.length} 词`;
        return;
    }
    const language = languageLabels[state.snippetLanguage] || languageLabels[state.language] || 'Code';
    dom.snippetMeta.textContent = `${language} · ${state.target.length} 字符`;
}

function renderButtons() {
    const buttonText = {
        idle: '开始训练',
        running: '暂停训练',
        paused: '继续训练',
        completed: '下一题'
    };

    dom.startBtn.innerHTML = `
        <span>${buttonText[state.status]}</span>
        <span class="btn-icon">→</span>
    `;
    dom.startBtn.disabled = false;
    dom.pauseBtn.disabled = state.status !== 'running';
    dom.pauseBtn.textContent = state.status === 'running' ? '暂停' : '暂停';
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getSyntaxMap(code, language) {
    const map = Array.from({ length: code.length }, () => '');

    function mark(start, end, className) {
        for (let i = Math.max(0, start); i < Math.min(code.length, end); i += 1) {
            if (!map[i]) map[i] = className;
        }
    }

    function markRegex(regex, className, groupIndex = 0) {
        for (const match of code.matchAll(regex)) {
            const value = match[groupIndex];
            if (!value) continue;
            const offset = match.index + match[0].indexOf(value);
            mark(offset, offset + value.length, className);
        }
    }

    if (language === 'html') {
        markRegex(/<!--[\s\S]*?-->/g, 'syntax-comment');
        markRegex(/<\/?[a-zA-Z][\w:-]*/g, 'syntax-keyword');
        markRegex(/\s([a-zA-Z_:][\w:.-]*)(?=\s*=\s*)/g, 'syntax-property', 1);
        markRegex(/"[^"]*"|'[^']*'/g, 'syntax-string');
        markRegex(/[<>/]/g, 'syntax-operator');
        return map;
    }

    if (language === 'sql') {
        markRegex(/'[^']*'|"[^"]*"/g, 'syntax-string');
        markRegex(/--.*$/gm, 'syntax-comment');
        markRegex(/\b(SELECT|FROM|WHERE|AND|OR|ORDER|BY|GROUP|HAVING|UPDATE|SET|INSERT|INTO|VALUES|DELETE|JOIN|LEFT|RIGHT|INNER|AS|COUNT|AVG|MAX|MIN|DATE|DESC|ASC)\b/gi, 'syntax-keyword');
        markRegex(/\b\d+(?:\.\d+)?\b/g, 'syntax-number');
        markRegex(/[=<>+*?,.-]/g, 'syntax-operator');
        return map;
    }

    markRegex(/\/\/.*$/gm, 'syntax-comment');
    markRegex(/\/\*[\s\S]*?\*\//g, 'syntax-comment');
    markRegex(/`(?:\\.|[^`])*`|"(\\"|[^"])*"|'(\\'|[^'])*'/g, 'syntax-string');
    markRegex(/\b\d+(?:\.\d+)?\b/g, 'syntax-number');

    if (language === 'cpp') {
        markRegex(/#\s*\w+/g, 'syntax-keyword');
        markRegex(/\b(template|typename|class|struct|const|auto|int|double|float|void|bool|char|return|if|else|for|while|nullptr|vector|string|public|private|include|using|namespace)\b/g, 'syntax-keyword');
    } else {
        markRegex(/\b(async|await|function|const|let|var|return|if|else|for|while|switch|case|default|try|catch|throw|new|class|import|from|export)\b/g, 'syntax-keyword');
    }

    markRegex(/\b([A-Za-z_$][\w$]*)(?=\s*\()/g, 'syntax-function', 1);
    markRegex(/[{}()[\].,;:+\-*/%<>=!&|?]/g, 'syntax-operator');
    return map;
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
