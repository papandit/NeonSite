// Cart state (server-owned prices). Thunks call the API and store the server's
// response; the header badge + cart page read from here.

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartApi } from '../services/commerce';
import { apiErrorMessage } from '../services/api';

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
    return await cartApi.add(productId, designDocument, quantity);
  } catch (e) {
    return rejectWithValue(apiErrorMessage(e));
  }
});

// Buy as-is: add with a server-built default design.
export const quickAddToCart = createAsyncThunk('cart/quickAdd', async ({ productId, quantity = 1 }, { rejectWithValue }) => {
  try {
    return await cartApi.quickAdd(productId, quantity);
  } catch (e) {
    return rejectWithValue(apiErrorMessage(e));
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
    return await cartApi.remove(itemId);
  } catch (e) {
    return rejectWithValue(apiErrorMessage(e));
  }
});

export const clearCart = createAsyncThunk('cart/clear', async (_, { rejectWithValue }) => {
  try {
    return await cartApi.clear();
  } catch (e) {
    return rejectWithValue(apiErrorMessage(e));
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
