import { seedCategories } from '../../seed/categories.seed.js';
import { seedTemplates } from '../../seed/templates.seed.js';

/**
 * Alimente la base de test avec le catalogue des categories et les templates,
 * exactement comme `npm run seed -- --no-demo`. A executer apres connectDB().
 */
export async function seedCatalog() {
  await seedCategories();
  await seedTemplates();
}
