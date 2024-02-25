import {
  PayloadAction,
  createEntityAdapter,
  createListenerMiddleware,
  createSlice,
  isAnyOf,
} from "@reduxjs/toolkit";
import { Product } from "../products/productsApiSlice";
import { RootState } from "@/app/store";

export type CartItem = Pick<Product, "id"> & {
  count: number;
};

function loadState(): CartItem[] {
  const json = localStorage.getItem("cart");
  if (!json) return [];

  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export const cartAdapter = createEntityAdapter<CartItem>();

const initialState = cartAdapter.getInitialState({ isOpen: false });
const prePopulatedState = cartAdapter.setAll(initialState, loadState());

export const cartSlice = createSlice({
  name: "cart",
  initialState: prePopulatedState,
  reducers: {
    addItem: cartAdapter.addOne,
    changeItem: cartAdapter.updateOne,
    removeItem: cartAdapter.removeOne,
    removeAll: cartAdapter.removeAll,
    setOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
  },
});

export const cartActions = cartSlice.actions;
export const cartSelector = cartAdapter.getSelectors();

export const cartListener = createListenerMiddleware();

cartListener.startListening({
  matcher: isAnyOf(...Object.values(cartActions)),
  effect: (action, api) => {
    if (action.type === cartActions.setOpen.type) return;
    api.cancelActiveListeners();
    const state = api.getState() as RootState;
    const cartItems = cartSelector.selectAll(state.cart);
    if (cartItems.length === 0) localStorage.removeItem("cart");
    else localStorage.setItem("cart", JSON.stringify(cartItems));
  },
});

export default cartSlice.reducer;
