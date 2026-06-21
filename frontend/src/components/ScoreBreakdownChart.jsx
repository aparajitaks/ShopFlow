import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// Component max scores — must match backend weights
const COMPONENT_META = [
  { key: 'delivery_score',             label: 'Delivery Rate',    max: 40, color: '#4F46E5' },
  { key: 'rto_penalty_score',          label: 'RTO Penalty',      max: 25, color: '#6366F1' },
  { key: 'cancellation_penalty_score', label: 'Cancellation',     max: 20, color: '#818CF8' },
  { key: 'order_value_score',          label: 'Order Value',      max: 10, color: '#A5B4FC' },
  { key: 'cod_dependency_score',       label: 'COD Dependency',   max:  5, color: '#C7D2FE' },
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-card p-3 text-sm">
      <p className="font-semibold text-gray-800">{d.label}</p>
      <p className="text-gray-500 mt-0.5">
        Score: <span className="font-bold text-gray-900">{d.value.toFixed(1)}</span>
        <span className="text-gray-400"> / {d.max}</span>
      </p>
      <p className="text-gray-400">
        {((d.value / d.max) * 100).toFixed(0)}% of max
      </p>
    </div>
  );
}

/**
 * ScoreBreakdownChart — horizontal bar chart of the 5 trust score components.
 * Uses Recharts (not Three.js) — lightweight and appropriate for 2D data viz.
 *
 * @param {object} props
 * @param {object} props.breakdown - score_breakdown from backend
 */
export default function ScoreBreakdownChart({ breakdown }) {
  const data = COMPONENT_META.map(({ key, label, max, color }) => ({
    label,
    value: breakdown?.[key] ?? 0,
    max,
    color,
    // Normalise to percentage of max for a fair visual comparison
    percentage: ((breakdown?.[key] ?? 0) / max) * 100,
  }));

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Score Breakdown
      </h3>

      {/* Legend */}
      <div className="space-y-3 mb-4">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-28 shrink-0">{d.label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(d.percentage, 100)}%`,
                  backgroundColor: d.color,
                }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-700 w-14 text-right">
              {d.value.toFixed(1)} / {d.max}
            </span>
          </div>
        ))}
      </div>

      {/* Recharts bar chart for the detail view */}
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
            <XAxis type="number" domain={[0, 40]} tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="label" width={96} tick={{ fontSize: 11, fill: '#6B7280' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={16}>
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
