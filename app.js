// 游戏状态
let mode = 'code';
let currentText = '';
let startTime = null;
let timer = null;
let isStarted = false;

// DOM元素
const codeDisplay = document.getElementById('codeDisplay');
const input = document.getElementById('input');
const timerEl = document.getElementById('timer');
const wpmEl = document.getElementById('wpm');
const accuracyEl = document.getElementById('accuracy');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const modal = document.getElementById('modal');
const restartBtn = document.getElementById('restartBtn');
const modeBtns = document.querySelectorAll('.mode-btn');

// 初始化
function init() {
    loadText();
    setupEvents();
}

// 加载文本
function loadText() {
    let pool = codeSnippets;
    if (mode === 'symbols') pool = symbolPractice;
    if (mode === 'mixed') pool = mixedContent;

    currentText = pool[Math.floor(Math.random() * pool.length)];
    renderText();
}

// 渲染文本
function renderText() {
    const inputValue = input.value;
    let html = '';

    for (let i = 0; i < currentText.length; i++) {
        const char = currentText[i];
        let className = '';

        if (i < inputValue.length) {
            className = inputValue[i] === char ? 'correct' : 'incorrect';
        } else if (i === inputValue.length) {
            className = 'current';
        }

        html += `<span class="${className}">${char === ' ' ? '&nbsp;' : char}</span>`;
    }

    codeDisplay.innerHTML = html;
}

// 更新统计
function updateStats() {
    const inputValue = input.value;
    let correct = 0;

    for (let i = 0; i < inputValue.length; i++) {
        if (inputValue[i] === currentText[i]) correct++;
    }

    const accuracy = inputValue.length ? Math.round((correct / inputValue.length) * 100) : 100;
    accuracyEl.textContent = accuracy + '%';

    if (startTime) {
        const elapsed = (Date.now() - startTime) / 1000 / 60;
        const wpm = Math.round((correct / 5) / elapsed) || 0;
        wpmEl.textContent = wpm + ' WPM';
    }
}

// 检查完成
function checkComplete() {
    if (input.value === currentText) {
        finish();
    }
}

// 完成
function finish() {
    clearInterval(timer);
    input.disabled = true;

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('finalTime').textContent = elapsed;
    document.getElementById('finalWpm').textContent = wpmEl.textContent.replace(' WPM', '');
    document.getElementById('finalAccuracy').textContent = accuracyEl.textContent.replace('%', '');

    modal.classList.add('show');
}

// 开始
function start() {
    if (isStarted) return;

    isStarted = true;
    startTime = Date.now();
    input.disabled = false;
    input.focus();
    startBtn.textContent = '进行中...';
    startBtn.disabled = true;

    timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        timerEl.textContent = elapsed + 's';
    }, 100);
}

// 重置
function reset() {
    clearInterval(timer);
    isStarted = false;
    startTime = null;
    input.value = '';
    input.disabled = true;
    startBtn.textContent = '开始练习';
    startBtn.disabled = false;
    timerEl.textContent = '0s';
    wpmEl.textContent = '0 WPM';
    accuracyEl.textContent = '100%';
    modal.classList.remove('show');
    loadText();
}

// 设置事件
function setupEvents() {
    startBtn.addEventListener('click', start);
    resetBtn.addEventListener('click', reset);
    restartBtn.addEventListener('click', reset);

    input.addEventListener('input', () => {
        renderText();
        updateStats();
        checkComplete();
    });

    input.addEventListener('paste', e => e.preventDefault());

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            mode = btn.dataset.mode;
            reset();
        });
    });

    modal.addEventListener('click', e => {
        if (e.target === modal) modal.classList.remove('show');
    });
}

// 启动
init();
