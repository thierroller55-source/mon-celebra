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

/** Renvoie les placeholders {var} d'une chaine, tries. */
function placeholders(str) {
  return [...String(str).matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((m) => m[1]).sort();
}

/** Aplatit en { chemin: valeur }. */
function flattenValues(node, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(node)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) flattenValues(value, full, out);
    else out[full] = value;
  }
  return out;
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

test('les variables {placeholder} sont identiques entre les 3 langues', () => {
  const frValues = flattenValues(fr);
  const enValues = flattenValues(en);
  const woValues = flattenValues(wo);
  for (const key of Object.keys(frValues)) {
    const expected = placeholders(frValues[key]);
    assert.deepEqual(
      placeholders(enValues[key]),
      expected,
      `Variables differentes pour "en" sur la cle ${key}`,
    );
    assert.deepEqual(
      placeholders(woValues[key]),
      expected,
      `Variables differentes pour "wo" sur la cle ${key}`,
    );
  }
});

test('aucun texte traduit ne contient de placeholder mal ferme ou de "Celebra" isole', () => {
  const all = { fr, en, wo };
  for (const [locale, messages] of Object.entries(all)) {
    for (const [key, value] of Object.entries(flattenValues(messages))) {
      if (typeof value !== 'string') continue;
      // Placeholder mal ferme : un "{" ou "}" sans paire complete.
      const stripped = value.replace(/\{[a-zA-Z0-9_]+\}/g, '');
      assert.ok(
        !stripped.includes('{') && !stripped.includes('}'),
        `${locale}.json:${key} contient un placeholder mal ferme : "${value}"`,
      );
      // Marque : "Celebra" isole (nom officiel "Mon Celebra"). On ne cible
      // que la forme exacte en majuscule initiale suivie d'une frontiere
      // (pour ne pas confondre avec "celebrated"/"celebrate"), hors domaine/email.
      const brandProbe = value
        .replace(/Mon Celebra/g, '')
        .replace(/[a-z0-9.-]*mon-?celebra[a-z0-9.-]*/gi, '')
        .replace(/guest\.moncelebra[a-z.]*/gi, '');
      assert.ok(
        !/\bCelebra\b/.test(brandProbe),
        `${locale}.json:${key} contient "Celebra" isole : "${value}"`,
      );
    }
  }
});
