// The single anchor Product that neon cart items reference, so neon signs flow
// through the same cart → checkout → Razorpay → order pipeline as plates. Its
// pricing is computed by quoteNeon (not the option engine); the per-sign spec
// lives in the cart item's designDocument. Upserted on first use.

import Product from '../../models/Product.js';

const NEON_SLUG = 'custom-neon-sign';

export async function getNeonProduct() {
  const doc = await Product.findOneAndUpdate(
    { slug: NEON_SLUG },
    {
      $setOnInsert: {
        name: 'Custom Neon Sign',
        slug: NEON_SLUG,
        description: 'Design-your-own LED neon flex sign on a laser-cut acrylic backboard.',
        basePricePaise: 0, // real price comes from quoteNeon per design
        kind: 'neon',
        status: 'active',
        images: [],
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return doc;
}

export default getNeonProduct;
