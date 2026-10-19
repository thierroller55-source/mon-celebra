import { test } from 'node:test';
import assert from 'node:assert/strict';

// Definies AVANT l'import de auth.service.js (qui importe env.js) pour que la
// configuration soit lue sans dependre du .env local.
process.env.NODE_ENV = 'production';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-1234567890';
process.env.REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || 'test-refresh-secret-1234567890';
process.env.REFRESH_TOKEN_EXPIRES_IN = '30d';

const { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE } = await import(
  '../src/services/auth.service.js'
);

function fakeRes() {
  const calls = [];
  return {
    calls,
    cookie: (...args) => calls.push(['cookie', ...args]),
    clearCookie: (...args) => calls.push(['clearCookie', ...args]),
  };
}

const user = { _id: '507f1f77bcf86cd799439011', role: 'admin' };

test('cookie refresh : httpOnly, secure, SameSite=Lax, Path=/, 30 jours', () => {
  const res = fakeRes();
  setRefreshCookie(res, user);

  assert.equal(res.calls.length, 1);
  const [kind, name, value, options] = res.calls[0];
  assert.equal(kind, 'cookie');
  assert.equal(name, REFRESH_COOKIE);
  assert.equal(typeof value, 'string');

  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, true);
  assert.equal(options.sameSite, 'lax');
  assert.equal(options.path, '/');
  assert.equal(options.maxAge, 30 * 24 * 60 * 60 * 1000);
});

test('logout : efface le cookie sur le chemin courant ET l\'ancien chemin', () => {
  const res = fakeRes();
  clearRefreshCookie(res);

  const paths = res.calls.map(([, name, options]) => {
    assert.equal(name, REFRESH_COOKIE);
    return options.path;
  });
  assert.deepEqual(new Set(paths), new Set(['/', '/api/auth']));
});
