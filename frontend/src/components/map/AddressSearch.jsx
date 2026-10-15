import { useEffect, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { geoService } from '../../services/geo.service.js';

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export default function AddressSearch({ onSelect, className = '' }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const search = debounce(async (value) => {
      const v = value.trim();
      if (v.length < 3) {
        setResults([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const data = await geoService.search(v);
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    search(q);
  }, [q]);

  const handleSelect = (result) => {
    onSelect({
      address: result.displayName,
      lat: result.lat,
      lng: result.lon,
    });
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
          placeholder="Rechercher une adresse (ville, quartier, rue)"
        />
        {loading && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-celebra-dark/40" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-xl border border-celebra-dark/10 bg-white shadow-lg">
          {results.map((r, idx) => (
            <button
              key={idx}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-celebra-gold/5"
              onClick={() => handleSelect(r)}
            >
              <p className="text-sm line-clamp-2">{r.displayName}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
