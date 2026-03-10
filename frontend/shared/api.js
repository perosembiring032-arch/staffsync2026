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
    // Redirect ke halaman login yang sesuai
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

const toast = {
  show(message, type, duration) {
    type = type || 'info'; duration = duration || 3500;
    let c = document.getElementById('toast-container');
    if (!c) { c = document.createElement('div'); c.id = 'toast-container'; c.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;'; document.body.appendChild(c); }
    const el = document.createElement('div');
    const colors = { success:'background:rgba(21,128,61,0.95);border:1px solid rgba(34,197,94,0.3);color:#4ADE80', error:'background:rgba(153,27,27,0.95);border:1px solid rgba(230,57,70,0.3);color:#F87171', warning:'background:rgba(120,53,15,0.95);border:1px solid rgba(255,183,3,0.3);color:#FCD34D', info:'background:rgba(15,23,42,0.95);border:1px solid rgba(255,255,255,0.1);color:#94A3B8' };
    const icons = { success:'✓', error:'✕', warning:'⚠', info:'ℹ' };
    el.style.cssText = (colors[type]||colors.info) + ';padding:12px 18px;border-radius:12px;font-size:13px;font-family:monospace;min-width:200px;display:flex;align-items:center;gap:8px;';
    el.innerHTML = '<span>' + (icons[type]||'ℹ') + '</span><span>' + message + '</span>';
    c.appendChild(el);
    setTimeout(function(){ el.remove(); }, duration);
  },
  success: function(msg){ toast.show(msg,'success'); },
  error: function(msg){ toast.show(msg,'error'); },
  warning: function(msg){ toast.show(msg,'warning'); },
  info: function(msg){ toast.show(msg,'info'); },
};

function formatCurrency(n) {
  return new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', maximumFractionDigits:0 }).format(n);
}

function formatDate(d) {
  return new Date(d).toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
