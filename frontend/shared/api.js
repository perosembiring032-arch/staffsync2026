// Shared API utility
const API_BASE = '/api';

const api = {
  token: null,

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('staffsync_token', token);
    } else {
      localStorage.removeItem('staffsync_token');
    }
  },

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('staffsync_token');
    }
    return this.token;
  },

  getUser() {
    const u = localStorage.getItem('staffsync_user');
    return u ? JSON.parse(u) : null;
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('staffsync_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('staffsync_user');
    }
  },

  logout() {
    this.setToken(null);
    this.setUser(null);
    window.location.href = '/';
  },

  async request(method, path, body = null) {
    const token = this.getToken();
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json();

    if (res.status === 401) {
      this.logout();
      return data;
    }

    return { ...data, _status: res.status };
  },

  get: (path) => api.request('GET', path),
  post: (path, body) => api.request('POST', path, body),
  put: (path, body) => api.request('PUT', path, body),
  delete: (path) => api.request('DELETE', path),
};

// Toast notification system
const toast = {
  show(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container') || this._createContainer();
    const el = document.createElement('div');

    const colors = {
      success: 'bg-teal-900/90 border-teal-500/50 text-teal-100',
      error: 'bg-red-900/90 border-red-500/50 text-red-100',
      warning: 'bg-amber-900/90 border-amber-500/50 text-amber-100',
      info: 'bg-slate-800/90 border-slate-600/50 text-slate-100',
    };

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };

    el.className = `flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur text-sm font-medium shadow-xl transition-all duration-300 translate-y-2 opacity-0 ${colors[type]}`;
    el.innerHTML = `<span class="text-base">${icons[type]}</span><span>${message}</span>`;

    container.appendChild(el);

    requestAnimationFrame(() => {
      el.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      el.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => el.remove(), 300);
    }, duration);
  },

  _createContainer() {
    const c = document.createElement('div');
    c.id = 'toast-container';
    c.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-2';
    document.body.appendChild(c);
    return c;
  },

  success: (msg) => toast.show(msg, 'success'),
  error: (msg) => toast.show(msg, 'error'),
  warning: (msg) => toast.show(msg, 'warning'),
  info: (msg) => toast.show(msg, 'info'),
};

// Format currency
const formatCurrency = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const formatDate = (d) =>
  new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
