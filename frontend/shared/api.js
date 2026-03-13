// Shared API utility
const API_BASE = '/api';

const api = {
  token: null,

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('staffang_token', token);
    else localStorage.removeItem('staffang_token');
  },

  getToken() {
    if (!this.token) this.token = localStorage.getItem('staffang_token');
    return this.token;
  },

  getUser() {
    const u = localStorage.getItem('staffang_user');
    return u ? JSON.parse(u) : null;
  },

  setUser(user) {
    if (user) localStorage.setItem('staffang_user', JSON.stringify(user));
    else localStorage.removeItem('staffang_user');
  },

  logout(redirectTo) {
    this.setToken(null);
    this.setUser(null);
    const path = window.location.pathname;
    if (redirectTo) {
      window.location.href = redirectTo;
    } else if (path.includes('/admin/')) {
      window.location.href = '/admin/index.html';
    } else if (path.includes('/staff/')) {
      window.location.href = '/staff/index.html';
    } else {
      window.location.href = '/';
    }
  },

  async request(method, path, body = null) {
    try {
      const token = this.getToken();
      const opts = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
      };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(API_BASE + path, opts);
      const data = await res.json();
      if (res.status === 401) { this.logout(); return { ...data, _status: 401 }; }
      return { ...data, _status: res.status };
    } catch (err) {
      console.error('API Error:', err);
      return { success: false, message: 'Gagal terhubung ke server.' };
    }
  },

  async get(path) { return this.request('GET', path); },
  async post(path, body) { return this.request('POST', path, body); },
  async put(path, body) { return this.request('PUT', path, body); },
  async delete(path) { return this.request('DELETE', path); },
};

function formatCurrency(n) {
  return new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', maximumFractionDigits:0 }).format(n);
}

function formatDate(d) {
  return new Date(d).toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
