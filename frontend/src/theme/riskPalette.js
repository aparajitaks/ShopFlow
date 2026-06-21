/**
 * src/theme/riskPalette.js
 *
 * SINGLE SOURCE OF TRUTH for risk-level colors.
 * Both orbColor.js and RiskBadge.jsx import from here — never hardcode these
 * hex values anywhere else. If a color needs to change, change it once, here.
 */

export const RISK_PALETTE = {
  Low: {
    hex: '#10B981',        // emerald-500
    hexLight: '#D1FAE5',   // emerald-100 — badge background
    hexDark: '#065F46',    // emerald-900 — badge text
    label: 'Low Risk',
    distort: 0.18,
    speed: 0.7,
    pulse: false,
  },
  Medium: {
    hex: '#F59E0B',        // amber-500
    hexLight: '#FEF3C7',   // amber-100 — badge background
    hexDark: '#78350F',    // amber-900 — badge text
    label: 'Medium Risk',
    distort: 0.42,
    speed: 1.6,
    pulse: false,
  },
  High: {
    hex: '#EF4444',        // red-500
    hexLight: '#FEE2E2',   // red-100 — badge background
    hexDark: '#7F1D1D',    // red-900 — badge text
    label: 'High Risk',
    distort: 0.68,
    speed: 2.8,
    pulse: false,
  },
  Fraud: {
    hex: '#DC2626',        // red-600 — slightly deeper for fraud override
    hexLight: '#FEE2E2',
    hexDark: '#7F1D1D',
    label: 'Fraud Alert',
    distort: 0.88,
    speed: 4.2,
    pulse: true,           // triggers pulsing ring in TrustOrb
  },
};

/**
 * Convenience: resolve the effective palette entry given riskLevel + fraudFlag.
 * @param {'Low'|'Medium'|'High'} riskLevel
 * @param {boolean} fraudFlag
 * @returns {object} palette entry
 */
export function resolveRiskPalette(riskLevel, fraudFlag) {
  if (fraudFlag) return RISK_PALETTE.Fraud;
  return RISK_PALETTE[riskLevel] ?? RISK_PALETTE.Medium;
}
