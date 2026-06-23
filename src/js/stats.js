/**
 * 统计计算模块
 * @version 1.0.0
 */

export class TypingStats {
    constructor() {
        this.reset();
    }

    reset() {
        this.startTime = null;
        this.endTime = null;
        this.correctChars = 0;
        this.incorrectChars = 0;
        this.totalChars = 0;
        this.corrections = 0;
        this.keystrokes = 0;
        this.lastInputLength = 0;
    }

    start() {
        this.startTime = Date.now();
    }

    stop() {
        this.endTime = Date.now();
    }

    recordInput(currentInput, targetText) {
        if (!this.startTime) {
            this.start();
        }

        this.keystrokes++;

        // 检测删除操作
        if (currentInput.length < this.lastInputLength) {
            this.corrections++;
        }

        this.lastInputLength = currentInput.length;

        // 计算正确和错误字符
        let correct = 0;
        let incorrect = 0;

        for (let i = 0; i < currentInput.length; i++) {
            if (i < targetText.length) {
                if (currentInput[i] === targetText[i]) {
                    correct++;
                } else {
                    incorrect++;
                }
            } else {
                incorrect++;
            }
        }

        this.correctChars = correct;
        this.incorrectChars = incorrect;
        this.totalChars = currentInput.length;
    }

    getElapsedTime() {
        if (!this.startTime) return 0;
        const endTime = this.endTime || Date.now();
        return (endTime - this.startTime) / 1000;
    }

    getWPM() {
        const elapsed = this.getElapsedTime();
        if (elapsed === 0) return 0;

        // 标准: 5个字符 = 1个单词
        const minutes = elapsed / 60;
        const words = this.correctChars / 5;
        return Math.round(words / minutes) || 0;
    }

    getRawWPM() {
        const elapsed = this.getElapsedTime();
        if (elapsed === 0) return 0;

        const minutes = elapsed / 60;
        const words = this.totalChars / 5;
        return Math.round(words / minutes) || 0;
    }

    getAccuracy() {
        if (this.totalChars === 0) return 100;
        return Math.round((this.correctChars / this.totalChars) * 100);
    }

    getCPM() {
        const elapsed = this.getElapsedTime();
        if (elapsed === 0) return 0;

        const minutes = elapsed / 60;
        return Math.round(this.correctChars / minutes) || 0;
    }

    getConsistency() {
        // 击键准确性: 减去更正次数
        if (this.keystrokes === 0) return 100;
        const effectiveKeystrokes = this.keystrokes - this.corrections;
        return Math.round((effectiveKeystrokes / this.keystrokes) * 100);
    }

    getErrorRate() {
        if (this.totalChars === 0) return 0;
        return Math.round((this.incorrectChars / this.totalChars) * 100);
    }

    getSummary(targetText) {
        return {
            time: Math.round(this.getElapsedTime()),
            wpm: this.getWPM(),
            rawWpm: this.getRawWPM(),
            accuracy: this.getAccuracy(),
            cpm: this.getCPM(),
            consistency: this.getConsistency(),
            errorRate: this.getErrorRate(),
            correctChars: this.correctChars,
            incorrectChars: this.incorrectChars,
            totalChars: this.totalChars,
            corrections: this.corrections,
            keystrokes: this.keystrokes,
            characters: targetText.length
        };
    }
}

export class LiveStats {
    constructor(updateCallback) {
        this.updateCallback = updateCallback;
        this.stats = new TypingStats();
        this.updateInterval = null;
    }

    start() {
        this.stats.start();
        this.updateInterval = setInterval(() => {
            if (this.updateCallback) {
                this.updateCallback(this.getCurrentStats());
            }
        }, 100);
    }

    stop() {
        this.stats.stop();
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    reset() {
        this.stop();
        this.stats.reset();
    }

    recordInput(currentInput, targetText) {
        this.stats.recordInput(currentInput, targetText);
    }

    getCurrentStats() {
        return {
            time: this.stats.getElapsedTime(),
            wpm: this.stats.getWPM(),
            accuracy: this.stats.getAccuracy()
        };
    }

    getFinalStats(targetText) {
        return this.stats.getSummary(targetText);
    }
}
