import { setGuestMode, isGuestMode } from './storage.js?v=20260624-10';

const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_EMAIL_KEY = 'user_email';
const AUTH_USER_KEY = 'user_profile';
const PROMPT_SEEN_KEY = 'auth_prompt_seen';
const API_TIMEOUT_MS = 12000;
const PROFILE_REFRESH_MIN_MS = 30000;

let lastProfileRefreshAt = 0;

export const API_BASE = isLocalHost
    ? 'http://localhost:3001/api'
    : `${window.location.origin}/api`;

export function route(path) {
    if (isLocalHost) {
        const localMap = {
            '/': 'index.html',
            '/home': 'index.html',
            '/train': 'train.html',
            '/stats': 'stats.html',
            '/profile': 'profile.html',
            '/login': 'login.html'
        };
        return localMap[path] || path;
    }
    return path;
}

export function getAuthState() {
    const user = safeJson(localStorage.getItem(AUTH_USER_KEY), null);
    return {
        token: localStorage.getItem(AUTH_TOKEN_KEY) || '',
        email: localStorage.getItem(AUTH_EMAIL_KEY) || '',
        user,
        guest: isGuestMode()
    };
}

export function saveAuthSession(data) {
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    localStorage.setItem(AUTH_EMAIL_KEY, data.user.email);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    setGuestMode(false);
    sessionStorage.setItem(PROMPT_SEEN_KEY, '1');
    dispatchAuthChanged('login');
}

export function clearAuthSession() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_EMAIL_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    lastProfileRefreshAt = 0;
    dispatchAuthChanged('logout');
}

export function enterGuestMode() {
    clearAuthSession();
    setGuestMode(true);
    sessionStorage.setItem(PROMPT_SEEN_KEY, '1');
    dispatchAuthChanged('guest');
}

export async function apiRequest(path, options = {}) {
    const { timeoutMs = API_TIMEOUT_MS, ...requestOptions } = options;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    const headers = {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
    };

    const { token } = getAuthState();
    if (token) headers.Authorization = `Bearer ${token}`;

    let response;
    let data;

    try {
        response = await fetch(`${API_BASE}${path}`, {
            ...requestOptions,
            headers,
            signal: controller.signal,
            body: requestOptions.body && typeof requestOptions.body !== 'string'
                ? JSON.stringify(requestOptions.body)
                : requestOptions.body
        });
        data = await response.json().catch(() => ({}));
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('请求超时，请检查网络后重试');
        }
        throw new Error('网络连接失败，请稍后重试');
    } finally {
        window.clearTimeout(timeout);
    }

    if (!response.ok) {
        throw new Error(data.error || '请求失败');
    }
    return data;
}

export async function refreshCurrentUser() {
    const { token } = getAuthState();
    if (!token) return null;

    try {
        const data = await apiRequest('/auth/me');
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
        localStorage.setItem(AUTH_EMAIL_KEY, data.user.email);
        lastProfileRefreshAt = Date.now();
        dispatchAuthChanged('refresh');
        return data.user;
    } catch (error) {
        clearAuthSession();
        return null;
    }
}

export function updateStoredUser(user) {
    if (!user) return;
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_EMAIL_KEY, user.email);
    lastProfileRefreshAt = Date.now();
    dispatchAuthChanged('profile');
}

export function initNavAuth() {
    const { token, email, user, guest } = getAuthState();
    updatePrettyLinks();

    document.querySelectorAll('.nav-actions a[href$="login.html"], .nav-actions a[href="/login"], .nav-auth-link')
        .forEach(authLink => {
            authLink.classList.add('nav-auth-link');
            if (!authLink.dataset.authBound) {
                authLink.dataset.authBound = '1';
                authLink.addEventListener('click', event => {
                    if (!getAuthState().token) {
                        event.preventDefault();
                        openAuthModal('login');
                    }
                });
            }

            if (token) {
                const name = user?.displayName || email.split('@')[0] || '个人';
                const avatar = user?.avatar || '';
                authLink.href = route('/profile');
                authLink.title = user?.email || email || '个人中心';
                authLink.innerHTML = `
                    <span class="nav-user-avatar">${avatar ? `<img src="${avatar}" alt="">` : escapeHtml(name.slice(0, 1).toUpperCase())}</span>
                    <span class="nav-user-name">${escapeHtml(name)}</span>
                `;
            } else if (guest) {
                authLink.href = '#login';
                authLink.innerHTML = '<span>游客</span>';
                authLink.title = '游客模式';
            } else {
                authLink.href = '#login';
                authLink.textContent = '登录';
                authLink.title = '登录';
            }
        });

    document.querySelectorAll('[data-auth-action="open"]').forEach(button => {
        if (button.dataset.authBound) return;
        button.dataset.authBound = '1';
        button.addEventListener('click', event => {
            event.preventDefault();
            openAuthModal('login');
        });
    });
}

