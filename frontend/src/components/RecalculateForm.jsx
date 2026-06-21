import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RefreshCw, Loader2 } from 'lucide-react';

/**
 * Zod validation schema — mirrors the backend's Zod rules exactly.
 * If the backend rules change, update both files.
 */
const recalculateSchema = z
  .object({
    orders: z
      .number({ invalid_type_error: 'Must be a number' })
      .int('Must be a whole number')
      .positive('Must be greater than 0'),
    delivered: z
      .number({ invalid_type_error: 'Must be a number' })
      .int('Must be a whole number')
      .min(0, 'Cannot be negative'),
    rto: z
      .number({ invalid_type_error: 'Must be a number' })
      .int('Must be a whole number')
      .min(0, 'Cannot be negative'),
    cancelled: z
      .number({ invalid_type_error: 'Must be a number' })
      .int('Must be a whole number')
      .min(0, 'Cannot be negative'),
    avg_order_value: z
      .number({ invalid_type_error: 'Must be a number' })
      .min(0, 'Cannot be negative'),
    cod_orders: z
      .number({ invalid_type_error: 'Must be a number' })
      .int('Must be a whole number')
      .min(0, 'Cannot be negative'),
  })
  .refine(
    (d) => d.delivered + d.rto + d.cancelled <= d.orders,
    {
      message: 'delivered + rto + cancelled cannot exceed total orders',
      path: ['delivered'],
    }
  )
  .refine(
    (d) => d.cod_orders <= d.orders,
    {
      message: 'cod_orders cannot exceed total orders',
      path: ['cod_orders'],
    }
  );

const FIELDS = [
  { name: 'orders',          label: 'Total Orders',     placeholder: '25',    type: 'integer' },
  { name: 'delivered',       label: 'Delivered',        placeholder: '18',    type: 'integer' },
  { name: 'rto',             label: 'RTO (Returned)',   placeholder: '4',     type: 'integer' },
  { name: 'cancelled',       label: 'Cancelled',        placeholder: '3',     type: 'integer' },
  { name: 'avg_order_value', label: 'Avg Order Value ₹',placeholder: '2500',  type: 'decimal' },
  { name: 'cod_orders',      label: 'COD Orders',       placeholder: '20',    type: 'integer' },
];

/**
 * RecalculateForm — POSTs to /trust-score to generate a new score.
 *
 * @param {object}   props
 * @param {string}   props.customerId  — prefills hidden field
 * @param {function} props.onSubmit    — async (data) => void, receives validated payload
 * @param {boolean}  props.isLoading
 * @param {string}   [props.serverError]
 */
export default function RecalculateForm({ customerId, onSubmit, isLoading, serverError }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: zodResolver(recalculateSchema),
    defaultValues: {
      orders: '', delivered: '', rto: '', cancelled: '',
      avg_order_value: '', cod_orders: '',
    },
  });

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit({ customer_id: customerId, ...data });
    } catch (err) {
      // Map backend Zod errors back to form fields if present
      const details = err?.response?.data?.details;
      if (Array.isArray(details)) {
        details.forEach(({ field, message }) => {
          if (field) setError(field, { message });
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-4">
      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        {FIELDS.map(({ name, label, placeholder, type }) => (
          <div key={name}>
            <label htmlFor={`field-${name}`} className="label">
              {label}
            </label>
            <input
              id={`field-${name}`}
              type="number"
              step={type === 'decimal' ? '0.01' : '1'}
              min="0"
              placeholder={placeholder}
              className={`input ${errors[name] ? 'input-error' : ''}`}
              {...register(name, {
                valueAsNumber: true,
              })}
              aria-invalid={errors[name] ? 'true' : 'false'}
              aria-describedby={errors[name] ? `error-${name}` : undefined}
            />
            {errors[name] && (
              <p id={`error-${name}`} className="field-error" role="alert">
                {errors[name].message}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Server-side error banner */}
      {serverError && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3" role="alert">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={16} aria-hidden="true" />
            Calculating…
          </>
        ) : (
          <>
            <RefreshCw size={16} aria-hidden="true" />
            Recalculate Score
          </>
        )}
      </button>
    </form>
  );
}
