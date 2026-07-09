// The single anchor Product that name-plate cart items reference, so custom
// name plates flow through the same cart -> checkout -> Razorpay -> order
// pipeline. Pricing comes from quoteNpDesign; the design lives in the cart
// item's designDocument. Upserted on first use.

import Product from '../../../models/Product.js';

const SLUG = 'custom-name-plate';

export async function getNameplateProduct() {
  return Product.findOneAndUpdate(
    { slug: SLUG },
    {
      $setOnInsert: {
        name: 'Custom Name Plate',
        slug: SLUG,
        description: 'Personalized name plate designed in the Name Plate Studio.',
        basePricePaise: 0, // real price comes from quoteNpDesign per design
        kind: 'nameplate',
        status: 'active',
        images: [],
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

export default getNameplateProduct;
