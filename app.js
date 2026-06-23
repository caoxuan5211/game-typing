// 游戏状态
let currentMode = 'code';
let currentText = '';
let currentIndex = 0;
let startTime = null;
let timerInterval = null;
let totalChars = 0;
let correctChars = 0;
let isGameActive = false;

// DOM 元素
const textDisplay = document.getElementById('textDisplay');
const textInput = document.getElementById('textInput');
const wpmDisplay = document.getElementById('wpm');
const accuracyDisplay = document.getElementById('accuracy');
const timerDisplay = document.getElementById('timer');
const modeDisplay = document.getElementById('mode-display');
const restartBtn = document.getElementById('restartBtn');
const nextBtn = document.getElementById('nextBtn');
const resultModal = document.getElementById('resultModal');
const modalRestartBtn = document.getElementById('modalRestartBtn');
const modalNextBtn = document.getElementById('modalNextBtn');
const modeBtns = document.querySelectorAll('.mode-btn');

// 初始化
function init() {
    loadNewText();
    setupEventListeners();
}

// 设置事件监听
function setupEventListeners() {
    textInput.addEventListener('input', handleInput);
    textInput.addEventListener('paste', (e) => e.preventDefault());
    restartBtn.addEventListener('click', restart);
    nextBtn.addEventListener('click', loadNewText);
    modalRestartBtn.addEventListener('click', () => {
        hideModal();
        restart();
    });
    modalNextBtn.addEventListener('click', () => {
        hideModal();
        loadNewText();
    });

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            updateModeDisplay();
            loadNewText();
        });
    });
}

// 更新模式显示
function updateModeDisplay() {
    const modeNames = {
        'code': '代码片段',
        'symbols': '符号练习',
        'mixed': '混合模式'
    };
    modeDisplay.textContent = modeNames[currentMode];
}

// 加载新文本
function loadNewText() {
    let textPool;
    switch(currentMode) {
        case 'code':
            textPool = codeSnippets;
            break;
        case 'symbols':
            textPool = symbolPractice;
            break;
        case 'mixed':
            textPool = mixedContent;
            break;
        default:
            textPool = codeSnippets;
    }

    const randomIndex = Math.floor(Math.random() * textPool.length);
    currentText = textPool[randomIndex];

    restart();
}

// 重新开始
function restart() {
    currentIndex = 0;
    totalChars = 0;
    correctChars = 0;
    startTime = null;
    isGameActive = false;

    textInput.value = '';
    textInput.disabled = false;
    textInput.focus();

    clearInterval(timerInterval);
    timerDisplay.textContent = '0s';
    wpmDisplay.textContent = '0';
    accuracyDisplay.textContent = '100%';

    renderText();
}

// 渲染文本显示
function renderText() {
    textDisplay.innerHTML = '';

    for (let i = 0; i < currentText.length; i++) {
        const char = currentText[i];
        const span = document.createElement('span');

        if (char === '\n') {
            span.innerHTML = '<br>';
        } else if (char === ' ') {
            span.innerHTML = '&nbsp;';
        } else {
            span.textContent = char;
        }

        if (i < currentIndex) {
            const inputChar = textInput.value[i];
            if (inputChar === char) {
                span.classList.add('correct');
            } else {
                span.classList.add('incorrect');
            }
        } else if (i === currentIndex) {
            span.classList.add('current');
        }

        textDisplay.appendChild(span);
    }
}

// 处理输入
function handleInput(e) {
    if (!isGameActive) {
        startGame();
    }

    const inputValue = textInput.value;
    currentIndex = inputValue.length;

    // 计算统计数据
    totalChars = currentIndex;
    correctChars = 0;

    for (let i = 0; i < currentIndex; i++) {
        if (inputValue[i] === currentText[i]) {
            correctChars++;
        }
    }

    renderText();
    updateStats();

    // 检查是否完成
    if (currentIndex >= currentText.length && inputValue === currentText) {
        endGame();
    }
}

// 开始游戏
function startGame() {
    isGameActive = true;
    startTime = Date.now();

    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        timerDisplay.textContent = `${elapsed}s`;
    }, 100);
}

// 更新统计
function updateStats() {
    // 计算 WPM (每分钟字数)
    if (startTime) {
        const elapsedMinutes = (Date.now() - startTime) / 1000 / 60;
        const words = correctChars / 5; // 标准：5个字符 = 1个词
        const wpm = Math.round(words / elapsedMinutes) || 0;
        wpmDisplay.textContent = wpm;
    }

    // 计算准确率
    const accuracy = totalChars > 0
        ? Math.round((correctChars / totalChars) * 100)
        : 100;
    accuracyDisplay.textContent = `${accuracy}%`;
}

// 结束游戏
function endGame() {
    isGameActive = false;
    clearInterval(timerInterval);
    textInput.disabled = true;

    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const elapsedMinutes = (Date.now() - startTime) / 1000 / 60;
    const words = correctChars / 5;
    const wpm = Math.round(words / elapsedMinutes) || 0;
    const accuracy = Math.round((correctChars / totalChars) * 100);

    // 显示结果模态框
    document.getElementById('finalWpm').textContent = `${wpm} WPM`;
    document.getElementById('finalAccuracy').textContent = `${accuracy}%`;
    document.getElementById('finalTime').textContent = `${elapsedSeconds}s`;

    showModal();
}

// 显示/隐藏模态框
function showModal() {
    resultModal.classList.add('show');
}

function hideModal() {
    resultModal.classList.remove('show');
}

// 点击模态框外部关闭
resultModal.addEventListener('click', (e) => {
    if (e.target === resultModal) {
        hideModal();
    }
});

// ESC 键关闭模态框
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && resultModal.classList.contains('show')) {
        hideModal();
    }
});

// 启动应用
init();
