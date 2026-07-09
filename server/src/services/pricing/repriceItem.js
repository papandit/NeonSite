// Single place that re-prices a cart item from live DB values (INVARIANT 2).
// Neon products are priced by quoteNeon (Neon Studio catalogue); everything else
// by the option-delta engine (quoteDesign). Both the cart controller and the
// checkout re-validation route through here so neon stays server-authoritative
// wherever an item is (re)priced.

import { quoteDesign } from './quoteDesign.js';
import { quoteNeon } from '../neon/quoteNeon.js';
import { getNeonConfig } from '../../models/NeonConfig.js';
import { repriceNameplate } from '../../modules/nameplate/services/repriceNameplate.js';

export function isNeon(product, designDocument) {
  return product?.kind === 'neon' || designDocument?.kind === 'neon';
}

export function isNameplate(product, designDocument) {
  return product?.kind === 'nameplate' || designDocument?.kind === 'nameplate';
}

/**
 * @returns {Promise<{ errors: string[], designDocument: object }>}
 */
export async function repriceItem(product, designDocument) {
  if (isNameplate(product, designDocument)) {
    return repriceNameplate(designDocument);
  }
  if (isNeon(product, designDocument)) {
    const config = await getNeonConfig();
    return quoteNeon(config, designDocument);
  }
  return quoteDesign(product, designDocument);
}

export default repriceItem;
