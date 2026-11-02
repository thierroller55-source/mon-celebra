#!/usr/bin/env node
/**
 * Migration vers le modele de plans free / event_pass / pro.
 *
 * - Sauvegarde les collections dans backend/backups avant toute ecriture.
 * - Convertit les anciens comptes `premium` en `pro` sans perte de date.
 * - Marque les evenements anterieurs comme `legacy` (aucune regression).
 * - Est idempotent : une seconde execution ne modifie plus rien.
 *
 * Usage :
 *   npm run migrate:plans
 *   npm run migrate:plans -- --dry-run
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Event } from '../src/models/Event.js';
import { UpgradeRequest } from '../src/models/UpgradeRequest.js';
import { PlanAudit } from '../src/models/PlanAudit.js';
import { EVENT_PLAN_IDS, USER_PLANS } from '../src/config/plans.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

function sameValue(left, right) {
  const leftEmpty = left === null || left === undefined;
  const rightEmpty = right === null || right === undefined;
  if (leftEmpty || rightEmpty) return leftEmpty && rightEmpty;
  if (left instanceof Date || right instanceof Date) {
    return new Date(left).getTime() === new Date(right).getTime();
  }
  return String(left) === String(right);
}

function hasField(document, field) {
  return Object.prototype.hasOwnProperty.call(document, field);
}

async function backupCollections() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const directory = path.join(__dirname, '..', 'backups', `plans-${stamp}`);
  await mkdir(directory, { recursive: true });

  const collections = [
    ['users', User.collection],
    ['events', Event.collection],
    ['upgradeRequests', UpgradeRequest.collection],
    ['planAudits', PlanAudit.collection],
  ];

  for (const [name, collection] of collections) {
    const documents = await collection.find({}).toArray();
    await writeFile(
      path.join(directory, `${name}.json`),
      JSON.stringify(documents, null, 2),
      'utf8',
    );
    console.log(`  sauvegarde ${name}: ${documents.length} document(s)`);
  }

  return directory;
}

function buildUserUpdate(document) {
  const targetPlan = document.plan === 'premium'
    ? USER_PLANS.PRO
    : (document.plan === USER_PLANS.PRO ? USER_PLANS.PRO : USER_PLANS.FREE);
  const targetProUntil = targetPlan === USER_PLANS.PRO
    ? (document.proUntil ?? document.premiumUntil ?? null)
    : null;

  const set = {};
  const unset = {};

  if (!hasField(document, 'plan') || document.plan !== targetPlan) {
    set.plan = targetPlan;
  }
  if (!hasField(document, 'proUntil') || !sameValue(document.proUntil, targetProUntil)) {
    set.proUntil = targetProUntil;
  }
  if (hasField(document, 'premiumUntil')) unset.premiumUntil = '';
  if (hasField(document, 'premiumSource')) unset.premiumSource = '';

  return { set, unset };
}

function buildEventUpdate(document) {
  const set = {};

  if (!hasField(document, 'plan') || !EVENT_PLAN_IDS.includes(document.plan)) {
    set.plan = 'free';
  }
  if (!hasField(document, 'legacy')) {
    set.legacy = true;
  }
  if (!hasField(document, 'premiumUntil')) {
    set.premiumUntil = null;
  }

  return { set, unset: {} };
}

function hasChanges(update) {
  return Object.keys(update.set).length > 0 || Object.keys(update.unset).length > 0;
}

function toMongoUpdate(update) {
  const mongoUpdate = {};
  if (Object.keys(update.set).length > 0) mongoUpdate.$set = update.set;
  if (Object.keys(update.unset).length > 0) mongoUpdate.$unset = update.unset;
  return mongoUpdate;
}

async function migrateCollection({ label, collection, buildUpdate }) {
  const documents = await collection.find({}).toArray();
  let migrated = 0;
  let unchanged = 0;

  for (const document of documents) {
    const update = buildUpdate(document);
    if (!hasChanges(update)) {
      unchanged += 1;
      continue;
    }
    if (!DRY_RUN) {
      await collection.updateOne({ _id: document._id }, toMongoUpdate(update));
    }
    migrated += 1;
  }

  console.log(
    `  ${label}: ${migrated} ${DRY_RUN ? 'a migrer' : 'migre(s)'}, ${unchanged} inchange(s)`,
  );
  return { migrated, unchanged };
}

async function syncIndexes() {
  if (DRY_RUN) return;
  await Promise.all([
    User.syncIndexes(),
    Event.syncIndexes(),
    UpgradeRequest.syncIndexes(),
    PlanAudit.syncIndexes(),
  ]);
}

async function main() {
  console.log(`Migration des plans${DRY_RUN ? ' (simulation)' : ''}`);
  await connectDB();

  if (!DRY_RUN) {
    console.log('Sauvegarde prealable :');
    const directory = await backupCollections();
    console.log(`  dossier: ${path.relative(process.cwd(), directory)}`);
    console.log('Application de la migration :');
  }

  const users = await migrateCollection({
    label: 'utilisateurs',
    collection: User.collection,
    buildUpdate: buildUserUpdate,
  });
  const events = await migrateCollection({
    label: 'evenements',
    collection: Event.collection,
    buildUpdate: buildEventUpdate,
  });

  await syncIndexes();

  console.log(
    `Termine : ${users.migrated} utilisateur(s), ${events.migrated} evenement(s)${
      DRY_RUN ? ' (aucune ecriture)' : ''
    }.`,
  );
}

main()
  .catch((error) => {
    console.error(`Echec de la migration : ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB().catch(() => {});
  });
