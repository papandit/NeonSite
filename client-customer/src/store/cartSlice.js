// Cart state (server-owned prices). Thunks call the API and store the server's
// response; the header badge + cart page read from here.

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartApi } from '../services/commerce';
import { apiErrorMessage } from '../services/api';
import { toast } from '../lib/toast';

const initialState = {
  items: [],
  subtotalPaise: 0,
  count: 0,
  status: 'idle',
  error: null,
  couponCode: null,
};

const setFromServer = (state, action) => {
  state.items = action.payload.items;
  state.subtotalPaise = action.payload.subtotalPaise;
  state.count = action.payload.count;
  state.status = 'succeeded';
  state.error = null;
};

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    return await cartApi.get();
  } catch (e) {
    return rejectWithValue(apiErrorMessage(e));
  }
});

export const addToCart = createAsyncThunk('cart/add', async ({ productId, designDocument, quantity }, { rejectWithValue }) => {
  try {
    const res = await cartApi.add(productId, designDocument, quantity);
    toast.success('Added to cart');
    return res;
  } catch (e) {
    const msg = apiErrorMessage(e);
    toast.error(msg);
    return rejectWithValue(msg);
  }
});

// Buy as-is: add with a server-built default design.
export const quickAddToCart = createAsyncThunk('cart/quickAdd', async ({ productId, quantity = 1, color }, { rejectWithValue }) => {
  try {
    const res = await cartApi.quickAdd(productId, quantity, color);
    toast.success('Added to cart');
    return res;
  } catch (e) {
    const msg = apiErrorMessage(e);
    toast.error(msg);
    return rejectWithValue(msg);
  }
});

export const updateCartItem = createAsyncThunk('cart/update', async ({ itemId, patch }, { rejectWithValue }) => {
  try {
    return await cartApi.update(itemId, patch);
  } catch (e) {
    return rejectWithValue(apiErrorMessage(e));
  }
});

export const removeCartItem = createAsyncThunk('cart/remove', async (itemId, { rejectWithValue }) => {
  try {
    const res = await cartApi.remove(itemId);
    toast.info('Removed from cart');
    return res;
  } catch (e) {
    const msg = apiErrorMessage(e);
    toast.error(msg);
    return rejectWithValue(msg);
  }
});

export const clearCart = createAsyncThunk('cart/clear', async (_, { rejectWithValue }) => {
  try {
    return await cartApi.clear();
  } catch (e) {
    return rejectWithValue(apiErrorMessage(e));
  }
});

// Add a neon sign (server prices it from the live NeonConfig).
export const addNeonToCart = createAsyncThunk('cart/addNeon', async ({ spec, quantity = 1 }, { rejectWithValue }) => {
  try {
    const res = await cartApi.addNeon(spec, quantity);
    toast.success('Neon sign added to cart');
    return res;
  } catch (e) {
    const msg = apiErrorMessage(e);
    toast.error(msg);
    return rejectWithValue(msg);
  }
});

// Add a custom name plate (server prices it from the template + price rules).
export const addNameplateToCart = createAsyncThunk('cart/addNameplate', async (payload, { rejectWithValue }) => {
  try {
    const res = await cartApi.addNameplate(payload);
    toast.success('Name plate added to cart');
    return res;
  } catch (e) {
    const msg = apiErrorMessage(e);
    toast.error(msg);
    return rejectWithValue(msg);
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCoupon(state, action) {
      state.couponCode = action.payload;
    },
    clearCoupon(state) {
      state.couponCode = null;
    },
    resetCart() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.fulfilled, setFromServer)
      .addCase(addToCart.fulfilled, setFromServer)
      .addCase(quickAddToCart.fulfilled, setFromServer)
      .addCase(addNeonToCart.fulfilled, setFromServer)
      .addCase(addNameplateToCart.fulfilled, setFromServer)
      .addCase(updateCartItem.fulfilled, setFromServer)
      .addCase(removeCartItem.fulfilled, setFromServer)
      .addCase(clearCart.fulfilled, (state, action) => {
        setFromServer(state, action);
        state.couponCode = null;
      });
  },
});

export const { setCoupon, clearCoupon, resetCart } = cartSlice.actions;
export const selectCart = (state) => state.cart;
export const selectCartCount = (state) => state.cart.count;

export default cartSlice.reducer;
