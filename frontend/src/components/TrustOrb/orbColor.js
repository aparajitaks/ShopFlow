import { resolveRiskPalette } from '../../theme/riskPalette';

/**
 * orbColor.js
 *
 * Maps risk level + fraud flag to Three.js orb animation parameters.
 * Colors are imported from riskPalette.js — never hardcoded here.
 */

/**
 * Get the orb visual config for a given risk state.
 * @param {'Low'|'Medium'|'High'} riskLevel
 * @param {boolean} fraudFlag
 * @returns {{ hex, distort, speed, pulse }}
 */
export function getOrbConfig(riskLevel, fraudFlag) {
  const palette = resolveRiskPalette(riskLevel, fraudFlag);
  return {
    hex: palette.hex,
    distort: palette.distort,
    speed: palette.speed,
    pulse: palette.pulse,
  };
}
