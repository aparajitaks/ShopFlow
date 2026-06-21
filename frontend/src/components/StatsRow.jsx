import { Users, TrendingUp, AlertTriangle, ShieldAlert } from 'lucide-react';

/**
 * StatsRow — 4-card aggregate stats row on the home page.
 *
 * ⚠ MOCK DATA NOTE: These stats are placeholder values.
 * A production implementation would fetch these from a future
 * GET /trust-score/stats endpoint (see backend-extensions section of README).
 * Until that endpoint exists, this component uses static stubs.
 */

const MOCK_STATS = [
  {
    label: 'Customers Scored Today',
    value: '—',
    sub: 'Requires GET /trust-score/stats',
    icon: Users,
    iconColor: 'text-brand-600',
    iconBg: 'bg-brand-50',
    mock: true,
  },
  {
    label: 'Average Trust Score',
    value: '—',
    sub: 'Requires GET /trust-score/stats',
    icon: TrendingUp,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    mock: true,
  },
  {
    label: 'High Risk Count',
    value: '—',
    sub: 'Requires GET /trust-score/stats',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    mock: true,
  },
  {
    label: 'Fraud Flags This Week',
    value: '—',
    sub: 'Requires GET /trust-score/stats',
    icon: ShieldAlert,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50',
    mock: true,
  },
];

export default function StatsRow({ stats = MOCK_STATS }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="card p-5 flex items-start gap-4 relative">
            {/* Mock badge */}
            {stat.mock && (
              <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                stub
              </span>
            )}

            <div className={`p-2.5 rounded-lg flex-shrink-0 ${stat.iconBg}`}>
              <Icon className={`w-5 h-5 ${stat.iconColor}`} aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="text-2xl font-black text-gray-900 leading-none">{stat.value}</p>
              <p className="text-sm font-medium text-gray-600 mt-1 leading-snug">{stat.label}</p>
              {stat.mock && (
                <p className="text-[11px] text-gray-400 mt-1 leading-tight truncate" title={stat.sub}>
                  {stat.sub}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
