import { Category } from '../src/models/Category.js';
import { CATEGORIES } from '../src/config/constants.js';
import { CATEGORY_FIELDS } from '../src/config/categoryFields.js';

/**
 * Insere / met a jour les categories canoniques (idempotent).
 * La source de verite est CATEGORIES (src/config/constants.js) complete par
 * les descripteurs de champs (src/config/categoryFields.js).
 */
export async function seedCategories() {
  const operations = CATEGORIES.map((category) => {
    const fields = CATEGORY_FIELDS[category.slug] || {};
    return {
      updateOne: {
        filter: { slug: category.slug },
        update: {
          $set: {
            name: category.name,
            slug: category.slug,
            icon: category.icon,
            emoji: fields.emoji || '',
            description: fields.description || '',
            fieldsSchema: {
              templates: fields.templates || [],
              defaults: fields.defaults || {},
              fields: fields.fields || [],
            },
            isMvp: category.isMvp,
            order: category.order,
            isActive: true,
          },
        },
        upsert: true,
      },
    };
  });

  const result = await Category.bulkWrite(operations);

  // Supprime les anciens slugs remplaces (renommage). Cible et non destructif.
  const legacy = await Category.deleteMany({ slug: { $in: ['professionnel', 'autre'] } });

  return {
    created: result.upsertedCount,
    updated: result.modifiedCount,
    total: CATEGORIES.length,
    removed: legacy.deletedCount,
  };
}
