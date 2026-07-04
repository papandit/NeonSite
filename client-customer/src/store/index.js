import { configureStore } from '@reduxjs/toolkit';
import authReducer, { logout } from './authSlice';
import designReducer from './designSlice';
import cartReducer, { resetCart } from './cartSlice';
import wishlistReducer, { resetWishlist } from './wishlistSlice';
import { setUnauthorizedHandler } from '../services/api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    design: designReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
  },
});

// Wire the axios 401 handler to dispatch logout (breaks the import cycle:
// api never imports the store).
setUnauthorizedHandler(() => {
  store.dispatch(logout());
  store.dispatch(resetCart());
  store.dispatch(resetWishlist());
});
