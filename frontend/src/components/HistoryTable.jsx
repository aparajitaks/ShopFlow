import { format } from 'date-fns';
import RiskBadge from './RiskBadge';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';

/**
 * HistoryTable — all past trust score calculations for a customer.
 * Newest first. Columns: date, score, risk, fraud, recommendation.
 */
export default function HistoryTable({ records = [] }) {
  if (!records.length) {
    return (
      <div className="text-center py-10 text-gray-400">
        <Clock className="mx-auto mb-2 opacity-40" size={28} />
        <p className="text-sm">No history records yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto history-scroll">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-100">
            {['Date', 'Score', 'Risk Level', 'Fraud', 'Recommendation'].map((h) => (
              <th
                key={h}
                className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4 last:pr-0"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {records.map((rec) => (
            <tr key={rec.id} className="hover:bg-gray-50/70 transition-colors">
              <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
                {format(new Date(rec.created_at), 'MMM d, yyyy · HH:mm')}
              </td>
              <td className="py-3 pr-4">
                <span className="font-bold text-gray-900 text-base">{rec.trust_score}</span>
                <span className="text-gray-400 text-xs"> /100</span>
              </td>
              <td className="py-3 pr-4">
                <RiskBadge riskLevel={rec.risk_level} fraudFlag={rec.fraud_flag} size="sm" />
              </td>
              <td className="py-3 pr-4">
                {rec.fraud_flag ? (
                  <ShieldAlert className="text-red-500" size={16} aria-label="Fraud flagged" />
                ) : (
                  <ShieldCheck className="text-emerald-500" size={16} aria-label="No fraud flag" />
                )}
              </td>
              <td className="py-3 text-gray-600 text-xs max-w-[200px] truncate" title={rec.recommendation}>
                {rec.recommendation}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
