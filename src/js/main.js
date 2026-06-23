/**
 * 应用入口文件 - 增强版
 * @version 1.0.0
 */

import { TypingGame } from './game.js';
import { VERSION } from './config.js';
import ModalManager from './modal.js';

// 等待DOM加载完成
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    console.log(`%cCode Typing Game v${VERSION}`, 'color: #667eea; font-size: 20px; font-weight: bold;');
    console.log('%c完全模块化重构版本', 'color: #22c55e; font-size: 14px;');

    // 隐藏加载屏幕
    setTimeout(() => {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => {
                loading.style.display = 'none';
            }, 300);
        }
    }, 500);

    // 创建游戏实例
    const game = new TypingGame();
    game.init();

    // ModalManager 已经在 modal.js 中作为单例初始化，不需要再次调用 init()

    // 监听自定义文本设置事件
    window.addEventListener('customTextSet', (e) => {
        game.setCustomText(e.detail.text);
    });

    // 暴露到全局（用于调试）
    window.__TYPING_GAME__ = game;
    window.__MODAL_MANAGER__ = ModalManager;
    console.log('%c🛠️ 调试模式已启用', 'color: #f59e0b; font-size: 12px;');
    console.log('%c游戏实例已创建', 'color: #0f0; font-size: 12px;');
    console.log('%c模态管理器已加载', 'color: #0f0; font-size: 12px;');

    // 性能监控
    if (window.performance && window.performance.timing) {
        window.addEventListener('load', () => {
            const timing = window.performance.timing;
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            console.log(`%c⚡ 页面加载时间: ${loadTime}ms`, 'color: #f59e0b; font-weight: bold;');
        });
    }

    // 添加额外的样式增强
    addAdditionalStyles();
}

function addAdditionalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* 额外的组件样式 */
        .stats-section {
            margin-bottom: 32px;
        }

        .stats-section-title {
            font-size: 20px;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 2px solid var(--border-color);
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
        }

        .achievements-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 16px;
        }

        .achievement-card {
            background: var(--bg-light);
            padding: 20px;
            border-radius: var(--radius-md);
            text-align: center;
            transition: all var(--transition-base);
            position: relative;
        }

        .achievement-card.locked {
            opacity: 0.5;
            filter: grayscale(100%);
        }

        .achievement-card.unlocked {
            background: linear-gradient(135deg, #fff5e6 0%, #ffffff 100%);
            border: 2px solid #ffd700;
        }

        .achievement-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-md);
        }

        .achievement-card-icon {
            font-size: 48px;
            margin-bottom: 12px;
        }

        .achievement-card-name {
            font-size: 16px;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 8px;
        }

        .achievement-card-description {
            font-size: 12px;
            color: var(--text-secondary);
        }

        .achievement-badge {
            position: absolute;
            top: 8px;
            right: 8px;
            background: var(--success-color);
            color: white;
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 12px;
            font-weight: 600;
        }

        .stats-actions {
            margin-top: 32px;
            text-align: center;
        }

        .empty-state {
            text-align: center;
            padding: 40px;
            color: var(--text-secondary);
            font-size: 14px;
        }

        @media (max-width: 768px) {
            .stats-grid {
                grid-template-columns: 1fr;
            }

            .achievements-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    `;
    document.head.appendChild(style);
}
