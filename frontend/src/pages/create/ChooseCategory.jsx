import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { categoryService } from '../../services/category.service.js';
import { getErrorMessage } from '../../services/api.js';

export default function ChooseCategory() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    categoryService
      .list()
      .then((list) => active && setCategories(list))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="mb-2 text-2xl font-bold">Choisir une categorie</h1>
      <p className="mb-6 text-sm text-celebra-dark/60">
        Chaque categorie adapte le formulaire et le rendu de votre page.
      </p>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-celebra-dark/40">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/dashboard/creer/${category.slug}`}
              className="card flex flex-col items-start gap-2 p-5 transition-shadow hover:shadow-md"
            >
              <span className="text-3xl" aria-hidden="true">
                {category.emoji || '\u{1F38A}'}
              </span>
              <h2 className="text-lg font-semibold">{category.name}</h2>
              <p className="line-clamp-2 text-sm text-celebra-dark/60">
                {category.description || 'Creez votre evenement en quelques minutes.'}
              </p>
              <span className="mt-2 text-sm font-medium text-celebra-gold">Commencer</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
