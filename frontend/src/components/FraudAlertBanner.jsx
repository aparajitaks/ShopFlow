import { AlertTriangle } from 'lucide-react';

/**
 * FraudAlertBanner — full-width urgent red banner.
 * Only rendered when fraudFlag is true. Impossible to miss.
 *
 * @param {object} props
 * @param {string} [props.reason] - fraud_reason from backend
 */
export default function FraudAlertBanner({ reason }) {
  return (
    <div
      role="alert"
      className="w-full bg-red-600 text-white rounded-xl px-5 py-4 flex items-start gap-3 animate-fade-in"
    >
      <AlertTriangle
        className="flex-shrink-0 mt-0.5"
        size={22}
        aria-hidden="true"
      />
      <div>
        <p className="font-bold text-base leading-tight">Fraud Risk Flagged</p>
        <p className="text-sm text-red-100 mt-0.5">
          {reason || 'RTO/Cancellation threshold breached — manual review required before processing COD orders.'}
        </p>
      </div>
    </div>
  );
}
