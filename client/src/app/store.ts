import {
  configureStore,
} from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import cartReducer, { cartListener } from "../features/cart/cartSlice";
import { api } from "./api/apiSlice";

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    cart: cartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false })
      .prepend(cartListener.middleware)
      .concat(api.middleware),
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
