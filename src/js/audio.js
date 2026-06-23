/**
 * Advanced Audio System for Code Typing Lab
 * Provides rich audio feedback with volume control and polyphony
 */

class AudioSystem {
    constructor() {
        this.enabled = true;
        this.context = null;
        this.masterGain = null;
        this.volume = 0.3;
        this.sounds = new Map();
        this.initContext();
    }

    initContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) {
                console.warn('Web Audio API not supported');
                return;
            }
            // Context will be created on first user interaction
        } catch (error) {
            console.warn('Failed to initialize audio context:', error);
        }
    }

    ensureContext() {
        if (this.context && this.context.state !== 'closed') {
            return this.context;
        }

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContext();
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.context.destination);

            // Resume context if suspended (common on mobile)
            if (this.context.state === 'suspended') {
                this.context.resume();
            }

            return this.context;
        } catch (error) {
            console.warn('Failed to create audio context:', error);
            return null;
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    isEnabled() {
        return this.enabled;
    }

    /**
     * Play a simple tone
     */
    playTone(frequency, duration = 0.1, waveType = 'sine') {
        if (!this.enabled) return;

        const ctx = this.ensureContext();
        if (!ctx) return;

        try {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.type = waveType;
            oscillator.frequency.value = frequency;

            // Envelope for smooth attack and release
            const now = ctx.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Quick attack
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);

            oscillator.start(now);
            oscillator.stop(now + duration);

            oscillator.onended = () => {
                oscillator.disconnect();
                gainNode.disconnect();
            };
        } catch (error) {
            console.warn('Failed to play tone:', error);
        }
    }

    /**
     * Play correct keystroke sound - pleasant click
     */
    playKeystroke() {
        if (!this.enabled) return;

        const ctx = this.ensureContext();
        if (!ctx) return;

        try {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            oscillator.type = 'sine';
            oscillator.frequency.value = 800;

            filter.type = 'lowpass';
            filter.frequency.value = 2000;

            const now = ctx.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.15, now + 0.005);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.masterGain);

            oscillator.start(now);
            oscillator.stop(now + 0.04);

            oscillator.onended = () => {
                oscillator.disconnect();
                filter.disconnect();
                gainNode.disconnect();
            };
        } catch (error) {
            console.warn('Failed to play keystroke:', error);
        }
    }

    /**
     * Play error sound - low thud
     */
    playError() {
        if (!this.enabled) return;

        const ctx = this.ensureContext();
        if (!ctx) return;

        try {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.type = 'triangle';
            oscillator.frequency.value = 150;

            const now = ctx.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.25, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);

            oscillator.start(now);
            oscillator.stop(now + 0.08);

            oscillator.onended = () => {
                oscillator.disconnect();
                gainNode.disconnect();
            };
        } catch (error) {
            console.warn('Failed to play error:', error);
        }
    }

    /**
     * Play start session sound - ascending chord
     */
    playStart() {
        if (!this.enabled) return;

        const ctx = this.ensureContext();
        if (!ctx) return;

        try {
            const frequencies = [523.25, 659.25, 783.99]; // C, E, G
            const now = ctx.currentTime;

            frequencies.forEach((freq, index) => {
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();

                oscillator.type = 'sine';
                oscillator.frequency.value = freq;

                const startTime = now + index * 0.05;
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

                oscillator.connect(gainNode);
                gainNode.connect(this.masterGain);

                oscillator.start(startTime);
                oscillator.stop(startTime + 0.2);

                oscillator.onended = () => {
                    oscillator.disconnect();
                    gainNode.disconnect();
                };
            });
        } catch (error) {
            console.warn('Failed to play start:', error);
        }
    }

    /**
     * Play completion sound - triumphant fanfare
     */
    playComplete() {
        if (!this.enabled) return;

        const ctx = this.ensureContext();
        if (!ctx) return;

        try {
            const melody = [
                { freq: 523.25, time: 0 },     // C
                { freq: 659.25, time: 0.1 },   // E
                { freq: 783.99, time: 0.2 },   // G
                { freq: 1046.50, time: 0.3 }   // C (higher)
            ];

            const now = ctx.currentTime;

            melody.forEach(note => {
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();

                oscillator.type = 'sine';
                oscillator.frequency.value = note.freq;

                const startTime = now + note.time;
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

                oscillator.connect(gainNode);
                gainNode.connect(this.masterGain);

                oscillator.start(startTime);
                oscillator.stop(startTime + 0.3);

                oscillator.onended = () => {
                    oscillator.disconnect();
                    gainNode.disconnect();
                };
            });
        } catch (error) {
            console.warn('Failed to play complete:', error);
        }
    }

    /**
     * Play combo milestone sound - sparkle
     */
    playComboMilestone(comboLevel) {
        if (!this.enabled) return;

        const ctx = this.ensureContext();
        if (!ctx) return;

        try {
            const baseFreq = 800 + (comboLevel * 100);
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.type = 'sine';

            const now = ctx.currentTime;
            oscillator.frequency.setValueAtTime(baseFreq, now);
            oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 0.15);

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.25, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);

            oscillator.start(now);
            oscillator.stop(now + 0.15);

            oscillator.onended = () => {
                oscillator.disconnect();
                gainNode.disconnect();
            };
        } catch (error) {
            console.warn('Failed to play combo:', error);
        }
    }

    /**
     * Play ambient background for focus mode (optional)
     */
    playAmbient() {
        // Reserved for future ambient sound feature
    }

    /**
     * Clean up resources
     */
    dispose() {
        if (this.context && this.context.state !== 'closed') {
            this.context.close();
        }
        this.sounds.clear();
    }
}

// Export singleton instance
export const audioSystem = new AudioSystem();
