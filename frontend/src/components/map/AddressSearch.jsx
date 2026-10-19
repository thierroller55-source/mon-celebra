import { useEffect, useMemo, useState } from 'react';
import { Search, Loader2, Globe } from 'lucide-react';
import { geoService } from '../../services/geo.service.js';

const MAX_RESULTS = 5;
const DEBOUNCE_MS = 500;

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Recherche d'adresse (Nominatim) avec suggestions.
 *
 * @param {(r:{address:string,lat:number,lng:number})=>void} props.onSelect
 * @param {string} [props.country]  Code pays (defaut 'sn' = Senegal). '' = monde.
 */
export default function AddressSearch({ onSelect, country = 'sn', className = '' }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [worldwide, setWorldwide] = useState(false);

  const countrycodes = worldwide ? '' : country;

  const search = useMemo(
    () =>
      debounce(async (value, cc) => {
        const v = value.trim();
        if (v.length < 3) {
          setResults([]);
          setOpen(false);
          return;
        }
        setLoading(true);
        try {
          const data = await geoService.search(v, cc);
          setResults(data.slice(0, MAX_RESULTS));
          setOpen(true);
        } catch {
          setResults([]);
          setOpen(false);
        } finally {
          setLoading(false);
        }
      }, DEBOUNCE_MS),
    [],
  );

  useEffect(() => {
    search(q, countrycodes);
  }, [q, countrycodes, search]);

  const handleSelect = (result) => {
    onSelect({ address: result.displayName, lat: result.lat, lng: result.lon });
    setQ(result.displayName);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-celebra-dark/40" />
        <input
          className="input pl-9"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Rechercher une adresse (ville, quartier, rue)"
        />
        {loading && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-celebra-dark/40" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-xl border border-celebra-dark/10 bg-celebra-paper shadow-lg">
          {results.map((r, idx) => (
            <button
              key={idx}
              type="button"
              className="block w-full border-b border-celebra-dark/5 px-3 py-2 text-left text-sm last:border-0 hover:bg-celebra-cream/60"
              onClick={() => handleSelect(r)}
            >
              {r.displayName}
            </button>
          ))}
        </div>
      )}

      <label className="mt-1 flex items-center gap-1.5 text-xs text-celebra-dark/50">
        <input
          type="checkbox"
          checked={worldwide}
          onChange={(e) => setWorldwide(e.target.checked)}
        />
        <Globe size={12} />
        Elargir la recherche au monde entier
      </label>
    </div>
  );
}
