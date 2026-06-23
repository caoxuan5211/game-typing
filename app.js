// CodeMirror 6 导入
import { EditorView, keymap } from 'https://cdn.jsdelivr.net/npm/@codemirror/view@6.23.0/+esm';
import { EditorState } from 'https://cdn.jsdelivr.net/npm/@codemirror/state@6.4.0/+esm';
import { defaultKeymap, indentWithTab } from 'https://cdn.jsdelivr.net/npm/@codemirror/commands@6.3.3/+esm';

// 游戏状态
let currentMode = 'code';
let currentText = '';
let currentIndex = 0;
let startTime = null;
let timerInterval = null;
let totalChars = 0;
let correctChars = 0;
let errorChars = 0;
let isGameActive = false;
let isGameStarted = false;
let editorView = null;

// DOM 元素
const codeDisplay = document.getElementById('codeDisplay');
const editorContainer = document.getElementById('editorContainer');
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
const soundEnabled = true;
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playKeySound(isCorrect) {
    if (!soundEnabled) return;

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
    if (!soundEnabled) return;

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

// 初始化 CodeMirror
function initEditor() {
    const startState = EditorState.create({
        doc: '',
        extensions: [
            keymap.of([
                indentWithTab,  // ✅ 启用 Tab 键缩进
                ...defaultKeymap
            ]),
            EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    handleInput();
                }
            }),
            EditorView.domEventHandlers({
                paste: (e) => {
                    e.preventDefault();
                    return true;
                }
            }),
            EditorView.theme({
                "&": { height: "120px" },
                ".cm-scroller": { overflow: "auto" }
            })
        ]
    });

    editorView = new EditorView({
        state: startState,
        parent: editorContainer
    });

    // 焦点样式
    editorContainer.addEventListener('focusin', () => {
        editorContainer.classList.add('focused');
    });
    editorContainer.addEventListener('focusout', () => {
        editorContainer.classList.remove('focused');
    });
}

// 初始化
function init() {
    initEditor();
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
        if (e.key === 'Enter' && !isGameStarted && !editorView.hasFocus) {
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
    currentIndex = 0;
    totalChars = 0;
    correctChars = 0;
    errorChars = 0;
    startTime = null;
    isGameActive = false;
    isGameStarted = false;

    editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: '' }
    });
    editorView.focus();

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

    renderText();
}

// 开始游戏
function startGame() {
    if (isGameStarted) return;

    isGameStarted = true;
    isGameActive = true;
    startTime = Date.now();
    editorView.focus();
    startBtn.style.display = 'none';

    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        timerDisplay.textContent = `${elapsed}s`;
    }, 100);
}

// 渲染文本显示
function renderText() {
    codeDisplay.innerHTML = '';

    const lines = currentText.split('\n');

    lines.forEach((line, lineIndex) => {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'code-line';

        const lineNumber = document.createElement('span');
        lineNumber.className = 'line-number';
        lineNumber.textContent = lineIndex + 1;

        const lineContent = document.createElement('span');
        lineContent.className = 'line-content';

        let charOffset = lines.slice(0, lineIndex).reduce((sum, l) => sum + l.length + 1, 0);

        for (let i = 0; i < line.length; i++) {
            const globalIndex = charOffset + i;
            const char = line[i];
            const span = document.createElement('span');

            if (char === ' ') {
                span.innerHTML = '&nbsp;';
            } else {
                span.textContent = char;
            }

            const inputValue = editorView.state.doc.toString();
            if (globalIndex < currentIndex) {
                const inputChar = inputValue[globalIndex];
                if (inputChar === char) {
                    span.classList.add('char-correct');
                } else {
                    span.classList.add('char-incorrect');
                }
            } else if (globalIndex === currentIndex) {
                span.classList.add('char-current');
            }

            lineContent.appendChild(span);
        }

        lineDiv.appendChild(lineNumber);
        lineDiv.appendChild(lineContent);
        codeDisplay.appendChild(lineDiv);
    });
}

// 处理输入
function handleInput() {
    if (!isGameActive && !isGameStarted) {
        startGame();
    }

    if (!isGameActive) return;

    const inputValue = editorView.state.doc.toString();
    const newIndex = inputValue.length;

    if (newIndex > currentIndex) {
        const lastChar = inputValue[newIndex - 1];
        const expectedChar = currentText[newIndex - 1];
        playKeySound(lastChar === expectedChar);
    }

    currentIndex = newIndex;

    totalChars = currentIndex;
    correctChars = 0;
    errorChars = 0;

    for (let i = 0; i < currentIndex; i++) {
        if (inputValue[i] === currentText[i]) {
            correctChars++;
        } else {
            errorChars++;
        }
    }

    renderText();
    updateStats();

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

    const accuracy = totalChars > 0
        ? Math.round((correctChars / totalChars) * 100)
        : 100;
    accuracyDisplay.textContent = `${accuracy}%`;

    correctCountDisplay.textContent = correctChars;
    errorCountDisplay.textContent = errorChars;

    const progress = Math.round((currentIndex / currentText.length) * 100);
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${currentIndex} / ${currentText.length}`;
}

// 结束游戏
function endGame() {
    isGameActive = false;
    clearInterval(timerInterval);

    playCompleteSound();

    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const elapsedMinutes = (Date.now() - startTime) / 1000 / 60;
    const words = correctChars / 5;
    const wpm = Math.round(words / elapsedMinutes) || 0;
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

// 启动应用
init();
