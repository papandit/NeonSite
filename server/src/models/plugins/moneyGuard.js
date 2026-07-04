// Mongoose helpers enforcing INVARIANT 1: every *Paise field must be a
// non-negative, safe integer. Reject anything else at the schema level so a
// bad value can never reach the database.

import { isValidPaise } from '../../utils/money.js';

/**
 * A reusable Mongoose SchemaType definition for an integer-paise field.
 * Spread it into a schema path:
 *
 *   basePricePaise: paiseField({ required: true })
 *   priceDeltaPaise: paiseField({ default: 0 })
 *
 * @param {object} [opts]
 * @param {boolean} [opts.required=false]
 * @param {number} [opts.default]
 * @returns {object} Mongoose path definition
 */
export function paiseField({ required = false, default: def } = {}) {
  const def_ = {
    type: Number,
    required,
    validate: {
      validator: isValidPaise,
      message: (props) =>
        `${props.path} must be a non-negative integer number of paise (got ${props.value}). ` +
        `All money is stored as integer paise — never floats or rupees.`,
    },
  };
  if (def !== undefined) def_.default = def;
  return def_;
}

/**
 * Schema plugin that scans ALL number paths whose name ends in "Paise" and
 * attaches the integer-paise validator automatically — a safety net so a new
 * *Paise field can't be added without the guard.
 *
 *   schema.plugin(moneyGuardPlugin)
 *
 * @param {import('mongoose').Schema} schema
 */
export function moneyGuardPlugin(schema) {
  schema.eachPath((pathName, schemaType) => {
    if (!/Paise$/.test(pathName)) return;
    if (schemaType.instance !== 'Number') return;
    schemaType.validate(
      isValidPaise,
      `${pathName} must be a non-negative integer number of paise (invariant 1).`
    );
  });
}

export default moneyGuardPlugin;
