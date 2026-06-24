const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const API_BASE = isLocalHost
    ? 'http://localhost:3001/api'
    : `${window.location.origin}/api`;

export function getAuthState() {
    return {
        token: localStorage.getItem('auth_token') || '',
        email: localStorage.getItem('user_email') || ''
    };
}

export function initNavAuth() {
    const { token, email } = getAuthState();
    const authLink = document.querySelector('.nav-actions a[href="login.html"], .nav-auth-link');
    const profileLink = document.querySelector('.nav-link[href="profile.html"]');

    if (profileLink) {
        profileLink.hidden = false;
    }

    if (!authLink) return;

    authLink.classList.add('nav-auth-link');
    if (token) {
        authLink.href = 'profile.html';
        authLink.textContent = email ? email.split('@')[0] : '个人';
        authLink.title = email || '个人中心';
    } else {
        authLink.href = 'login.html';
        authLink.textContent = '登录';
        authLink.title = '登录';
    }
}

export async function syncLocalStore(store) {
    const { token } = getAuthState();
    if (!token) return { skipped: true };

    const response = await fetch(`${API_BASE}/user/sync`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ stats: store, history: store.history || [] })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || '同步失败');
    }
    return data;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavAuth);
} else {
    initNavAuth();
}
