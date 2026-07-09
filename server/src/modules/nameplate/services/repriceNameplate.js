// Re-price a name-plate cart item from the live template + price rules, matching
// the { errors, designDocument } contract used by the shared repriceItem so name
// plates stay server-authoritative through cart + checkout.

import NpTemplate from '../models/NpTemplate.js';
import { quoteNpDesign } from './quoteDesign.js';

export async function repriceNameplate(designDocument) {
  const np = designDocument?.nameplate || {};
  const template = await NpTemplate.findById(np.templateId).lean();
  if (!template || template.status !== 'active') {
    return { errors: ['This name-plate template is no longer available'], designDocument };
  }
  const { pricePaise, breakdown, errors } = await quoteNpDesign(template, {
    fields: np.fields,
    selections: np.selections,
    elements: np.elements,
  });
  const corrected = {
    ...designDocument,
    pricing: {
      currency: 'INR',
      authoritative: true,
      breakdown,
      subtotalPaise: pricePaise,
      computedAt: new Date().toISOString(),
    },
  };
  return { errors, designDocument: corrected };
}

export default repriceNameplate;
