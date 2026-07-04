import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const WishlistSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

const Wishlist = model('Wishlist', WishlistSchema);
export default Wishlist;
