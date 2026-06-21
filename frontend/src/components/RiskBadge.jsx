import { resolveRiskPalette } from '../theme/riskPalette';

/**
 * RiskBadge — color-coded status chip for risk level.
 * Colors are sourced from riskPalette.js (same source as the orb).
 *
 * @param {object} props
 * @param {'Low'|'Medium'|'High'} props.riskLevel
 * @param {boolean} [props.fraudFlag]
 * @param {'sm'|'md'|'lg'} [props.size]
 */
export default function RiskBadge({ riskLevel, fraudFlag = false, size = 'md' }) {
  const palette = resolveRiskPalette(riskLevel, fraudFlag);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const label = fraudFlag ? '⚠ Fraud Alert' : palette.label;

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full ${sizeClasses[size]}`}
      style={{
        backgroundColor: palette.hexLight,
        color: palette.hexDark,
      }}
      aria-label={`Risk level: ${label}`}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: palette.hex }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