export async function syncLocalStore(store) {
    const { token, guest } = getAuthState();
    if (!token || guest) return { skipped: true };
    return apiRequest('/user/sync', {
        method: 'POST',
        body: { stats: store, history: store.history || [] }
    });
}

export function openAuthModal(mode = 'login') {
    const modal = ensureAuthModal();
    modal.hidden = false;
    document.body.classList.add('auth-modal-open');
    setAuthMode(mode);
    const firstInput = modal.querySelector(mode === 'register' ? '#authRegisterEmail' : '#authLoginEmail');
    firstInput?.focus();
}

export function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('auth-modal-open');
    sessionStorage.setItem(PROMPT_SEEN_KEY, '1');
}

function ensureAuthModal() {
    let modal = document.getElementById('authModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'auth-modal-shell';
    modal.hidden = true;
    modal.innerHTML = `
        <div class="auth-modal-backdrop" data-auth-close></div>
        <section class="auth-modal-card" role="dialog" aria-modal="true" aria-labelledby="authModalTitle">
            <button class="auth-modal-close" type="button" title="关闭" data-auth-close>×</button>
            <div class="auth-modal-brand">
                <div class="brand-mark">CT</div>
                <div>
                    <h2 id="authModalTitle">进入 Code Typing Lab</h2>
                    <p>登录后云端同步；游客模式只保留本次会话数据。</p>
                </div>
            </div>
            <div class="auth-tabs" role="tablist">
                <button class="auth-tab active" type="button" data-auth-mode="login">账号登录</button>
                <button class="auth-tab" type="button" data-auth-mode="register">注册账号</button>
            </div>
            <form class="auth-pane" id="authLoginPane" data-auth-pane="login">
                <label>邮箱
                    <input id="authLoginEmail" type="email" autocomplete="email" required placeholder="your@email.com">
                </label>
                <label>密码
                    <input id="authLoginPassword" type="password" autocomplete="current-password" required placeholder="至少 8 位">
                </label>
                <button class="btn btn-primary btn-block" type="submit">登录</button>
            </form>
            <form class="auth-pane hidden" id="authRegisterPane" data-auth-pane="register">
                <label>邮箱
                    <input id="authRegisterEmail" type="email" autocomplete="email" required placeholder="your@email.com">
                </label>
                <label>账户名
                    <input id="authRegisterName" type="text" autocomplete="nickname" maxlength="32" placeholder="显示在右上角">
                </label>
                <label>密码
                    <input id="authRegisterPassword" type="password" autocomplete="new-password" minlength="8" required placeholder="至少 8 位">
                </label>
                <label>验证码
                    <div class="auth-code-row">
                        <input id="authRegisterCode" type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code" required placeholder="000000">
                        <button class="btn btn-secondary" id="authSendCode" type="button">发送验证码</button>
                    </div>
                </label>
                <button class="btn btn-primary btn-block" type="submit">注册并登录</button>
            </form>
            <div class="auth-modal-footer">
                <button class="link-button" type="button" id="authGuestBtn">游客进入</button>
                <span id="authModalMessage" aria-live="polite"></span>
            </div>
        </section>
    `;
    document.body.appendChild(modal);

    modal.querySelectorAll('[data-auth-close]').forEach(item => {
        item.addEventListener('click', closeAuthModal);
    });
    modal.querySelectorAll('[data-auth-mode]').forEach(button => {
        button.addEventListener('click', () => setAuthMode(button.dataset.authMode));
    });
    modal.querySelector('#authLoginPane').addEventListener('submit', handlePasswordLogin);
    modal.querySelector('#authRegisterPane').addEventListener('submit', handleRegister);
    modal.querySelector('#authSendCode').addEventListener('click', handleSendRegisterCode);
    modal.querySelector('#authGuestBtn').addEventListener('click', () => {
        enterGuestMode();
        closeAuthModal();
        showAuthMessage('已进入游客模式');
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !modal.hidden) closeAuthModal();
    });
    return modal;
}

function setAuthMode(mode) {
    const modal = ensureAuthModal();
    modal.querySelectorAll('[data-auth-mode]').forEach(button => {
        button.classList.toggle('active', button.dataset.authMode === mode);
    });
    modal.querySelectorAll('[data-auth-pane]').forEach(pane => {
        pane.classList.toggle('hidden', pane.dataset.authPane !== mode);
    });
    showAuthMessage('');
}

