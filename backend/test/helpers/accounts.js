import { createApiClient } from './api.js';

let counter = 0;
function uniqueEmail(prefix = 'user') {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}@test.moncelebra.local`;
}

/**
 * Cree un vrai compte "user" via l'API publique /auth/signup et renvoie
 * un client authentifie ainsi que le compte.
 */
export async function createUserClient(baseUrl, overrides = {}) {
  const api = createApiClient(baseUrl);
  const email = overrides.email || uniqueEmail('user');
  const password = overrides.password || 'Str0ng!Pass';
  const res = await api.post('/auth/signup', {
    firstName: overrides.firstName || 'Visiteur',
    lastName: overrides.lastName || 'Test',
    email,
    password,
    phone: overrides.phone || '770000000',
  });
  if (res.status !== 201) {
    throw new Error(`signup a echoue (${res.status}) : ${JSON.stringify(res.body)}`);
  }
  api.setToken(res.body.data.accessToken);
  return { api, user: res.body.data.user, password, email };
}
