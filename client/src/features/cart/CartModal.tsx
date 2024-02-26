import { useTranslation } from "react-i18next";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "./useCart";
import { Loader2, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { useMemo } from "react";
import { Product, useGetProductsQuery } from "../products/productsApiSlice";

export const CartModal = () => {
  const { t } = useTranslation();
  const cart = useCart();

  const ids = useAppSelector(() => cart.getIds());
  const entities = useAppSelector(() => cart.getEntities());
  const { data, isFetching } = useGetProductsQuery(
    { ids },
    { skip: ids.length === 0 },
  );

  const total = useMemo(() => {
    return formatMoney(
      data?.products.reduce(
        (acc, product) =>
          acc + product.price * (entities[product.id]?.count ?? 0),
        0,
      ) ?? 0,
    );
  }, [data?.products, entities]);

  return (
    <Dialog.Root open={cart.isOpen} onOpenChange={cart.setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-0 z-50 grid h-screen w-full max-w-2xl -translate-x-1/2 grid-rows-[auto_1fr_auto] border bg-card text-card-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:my-8 sm:h-auto sm:max-h-[calc(100vh-4rem)] sm:rounded-lg">
          <div className="flex items-center justify-between gap-4 border-b p-4">
            <Dialog.Title className="text-lg font-semibold leading-none tracking-tight">
              {t("navigation.cart")}
            </Dialog.Title>
            <Dialog.Close className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="size-6 text-background dark:text-foreground" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>
          {ids.length === 0 ? (
            <div className="grid place-content-center py-24 text-3xl font-bold">
              {t("cart.empty")}
            </div>
          ) : (
            <div className="scrollbar space-y-8 overflow-y-scroll px-2 py-4 sm:p-4">
              {isFetching && (
                <div className="grid place-content-center">
                  <Loader2 className="size-6 animate-spin" />
                </div>
              )}
              {data?.products.map((p) => (
                <CartProduct key={p.id} product={p} />
              ))}
            </div>
          )}
          {data && ids.length !== 0 && (
            <div className="flex items-center justify-between px-2 py-4 sm:p-4">
              <Button
                onClick={() => cart.setOpen(false)}
                variant="secondary"
                className="hidden sm:flex"
              >
                {t("cart.continue")}
              </Button>
              <div className="flex grow flex-wrap gap-x-8 gap-y-2 rounded border p-4 sm:grow-0 sm:flex-nowrap sm:items-center">
                <div className="flex grow justify-between text-2xl font-bold tracking-tight">
                  <p className="sm:hidden">{t("cart.total")}</p>
                  <p>{total}</p>
                </div>
                <Button
                  onClick={() => cart.setOpen(false)}
                  size="lg"
                  asChild
                  className="w-full gap-2"
                >
                  <Link to={"/checkout"}>
                    <ShoppingBag className="size-5" />
                    {t("cart.place-order")}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

type Props = {
  product: Product;
};

const CartProduct: React.FC<Props> = ({ product: p }) => {
  const cart = useCart();
  const item = useAppSelector(() => cart.getItem(p.id));

  if (!item) return null;

  return (
    <div className="space-y-4 sm:space-y-1">
      <div className="flex gap-4">
        <Link
          to={`/p/${p.slug}`}
          onClick={() => cart.setOpen(false)}
          className="shrink-0"
        >
          <img
            src={`${p.images[0].imageUrl}-/preview/150x150/-/progressive/yes/`}
            className="size-[50px] object-contain sm:size-[100px]"
          />
        </Link>
        <Link
          to={`/p/${p.slug}`}
          onClick={() => cart.setOpen(false)}
          className="self-start transition-colors hover:text-primary"
        >
          {p.title}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="ml-4 text-destructive hover:text-destructive/80"
          onClick={() => cart.removeItem(p.id)}
        >
          <Trash2 />
          <span className="sr-only">Delete item from the cart</span>
        </Button>
      </div>
      <div className="flex items-center justify-between gap-2 sm:justify-end sm:gap-8">
        <div className="flex gap-px">
          <Button
            variant="ghost"
            size="icon"
            disabled={item.count === 1}
            onClick={() => cart.changeItem(p.id, { count: item.count - 1 })}
          >
            <Minus className="size-5 sm:size-4" />
            <span className="sr-only">Decrease quantity</span>
          </Button>
          <Input
            type="number"
            name="quantity"
            value={item.count}
            min={1}
            onChange={(e) =>
              cart.changeItem(p.id, {
                count: e.target.valueAsNumber || 1,
              })
            }
            className="no-arrows w-12 text-center"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => cart.changeItem(p.id, { count: item.count + 1 })}
          >
            <Plus className="size-5 sm:size-4" />
            <span className="sr-only">Increase quantity</span>
          </Button>
        </div>
        <p className="text-lg font-medium">
          {formatMoney(p.price * item.count)}
        </p>
      </div>
    </div>
  );
};
