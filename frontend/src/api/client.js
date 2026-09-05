/**
 * Universal API Fetch Client adhering to 2-Way JWT & API Contract
 * Envelope: { success: boolean, data: object|array|null, error: object|null }
 */

const API_BASE = 'http://localhost:5000/api/v1';

export async function apiRequest(method, endpoint, body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  const accessToken = token || localStorage.getItem('uf_access_token');
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const normalizedEndpoint = endpoint.startsWith('/api/v1') 
    ? endpoint.slice(7) 
    : (endpoint.startsWith('/') ? endpoint : `/${endpoint}`);
  const targetUrl = `${API_BASE}${normalizedEndpoint}`;

  try {
    let res = await fetch(targetUrl, config);

    // 2-Way JWT Auto-Refresh on 401 Unauthorized
    if (res.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
      const refreshToken = localStorage.getItem('uf_refresh_token');
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });
          const refreshJson = await refreshRes.json();
          if (refreshJson.success && refreshJson.data.accessToken) {
            localStorage.setItem('uf_access_token', refreshJson.data.accessToken);
            headers['Authorization'] = `Bearer ${refreshJson.data.accessToken}`;
            res = await fetch(`${API_BASE}${endpoint}`, config);
          }
        } catch (e) {
          localStorage.removeItem('uf_access_token');
          localStorage.removeItem('uf_refresh_token');
        }
      }
    }

    const json = await res.json();

    if (!res.ok || !json.success) {
      const err = new Error(json.error?.message || 'API request failed');
      err.code = json.error?.code || 'API_ERROR';
      err.field = json.error?.field || null;
      throw err;
    }

    return json.data;
  } catch (err) {
    console.error(`API Error [${method} ${endpoint}]:`, err);
    throw err;
  }
}