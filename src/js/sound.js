/**
 * 音效管理模块
 * @version 1.0.0
 */

class SoundManager {
    constructor() {
        this.enabled = true;
        this.volume = 0.3;
        this.audioContext = null;
        this.gainNode = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.gain.value = this.volume;
            this.initialized = true;
        } catch (e) {
            console.warn('Audio context not supported:', e);
            this.enabled = false;
        }
    }

    // 生成音调
    playTone(frequency, duration, type = 'sine') {
        if (!this.enabled || !this.initialized) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = type;
            oscillator.frequency.value = frequency;

            oscillator.connect(this.gainNode);
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.warn('Sound play error:', e);
        }
    }

    // 正确输入音效
    playCorrect() {
        this.playTone(800, 0.05, 'sine');
    }

    // 错误输入音效
    playIncorrect() {
        this.playTone(200, 0.1, 'sawtooth');
    }

    // 完成音效
    playComplete() {
        const notes = [523, 659, 784, 1047]; // C-E-G-C
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.2, 'triangle');
            }, i * 100);
        });
    }

    // 开始音效
    playStart() {
        this.playTone(440, 0.15, 'square');
        setTimeout(() => {
            this.playTone(554, 0.15, 'square');
        }, 150);
    }

    // 成就解锁音效
    playAchievement() {
        const melody = [659, 784, 880, 1047, 1319];
        melody.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.15, 'sine');
            }, i * 80);
        });
    }

    // 按键音效
    playKeyPress() {
        if (!this.enabled || !this.initialized) return;
        const frequencies = [400, 450, 500, 550, 600];
        const randomFreq = frequencies[Math.floor(Math.random() * frequencies.length)];
        this.playTone(randomFreq, 0.03, 'sine');
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.gainNode) {
            this.gainNode.gain.value = this.volume;
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

export default new SoundManager();
