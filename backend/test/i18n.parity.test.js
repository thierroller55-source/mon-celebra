import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const MESSAGES_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../frontend/src/i18n/messages',
);

function load(locale) {
  return JSON.parse(readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), 'utf8'));
}

/** Aplatit un objet de messages en liste de chemins de cles triee. */
function flattenKeys(node, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(node)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, full));
    } else {
      keys.push(full);
    }
  }
  return keys.sort();
}

function collectVoidKeys(node, prefix = '') {
  const empties = [];
  for (const [key, value] of Object.entries(node)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string' && value.trim() === '') empties.push(full);
    else if (value && typeof value === 'object') empties.push(...collectVoidKeys(value, full));
  }
  return empties;
}

const fr = load('fr');
const en = load('en');
const wo = load('wo');

test('les 3 fichiers de langue ont exactement les memes cles', () => {
  const reference = flattenKeys(fr);
  assert.deepEqual(flattenKeys(en), reference, 'en.json doit avoir les memes cles que fr.json');
  assert.deepEqual(flattenKeys(wo), reference, 'wo.json doit avoir les memes cles que fr.json');
});

test('aucune valeur de traduction vide', () => {
  for (const [locale, messages] of Object.entries({ fr, en, wo })) {
    assert.deepEqual(collectVoidKeys(messages), [], `${locale}.json contient des valeurs vides`);
  }
});
