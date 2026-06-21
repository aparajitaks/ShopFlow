'use strict';

const { z } = require('zod');

/**
 * Zod schema for the POST /trust-score request body.
 *
 * Validation rules:
 *  - All numeric fields must be non-negative integers (except avg_order_value which can be decimal)
 *  - orders must be > 0 (prevents divide-by-zero in scoring)
 *  - delivered + rto + cancelled must not exceed orders (logical impossibility check)
 *  - cod_orders must not exceed orders
 */
const trustScoreSchema = z.object({
  customer_id: z
    .string({ required_error: 'customer_id is required' })
    .min(1, 'customer_id cannot be empty')
    .max(64, 'customer_id must be 64 characters or fewer'),

  orders: z
    .number({ required_error: 'orders is required', invalid_type_error: 'orders must be a number' })
    .int('orders must be an integer')
    .positive('orders must be greater than 0'),

  delivered: z
    .number({ required_error: 'delivered is required', invalid_type_error: 'delivered must be a number' })
    .int('delivered must be an integer')
    .min(0, 'delivered cannot be negative'),

  rto: z
    .number({ required_error: 'rto is required', invalid_type_error: 'rto must be a number' })
    .int('rto must be an integer')
    .min(0, 'rto cannot be negative'),

  cancelled: z
    .number({ required_error: 'cancelled is required', invalid_type_error: 'cancelled must be a number' })
    .int('cancelled must be an integer')
    .min(0, 'cancelled cannot be negative'),

  avg_order_value: z
    .number({ required_error: 'avg_order_value is required', invalid_type_error: 'avg_order_value must be a number' })
    .min(0, 'avg_order_value cannot be negative'),

  cod_orders: z
    .number({ required_error: 'cod_orders is required', invalid_type_error: 'cod_orders must be a number' })
    .int('cod_orders must be an integer')
    .min(0, 'cod_orders cannot be negative'),
})
  // Cross-field validation: delivered + rto + cancelled must not exceed orders
  .refine(
    (data) => data.delivered + data.rto + data.cancelled <= data.orders,
    {
      message: 'delivered + rto + cancelled cannot exceed total orders',
      path: ['delivered'],
    }
  )
  // Cross-field validation: cod_orders cannot exceed total orders
  .refine(
    (data) => data.cod_orders <= data.orders,
    {
      message: 'cod_orders cannot exceed total orders',
      path: ['cod_orders'],
    }
  );

module.exports = { trustScoreSchema };
