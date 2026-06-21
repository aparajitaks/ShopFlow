import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';
import Layout from '../components/Layout';
import RiskBadge from '../components/RiskBadge';

/**
 * WatchlistPage — Risk Watchlist (Bonus screen)
 *
 * ⚠ MOCK DATA: This screen uses static placeholder data.
 * A production implementation requires:
 *   GET /trust-score/flagged?page=1&limit=20
 * which is not yet implemented in the backend.
 * See README "Backend Extensions Needed" section.
 */

const MOCK_FLAGGED = [
  { customer_id: 'CUST00091', trust_score: 22, risk_level: 'High',   fraud_flag: true,  recommendation: 'Manual Review Required', last_scored: '2026-06-21T05:30:00Z' },
  { customer_id: 'CUST00134', trust_score: 38, risk_level: 'High',   fraud_flag: true,  recommendation: 'Manual Review Required', last_scored: '2026-06-21T04:10:00Z' },
  { customer_id: 'CUST00278', trust_score: 31, risk_level: 'High',   fraud_flag: false, recommendation: 'Restrict COD — Prepaid Only', last_scored: '2026-06-20T18:22:00Z' },
  { customer_id: 'CUST00312', trust_score: 44, risk_level: 'High',   fraud_flag: true,  recommendation: 'Manual Review Required', last_scored: '2026-06-20T14:45:00Z' },
  { customer_id: 'CUST00455', trust_score: 28, risk_level: 'High',   fraud_flag: false, recommendation: 'Restrict COD — Prepaid Only', last_scored: '2026-06-20T11:03:00Z' },
  { customer_id: 'CUST00567', trust_score: 15, risk_level: 'High',   fraud_flag: true,  recommendation: 'Manual Review Required', last_scored: '2026-06-19T22:15:00Z' },
];

const COLUMNS = [
  { key: 'customer_id',    label: 'Customer ID',    sortable: true },
  { key: 'trust_score',    label: 'Score',          sortable: true },
  { key: 'risk_level',     label: 'Risk Level',     sortable: true },
  { key: 'fraud_flag',     label: 'Fraud',          sortable: false },
  { key: 'recommendation', label: 'Recommendation', sortable: false },
  { key: 'action',         label: '',               sortable: false },
];

function SortIcon({ column, sortKey, sortDir }) {
  if (column !== sortKey) return <ChevronUp className="opacity-20" size={14} />;
  return sortDir === 'asc'
    ? <ChevronUp size={14} className="text-brand-600" />
    : <ChevronDown size={14} className="text-brand-600" />;
}

export default function WatchlistPage() {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState('trust_score');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const sorted = [...MOCK_FLAGGED].sort((a, b) => {
    const av = a[sortKey] ?? '';
    const bv = b[sortKey] ?? '';
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Layout>
      <div className="space-y-6 animate-slide-up">
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Risk Watchlist</h1>
            <p className="text-sm text-gray-500 mt-1">
              High-risk and fraud-flagged customers requiring manual review.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <Shield className="text-amber-600" size={15} />
            <span className="text-xs font-semibold text-amber-700">
              {MOCK_FLAGGED.length} flagged customers
            </span>
          </div>
        </div>

        {/* ── Mock data notice ──────────────────────────────────────── */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 flex items-start gap-2">
          <span className="font-bold mt-0.5 shrink-0">ℹ</span>
          <span>
            <strong>Mock data — stub screen.</strong> This table uses placeholder data pending
            implementation of <code className="bg-blue-100 px-1 py-0.5 rounded text-xs font-mono">GET /trust-score/flagged</code> on the backend.
            See README for details.
          </span>
        </div>

        {/* ── Table ─────────────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto history-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {COLUMNS.map(({ key, label, sortable }) => (
                    <th
                      key={key}
                      className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3 first:rounded-tl-xl last:rounded-tr-xl"
                    >
                      {sortable ? (
                        <button
                          onClick={() => handleSort(key)}
                          className="flex items-center gap-1 hover:text-gray-800 transition-colors"
                        >
                          {label}
                          <SortIcon column={key} sortKey={sortKey} sortDir={sortDir} />
                        </button>
                      ) : (
                        label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((row) => (
                  <tr
                    key={row.customer_id}
                    onClick={() => navigate(`/customer/${row.customer_id}`)}
                    className="hover:bg-gray-50/60 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono font-semibold text-gray-900">
                      {row.customer_id}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-gray-900">{row.trust_score}</span>
                      <span className="text-gray-400 text-xs"> /100</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <RiskBadge riskLevel={row.risk_level} fraudFlag={row.fraud_flag} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {row.fraud_flag ? (
                        <span className="text-red-500 font-bold text-xs">Yes</span>
                      ) : (
                        <span className="text-gray-400 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs max-w-[180px] truncate">
                      {row.recommendation}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customer/${row.customer_id}`);
                        }}
                        className="flex items-center gap-1 text-brand-600 hover:text-brand-800 text-xs font-medium"
                        aria-label={`View profile for ${row.customer_id}`}
                      >
                        View
                        <ExternalLink size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary py-1 px-3 text-xs disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
