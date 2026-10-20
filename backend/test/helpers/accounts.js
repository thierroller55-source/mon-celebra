import { User } from '../../src/models/User.js';
import { createApiClient } from './api.js';
import { ROLES } from '../../src/config/constants.js';

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

/**
 * Cree directement un compte admin en base (sans passer par le bootstrap HTTP)
 * et renvoie un client authentifie (via /auth/login).
 */
export async function createAdminClient(baseUrl, overrides = {}) {
  const email = overrides.email || uniqueEmail('admin');
  const password = overrides.password || 'Str0ng!Pass';
  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    firstName: overrides.firstName || 'Admin',
    lastName: overrides.lastName || 'Test',
    email,
    passwordHash,
    role: ROLES.ADMIN,
  });

  const api = createApiClient(baseUrl);
  const login = await api.post('/auth/login', { email, password });
  if (login.status !== 200) {
    throw new Error(`login admin a echoue (${login.status}) : ${JSON.stringify(login.body)}`);
  }
  api.setToken(login.body.data.accessToken);
  return { api, user, password, email };
}