async function handlePasswordLogin(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    setButtonBusy(button, true, '登录中');

    try {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: {
                email: form.querySelector('#authLoginEmail').value,
                password: form.querySelector('#authLoginPassword').value
            }
        });
        saveAuthSession(data);
        closeAuthModal();
        initNavAuth();
        refreshCurrentUser().catch(error => console.warn('Profile refresh failed:', error));
    } catch (error) {
        showAuthMessage(error.message);
    } finally {
        setButtonBusy(button, false, '登录');
    }
}

async function handleSendRegisterCode() {
    const modal = ensureAuthModal();
    const email = modal.querySelector('#authRegisterEmail').value;
    const button = modal.querySelector('#authSendCode');
    setButtonBusy(button, true, '发送中');

    try {
        await apiRequest('/auth/send-code', {
            method: 'POST',
            body: { email }
        });
        showAuthMessage('验证码已发送，请查收邮箱');
        startCodeCountdown(button);
    } catch (error) {
        showAuthMessage(error.message);
        setButtonBusy(button, false, '发送验证码');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    setButtonBusy(button, true, '注册中');

    try {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: {
                email: form.querySelector('#authRegisterEmail').value,
                displayName: form.querySelector('#authRegisterName').value,
                password: form.querySelector('#authRegisterPassword').value,
                code: form.querySelector('#authRegisterCode').value
            }
        });
        saveAuthSession(data);
        closeAuthModal();
        initNavAuth();
        refreshCurrentUser().catch(error => console.warn('Profile refresh failed:', error));
    } catch (error) {
        showAuthMessage(error.message);
    } finally {
        setButtonBusy(button, false, '注册并登录');
    }
}

function startCodeCountdown(button) {
    let seconds = 60;
    button.disabled = true;
    button.textContent = `${seconds}s`;
    const timer = setInterval(() => {
        seconds -= 1;
        button.textContent = `${seconds}s`;
        if (seconds <= 0) {
            clearInterval(timer);
            button.disabled = false;
            button.textContent = '发送验证码';
        }
    }, 1000);
}

function setButtonBusy(button, busy, text) {
    if (!button) return;
    button.disabled = busy;
    button.textContent = text;
    button.classList.toggle('is-busy', busy);
}

function showAuthMessage(message) {
    const target = document.getElementById('authModalMessage');
    if (target) target.textContent = message;
}

function updatePrettyLinks() {
    const map = new Map([
        ['/', route('/')],
        ['/train', route('/train')],
        ['/stats', route('/stats')],
        ['/profile', route('/profile')],
        ['/login', route('/login')],
        ['index.html', route('/')],
        ['train.html', route('/train')],
        ['stats.html', route('/stats')],
        ['profile.html', route('/profile')],
        ['login.html', route('/login')]
    ]);

    document.querySelectorAll('a[href]').forEach(link => {
        const next = map.get(link.getAttribute('href'));
        if (next) link.setAttribute('href', next);
    });
}

function dispatchAuthChanged(reason) {
    window.dispatchEvent(new CustomEvent('auth:changed', { detail: { reason } }));
}

function refreshUserIfStale() {
    const { token } = getAuthState();
    if (!token) return;
    if (Date.now() - lastProfileRefreshAt < PROFILE_REFRESH_MIN_MS) return;
    refreshCurrentUser().catch(error => console.warn('Profile refresh failed:', error));
}

function trackPageView() {
    const path = `${window.location.pathname}${window.location.search}`;
    apiRequest('/events/visit', {
        method: 'POST',
        body: {
            path,
            title: document.title,
            referrer: document.referrer || ''
        },
        timeoutMs: 5000
    }).catch(() => {});
}

function maybePromptFirstVisit() {
    const { token, guest } = getAuthState();
    if (token || guest || sessionStorage.getItem(PROMPT_SEEN_KEY)) return;
    if (location.pathname.endsWith('/login.html') || location.pathname.endsWith('/login')) return;
    window.setTimeout(() => openAuthModal('login'), 500);
}

function safeJson(value, fallback) {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function bootShell() {
    initNavAuth();
    ensureAuthModal();
    refreshUserIfStale();
    trackPageView();
    maybePromptFirstVisit();
    window.addEventListener('auth:changed', initNavAuth);
    window.addEventListener('focus', refreshUserIfStale);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') refreshUserIfStale();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootShell);
} else {
    bootShell();
}
