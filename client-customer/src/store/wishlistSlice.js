// Per-user wishlist (server-backed for logged-in users).

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../services/api';
import { toast } from '../lib/toast';

const initialState = { ids: [], products: [], status: 'idle' };

export const fetchWishlist = createAsyncThunk('wishlist/fetch', async () => {
  const { data } = await api.get('/wishlist');
  return data.data; // { products, ids }
});

export const toggleWishlistItem = createAsyncThunk('wishlist/toggle', async (productId) => {
  const { data } = await api.post('/wishlist/toggle', { productId });
  toast.info(data.data.wishlisted ? 'Added to wishlist' : 'Removed from wishlist');
  return data.data; // { productId, wishlisted, ids }
});

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    resetWishlist: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.products = action.payload.products;
        state.ids = action.payload.ids;
        state.status = 'succeeded';
      })
      .addCase(toggleWishlistItem.fulfilled, (state, action) => {
        state.ids = action.payload.ids;
        // Drop from the products list if it was removed.
        if (!action.payload.wishlisted) {
          state.products = state.products.filter((p) => String(p._id) !== String(action.payload.productId));
        }
      });
  },
});

export const { resetWishlist } = wishlistSlice.actions;
export const selectWishlistIds = (state) => state.wishlist.ids;
export const selectWishlistProducts = (state) => state.wishlist.products;
export default wishlistSlice.reducer;
