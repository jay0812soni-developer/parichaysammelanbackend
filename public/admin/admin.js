const Admin = (() => {
  const TOKEN_KEY = 'parichay_admin_token';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    location.href = '/admin/';
  }

  function requireAuth() {
    if (!getToken()) location.href = '/admin/';
  }

  function escape(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function api(method, path, body, auth = true) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth) {
      const token = getToken();
      if (!token) {
        logout();
        throw new Error('Not logged in');
      }
      headers.Authorization = 'Bearer ' + token;
    }
    const res = await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && auth) {
      logout();
      throw new Error(data.error || 'Session expired');
    }
    if (!res.ok || data.success === false) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  }

  return { getToken, setToken, logout, requireAuth, escape, api };
})();
