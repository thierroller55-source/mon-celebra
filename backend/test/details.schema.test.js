import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDetailsSchema } from '../src/validators/event.schema.js';
import { CATEGORY_FIELDS } from '../src/config/categoryFields.js';

test('une categorie connue valide les details et retire les cles inconnues', () => {
  const schema = buildDetailsSchema('graduation');
  const result = schema.safeParse({
    graduateName: 'Awa Diop',
    institution: 'UCAD',
    inconnu: 'x',
  });
  assert.equal(result.success, true);
  assert.deepEqual(result.data, { graduateName: 'Awa Diop', institution: 'UCAD' });
});

test('un champ requis manquant est rejete avec un message', () => {
  const schema = buildDetailsSchema('graduation');
  const result = schema.safeParse({ institution: 'UCAD' });
  assert.equal(result.success, false);
  const issue = result.error.issues.find((i) => i.path[0] === 'graduateName');
  assert.ok(issue);
});

test('une valeur select invalide est rejetee', () => {
  const schema = buildDetailsSchema('evenement-professionnel');
  const result = schema.safeParse({ participationType: 'teleportation' });
  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path[0], 'participationType');
});

test('une valeur select valide est acceptee', () => {
  const schema = buildDetailsSchema('evenement-professionnel');
  const result = schema.safeParse({ participationType: 'en_ligne' });
  assert.equal(result.success, true);
});

test('les champs image exigent une url', () => {
  const schema = buildDetailsSchema('anniversaire');
  assert.equal(schema.safeParse({ celebrantPhoto: { publicId: 'x' } }).success, false);
  assert.equal(
    schema.safeParse({ celebrantPhoto: { url: 'https://img/x.png', publicId: 'x' } }).success,
    true,
  );
});

test('les listes acceptent des chaines et rejettent les nombres', () => {
  const schema = buildDetailsSchema('soiree');
  assert.equal(schema.safeParse({ artists: ['DJ A', 'DJ B'] }).success, true);
  assert.equal(schema.safeParse({ artists: [123] }).success, false);
});

test('les sous-elements (contacts) sont valides', () => {
  const schema = buildDetailsSchema('mariage');
  assert.equal(
    schema.safeParse({ contacts: [{ label: 'Tel', value: '+221771234567' }] }).success,
    true,
  );
});

test('chaque categorie dispose d un schema constructible', () => {
  for (const slug of Object.keys(CATEGORY_FIELDS)) {
    const schema = buildDetailsSchema(slug);
    assert.equal(typeof schema.safeParse, 'function', `schema pour ${slug}`);
  }
});

test('une categorie inconnue laisse passer les details', () => {
  const schema = buildDetailsSchema('inexistante');
  assert.equal(schema.safeParse({ foo: 'bar' }).success, true);
});
