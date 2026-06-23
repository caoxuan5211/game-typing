// 游戏状态
let currentMode = 'code';
let currentText = '';
let startTime = null;
let timerInterval = null;
let correctChars = 0;
let errorChars = 0;
let isGameActive = false;
let isGameStarted = false;

// Monaco编辑器实例
let targetEditor = null;
let inputEditor = null;

// DOM 元素
const wpmValue = document.getElementById('wpm-value');
const accuracyDisplay = document.getElementById('accuracy');
const timerDisplay = document.getElementById('timer');
const correctCountDisplay = document.getElementById('correct-count');
const errorCountDisplay = document.getElementById('error-count');
const progressText = document.getElementById('progress-text');
const progressFill = document.getElementById('progress-fill');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const resultModal = document.getElementById('resultModal');
const modalRestartBtn = document.getElementById('modalRestartBtn');
const modalNextBtn = document.getElementById('modalNextBtn');
const modeBtns = document.querySelectorAll('.mode-btn');

// 音效系统
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playKeySound(isCorrect) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (isCorrect) {
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
    } else {
        oscillator.frequency.value = 200;
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    }

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playCompleteSound() {
    const times = [0, 0.1, 0.2];
    const frequencies = [523.25, 659.25, 783.99];

    times.forEach((time, i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = frequencies[i];
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + time + 0.2);
        oscillator.start(audioContext.currentTime + time);
        oscillator.stop(audioContext.currentTime + time + 0.2);
    });
}

// 初始化Monaco Editor
require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });

require(['vs/editor/editor.main'], function () {
    // 目标代码编辑器（只读）
    targetEditor = monaco.editor.create(document.getElementById('targetEditor'), {
        value: '',
        language: 'javascript',
        theme: 'vs',
        readOnly: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        lineNumbers: 'on',
        automaticLayout: true
    });

    // 输入编辑器
    inputEditor = monaco.editor.create(document.getElementById('inputEditor'), {
        value: '',
        language: 'javascript',
        theme: 'vs-dark',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        lineNumbers: 'on',
        automaticLayout: true,
        tabSize: 4,
        insertSpaces: true
    });

    // 监听输入变化
    inputEditor.onDidChangeModelContent((e) => {
        if (isGameActive) {
            handleInput();
        }
    });

    // 监听键盘事件（用于自动开始）
    inputEditor.onDidFocusEditorText(() => {
        if (!isGameStarted && inputEditor.getValue().length === 0) {
            inputEditor.setValue('');
        }
    });

    // 初始化
    init();
});

// 初始化
function init() {
    loadNewText();
    setupEventListeners();
}

// 设置事件监听
function setupEventListeners() {
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restart);

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
            loadNewText();
        });
    });

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !isGameStarted && document.activeElement !== inputEditor) {
            e.preventDefault();
            startGame();
        }
        if (e.key === 'r' && !isGameActive) {
            e.preventDefault();
            restart();
        }
        if (e.key === 'Escape' && resultModal.classList.contains('show')) {
            hideModal();
        }
    });

    resultModal.addEventListener('click', (e) => {
        if (e.target === resultModal) {
            hideModal();
        }
    });
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
    correctChars = 0;
    errorChars = 0;
    startTime = null;
    isGameActive = false;
    isGameStarted = false;

    if (targetEditor && inputEditor) {
        targetEditor.setValue(currentText);
        inputEditor.setValue('');
        inputEditor.updateOptions({ readOnly: false });
    }

    startBtn.textContent = '▶️ 开始 (Enter)';
    startBtn.style.display = 'inline-flex';

    clearInterval(timerInterval);
    timerDisplay.textContent = '0s';
    wpmValue.textContent = '0';
    accuracyDisplay.textContent = '100%';
    correctCountDisplay.textContent = '0';
    errorCountDisplay.textContent = '0';
    progressText.textContent = `0 / ${currentText.length}`;
    progressFill.style.width = '0%';
}

// 开始游戏
function startGame() {
    if (isGameStarted || !inputEditor) return;

    isGameStarted = true;
    isGameActive = true;
    startTime = Date.now();
    inputEditor.focus();
    startBtn.style.display = 'none';

    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        timerDisplay.textContent = `${elapsed}s`;
    }, 100);
}

// 处理输入
function handleInput() {
    if (!isGameActive) {
        if (!isGameStarted) {
            startGame();
        }
        return;
    }

    const inputValue = inputEditor.getValue();
    const currentIndex = inputValue.length;

    // 计算统计
    correctChars = 0;
    errorChars = 0;

    for (let i = 0; i < currentIndex; i++) {
        if (inputValue[i] === currentText[i]) {
            correctChars++;
        } else {
            errorChars++;
        }
    }

    // 播放音效
    if (currentIndex > 0) {
        const lastChar = inputValue[currentIndex - 1];
        const expectedChar = currentText[currentIndex - 1];
        playKeySound(lastChar === expectedChar);
    }

    updateStats();

    // 检查完成
    if (currentIndex >= currentText.length && inputValue === currentText) {
        endGame();
    }
}

// 更新统计
function updateStats() {
    if (startTime) {
        const elapsedMinutes = (Date.now() - startTime) / 1000 / 60;
        const words = correctChars / 5;
        const wpm = Math.round(words / elapsedMinutes) || 0;
        wpmValue.textContent = wpm;
    }

    const totalChars = correctChars + errorChars;
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;
    accuracyDisplay.textContent = `${accuracy}%`;

    correctCountDisplay.textContent = correctChars;
    errorCountDisplay.textContent = errorChars;

    const progress = Math.round((correctChars / currentText.length) * 100);
    progressFill.style.width = `${Math.min(progress, 100)}%`;
    progressText.textContent = `${correctChars} / ${currentText.length}`;
}

// 结束游戏
function endGame() {
    isGameActive = false;
    clearInterval(timerInterval);
    inputEditor.updateOptions({ readOnly: true });

    playCompleteSound();

    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const elapsedMinutes = (Date.now() - startTime) / 1000 / 60;
    const words = correctChars / 5;
    const wpm = Math.round(words / elapsedMinutes) || 0;
    const totalChars = correctChars + errorChars;
    const accuracy = Math.round((correctChars / totalChars) * 100);

    document.getElementById('finalWpm').textContent = `${wpm} WPM`;
    document.getElementById('finalAccuracy').textContent = `${accuracy}%`;
    document.getElementById('finalTime').textContent = `${elapsedSeconds}s`;
    document.getElementById('finalCounts').textContent = `${correctChars} / ${errorChars}`;

    showModal();
}

// 显示/隐藏模态框
function showModal() {
    resultModal.classList.add('show');
}

function hideModal() {
    resultModal.classList.remove('show');
}
