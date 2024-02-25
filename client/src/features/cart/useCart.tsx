import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { CartItem, cartActions, cartSelector } from "./cartSlice";
import { store } from "@/app/store";
import { Product } from "../products/productsApiSlice";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useTranslation } from "react-i18next";

export function toCartItem(product: Product, count: number): CartItem {
  return {
    id: product.id,
    count,
  };
}

export function useCart() {
  const { toast } = useToast();
  const { t } = useTranslation();

  const getCartState = () => store.getState().cart;
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.cart.isOpen);
  const setOpen = (open: boolean) => dispatch(cartActions.setOpen(open));

  const addItem = (item: CartItem) => {
    dispatch(cartActions.addItem(item));
    toast({
      title: t("cart.added"),
      action: (
        <ToastAction altText={t("cart.open")} onClick={() => setOpen(true)}>
          {t("cart.open")}
        </ToastAction>
      ),
    });
  };
  const changeItem = (id: string, changes: Partial<CartItem>) =>
    dispatch(cartActions.changeItem({ id, changes }));
  const removeItem = (id: string) => dispatch(cartActions.removeItem(id));
  const removeAll = () => dispatch(cartActions.removeAll());

  const getAll = () => cartSelector.selectAll(getCartState());
  const getItem = (id: string) =>
    cartSelector.selectById(getCartState(), id) as CartItem | undefined;
  const getIds = () => cartSelector.selectIds(getCartState());
  const getEntities = () => cartSelector.selectEntities(getCartState());

  return {
    isOpen,
    setOpen,
    addItem,
    changeItem,
    removeItem,
    removeAll,
    getAll,
    getItem,
    getIds,
    getEntities,
  };
}
