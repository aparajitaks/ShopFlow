import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import Layout from '../components/Layout';
import StatsRow from '../components/StatsRow';

const RECENT_KEY = 'shopflow_recent_searches';
const MAX_RECENT = 5;

function getRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRecent(customerId) {
  const prev = getRecent().filter((id) => id !== customerId);
  const next = [customerId, ...prev].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(getRecent);
  const inputRef = useRef(null);

  // Auto-focus search input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = useCallback(
    (customerId) => {
      const id = (customerId || query).trim().toUpperCase();
      if (!id) return;
      saveRecent(id);
      setRecentSearches(getRecent());
      navigate(`/customer/${encodeURIComponent(id)}`);
    },
    [query, navigate]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const removeRecent = (id) => {
    const updated = getRecent().filter((r) => r !== id);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    setRecentSearches(updated);
  };

  return (
    <Layout>
      <div className="space-y-8 animate-slide-up">
        {/* ── Page header ──────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-black text-gray-900">Trust & Risk Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Look up any customer to view their COD trust score and risk assessment.
          </p>
        </div>

        {/* ── Stats row ─────────────────────────────────────────────────── */}
        <StatsRow />

        {/* ── Search card ───────────────────────────────────────────────── */}
        <div className="card p-8 max-w-2xl mx-auto">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-7 h-7 text-brand-600" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Customer Trust Lookup</h2>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              Enter a customer ID to view their trust score, risk level, and full order history.
            </p>
          </div>

          {/* Search input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="e.g. CUST10234"
                className="input pl-10 text-base py-3 font-mono tracking-wider"
                aria-label="Customer ID search"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={!query.trim()}
              className="btn-primary px-6 py-3 flex items-center gap-2"
            >
              Look Up
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>

          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Clock size={13} className="text-gray-400" aria-hidden="true" />
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Recent
                </span>
              </div>
              <div className="flex flex-wrap gap-2" role="list" aria-label="Recent searches">
                {recentSearches.map((id) => (
                  <div
                    key={id}
                    role="listitem"
                    className="flex items-center gap-1 bg-gray-100 hover:bg-brand-50 rounded-full px-3 py-1 transition-colors group"
                  >
                    <button
                      onClick={() => handleSearch(id)}
                      className="text-sm font-mono font-medium text-gray-700 group-hover:text-brand-700"
                      aria-label={`Search for ${id}`}
                    >
                      {id}
                    </button>
                    <button
                      onClick={() => removeRecent(id)}
                      className="text-gray-400 hover:text-gray-600 ml-0.5"
                      aria-label={`Remove ${id} from recent searches`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Empty state / guidance ──────────────────────────────────── */}
        {recentSearches.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Enter a customer ID above to get started.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
