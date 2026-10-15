/**
 * Petit client HTTP de test partage par les suites e2e.
 * Conserve le token d'acces et injecte le Bearer automatiquement.
 */
export function createApiClient(baseUrl) {
  let token = null;

  async function request(path, options = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, body };
  }

  return {
    get: (path) => request(path),
    post: (path, data) =>
      request(path, { method: 'POST', body: JSON.stringify(data ?? {}) }),
    put: (path, data) =>
      request(path, { method: 'PUT', body: JSON.stringify(data ?? {}) }),
    patch: (path, data) =>
      request(path, { method: 'PATCH', body: JSON.stringify(data ?? {}) }),
    delete: (path) => request(path, { method: 'DELETE' }),
    setToken: (value) => {
      token = value;
    },
    raw: request,
  };
}
