import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { logger } from '../src/utils/logger.js';
import { seedCategories } from './categories.seed.js';
import { seedTemplates } from './templates.seed.js';
import { seedDemo } from './demo.seed.js';

/**
 * Point d'entree du seed : `npm run seed [-- --no-demo]`.
 * Par defaut : categories + templates + donnees de demonstration.
 * Flags :
 *   --no-demo        ne pas inserer les donnees de demonstration
 *   --only=<name>    n'executer qu'une partie (categories|templates|demo)
 */
function parseArgs(argv) {
  const flags = { demo: true, only: null };
  for (const arg of argv) {
    if (arg === '--no-demo') flags.demo = false;
    else if (arg.startsWith('--only=')) flags.only = arg.split('=')[1];
  }
  return flags;
}

function shouldRun(name, flags) {
  if (flags.only) return flags.only === name;
  if (name === 'demo') return flags.demo;
  return true;
}

async function run() {
  const flags = parseArgs(process.argv.slice(2));
  await connectDB();
  logger.info(`Seed demarre (base: ${mongoose.connection.name})`);

  if (shouldRun('categories', flags)) {
    const r = await seedCategories();
    logger.info(`Categories : ${r.created} creees, ${r.updated} mises a jour (${r.total} total)`);
  }

  if (shouldRun('templates', flags)) {
    const r = await seedTemplates();
    logger.info(`Templates : ${r.created} crees, ${r.updated} mis a jour (${r.total} total)`);
  }

  if (shouldRun('demo', flags)) {
    const r = await seedDemo();
    logger.info(`Demo : ${r.events.length} evenements, utilisateurs ${r.users.join(', ')} (mot de passe: ${r.password})`);
  }

  logger.info('Seed termine.');
}

run()
  .catch((error) => {
    logger.error(`Seed echoue : ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
