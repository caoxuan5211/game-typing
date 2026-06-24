/**
 * 登录认证逻辑
 */

import { API_BASE, route, saveAuthSession, syncLocalStore } from './shell.js?v=20260624-7';
import { loadStore } from './storage.js';

const dom = {
    emailStep: document.getElementById('emailStep'),
    codeStep: document.getElementById('codeStep'),
    emailInput: document.getElementById('emailInput'),
    codeInput: document.getElementById('codeInput'),
    sentEmail: document.getElementById('sentEmail'),
    sendCodeBtn: document.getElementById('sendCodeBtn'),
    verifyBtn: document.getElementById('verifyBtn'),
    backBtn: document.getElementById('backBtn'),
    resendBtn: document.getElementById('resendBtn'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    toast: document.getElementById('toast')
};

let resendTimer = null;
let resendSeconds = 60;

// 初始化
async function init() {
    // 检查是否已登录
    const token = localStorage.getItem('auth_token');
    if (token) {
        try {
            const response = await fetch(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                window.location.href = route('/train');
                return;
            }
        } catch (error) {
            console.warn('Token check failed:', error);
        }
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_profile');
    }

    bindEvents();
}

function bindEvents() {
    // 发送验证码
    dom.sendCodeBtn.addEventListener('click', handleSendCode);

    // 验证码登录
    dom.verifyBtn.addEventListener('click', handleVerify);

    // 返回
    dom.backBtn.addEventListener('click', () => {
        dom.codeStep.classList.add('hidden');
        dom.emailStep.classList.remove('hidden');
        dom.codeInput.value = '';
    });

    // 重新发送
    dom.resendBtn.addEventListener('click', handleResend);

    // Enter 键提交
    dom.emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendCode();
    });

    dom.codeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleVerify();
    });

    // 自动格式化验证码输入
    dom.codeInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });
}

// 发送验证码
async function handleSendCode() {
    const email = dom.emailInput.value.trim();

    if (!email) {
        showToast('请输入邮箱地址');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('邮箱格式不正确');
        return;
    }

    showLoading(true);
    dom.sendCodeBtn.disabled = true;
    dom.sendCodeBtn.textContent = '发送中...';

    try {
        const response = await fetch(`${API_BASE}/auth/send-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '发送失败');
        }

        // 切换到验证码输入步骤
        dom.sentEmail.textContent = email;
        dom.emailStep.classList.add('hidden');
        dom.codeStep.classList.remove('hidden');
        dom.codeInput.focus();

        showToast('验证码已发送，请查收邮件');
        startResendTimer();
    } catch (error) {
        console.error('Send code error:', error);
        showToast(error.message || '发送验证码失败，请稍后重试');
    } finally {
        showLoading(false);
        dom.sendCodeBtn.disabled = false;
        dom.sendCodeBtn.textContent = '获取验证码';
    }
}

// 验证码登录
async function handleVerify() {
    const email = dom.emailInput.value.trim();
    const code = dom.codeInput.value.trim();

    if (!code || code.length !== 6) {
        showToast('请输入6位验证码');
        return;
    }

    showLoading(true);
    dom.verifyBtn.disabled = true;
    dom.verifyBtn.textContent = '登录中...';

    try {
        const response = await fetch(`${API_BASE}/auth/verify-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '登录失败');
        }

        saveAuthSession(data);

        try {
            await syncLocalStore(loadStore());
            showToast('登录成功，本地数据已同步');
        } catch (syncError) {
            console.warn('Initial sync failed:', syncError);
            showToast('登录成功，本地数据稍后可在个人页同步');
        }

        // 跳转到训练页面
        setTimeout(() => {
            window.location.href = route('/train');
        }, 500);
    } catch (error) {
        console.error('Verify error:', error);
        showToast(error.message || '登录失败，请稍后重试');
        dom.codeInput.value = '';
        dom.codeInput.focus();
    } finally {
        showLoading(false);
        dom.verifyBtn.disabled = false;
        dom.verifyBtn.textContent = '登录';
    }
}

// 重新发送验证码
async function handleResend() {
    if (resendTimer) {
        return; // 倒计时中，不允许重发
    }

    const email = dom.emailInput.value.trim();
    await handleSendCodeInternal(email);
}

async function handleSendCodeInternal(email) {
    showLoading(true);

    try {
        const response = await fetch(`${API_BASE}/auth/send-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '发送失败');
        }

        showToast('验证码已重新发送');
        startResendTimer();
    } catch (error) {
        console.error('Resend error:', error);
        showToast(error.message || '发送验证码失败');
    } finally {
        showLoading(false);
    }
}

// 重发倒计时
function startResendTimer() {
    resendSeconds = 60;
    dom.resendBtn.disabled = true;
    dom.resendBtn.textContent = `${resendSeconds}s后重新发送`;

    resendTimer = setInterval(() => {
        resendSeconds--;
        dom.resendBtn.textContent = `${resendSeconds}s后重新发送`;

        if (resendSeconds <= 0) {
            clearInterval(resendTimer);
            resendTimer = null;
            dom.resendBtn.disabled = false;
            dom.resendBtn.textContent = '重新发送';
        }
    }, 1000);
}

// Loading 遮罩
function showLoading(show) {
    dom.loadingOverlay.classList.add('hidden');
}

// Toast 通知
function showToast(message) {
    dom.toast.textContent = message;
    dom.toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
        dom.toast.classList.remove('show');
    }, 3000);
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
