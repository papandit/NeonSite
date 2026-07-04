import Cart from '../../models/Cart.js';

export async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

// Subtotal from SERVER-stored unit prices (set on every write). INVARIANT 2.
export function cartSubtotalPaise(cart) {
  return cart.items.reduce((sum, it) => sum + it.unitPricePaise * it.quantity, 0);
}

// Client-facing cart with populated product basics + subtotal.
export async function serializeCart(cart) {
  await cart.populate('items.product', 'name slug images basePricePaise status');
  const items = cart.items.map((it) => ({
    _id: it._id,
    product: it.product,
    designDocument: it.designDocument,
    quantity: it.quantity,
    unitPricePaise: it.unitPricePaise,
    lineTotalPaise: it.unitPricePaise * it.quantity,
    previewImageUrl: it.designDocument?.render?.previewImageUrl || null,
  }));
  return {
    items,
    subtotalPaise: cartSubtotalPaise(cart),
    count: items.reduce((n, it) => n + it.quantity, 0),
  };
}
