import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableHead } from "@/components/ui/table";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/useAuth";
import { useCart } from "@/features/cart";
import {
  Order,
  useCancelOrderMutation,
  useGetOrdersQuery,
} from "@/features/orders/ordersApiSlice";
import {
  cn,
  createErrorToast,
  formatMoney,
  formatStringDate,
} from "@/lib/utils";
import { Loader2, MoreVertical } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

export const OrdersPage = () => {
  const { t } = useTranslation();
  const { isLoading: isAuthLoading } = useAuth();
  const cart = useCart();
  const { toast } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const page = +(searchParams.get("page") ?? 1);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const { data, isFetching } = useGetOrdersQuery({ page });

  useEffect(() => {
    const success = searchParams.has("success");
    const canceled = searchParams.has("canceled");
    const confirmed = searchParams.has("confirmed");
    if (success) {
      toast({ title: t("order.thanks"), description: t("order.order-payed") });
    } else if (confirmed) {
      toast({ title: t("order.thanks"), description: t("order.confirmed") });
    } else if (canceled && data) {
      const payLink = data.orders.find(
        (o) => !o.paymentTime && o.payType === "pay_now",
      )?.stripeUrl;
      toast({
        title: t("order.pay-canceled.title"),
        description: t("order.pay-canceled.description"),
        action: payLink ? (
          <ToastAction altText={t("checkout.pay")} asChild>
            <a href={payLink}>{t("checkout.pay")}</a>
          </ToastAction>
        ) : undefined,
      });
    }

    if (success || confirmed || (canceled && data)) {
      cart.removeAll();
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("success");
        next.delete("confirmed");
        next.delete("canceled");
        return next;
      });
    }
  }, [cart, data, searchParams, setSearchParams, t, toast]);

  return (
    <main className="container max-w-screen-2xl space-y-8 px-2 pt-8 xs:px-4">
      <h1 className="text-4xl font-extrabold tracking-tight">
        {t("navigation.orders")}
      </h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b transition-colors hover:bg-muted/50">
            <TableHead>{t("order.number")}</TableHead>
            <TableHead>{t("order.date")}</TableHead>
            <TableHead>{t("order.items-total-title")}</TableHead>
            <TableHead className="hidden lg:table-cell">
              {t("checkout.delivery")}
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              {t("checkout.payment")}
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              {t("order.status.status")}
            </TableHead>
            <TableHead className="hidden sm:table-cell">
              {t("order.actions")}
            </TableHead>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data?.orders.map((o) => <OrderRow key={o.id} order={o} />)}
          {(isFetching || isAuthLoading) && (
            <tr>
              <TableCell className="py-4" colSpan={9}>
                <Loader2 className="mx-auto animate-spin" />
              </TableCell>
            </tr>
          )}
        </tbody>
      </table>
      {data?.orders.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          {t("order.nothing")}
        </p>
      )}
      <Pagination
        page={page}
        totalPages={data?.totalPages ?? 1}
        className="max-w-[calc(100vw-1rem)] pb-8"
      />
    </main>
  );
};

const OrderRow = ({ order: o }: { order: Order }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [cancelOrder, cancelStatus] = useCancelOrderMutation();

  const [isExpanded, setIsExpanded] = useState(false);

  const handleCancel = async () => {
    try {
      await cancelOrder(o.id).unwrap();
      toast({
        title: t("success"),
        description: t("order.order-canceled"),
      });
    } catch {
      toast(createErrorToast());
    }
  };

  const canCancel =
    !o.paymentTime && (o.status === "processing" || o.status === "confirmed");
  const canPay =
    !o.paymentTime &&
    o.payType === "pay_now" &&
    !(o.status === "expired" || o.status === "canceled");
  const hasActions = canCancel || canPay;

  return (
    <>
      <tr
        className={cn(
          "cursor-pointer border-b transition-colors hover:bg-muted/50 has-[button:hover]:bg-background lg:cursor-auto",
          isExpanded && "bg-muted lg:bg-background",
        )}
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <TableCell className="py-4 font-medium underline lg:py-2 lg:no-underline">
          {o.id.slice(0, 8)}
        </TableCell>
        <TableCell>{formatStringDate(o.createdAt, true)}</TableCell>
        <TableCell>
          <p className="hidden lg:block">
            {t("order.items-total", {
              count: o.itemsCount,
              sum: formatMoney(o.total),
            })}
          </p>
          <p className="lg:hidden">{formatMoney(o.total)}</p>
        </TableCell>
        <TableCell className="hidden max-w-52 truncate lg:table-cell">
          {o.deliveryType === "delivery"
            ? o.deliveryAddress
            : t("checkout.takeout")}
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          <OrderPayment order={o} />
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          <OrderStatus order={o} />
        </TableCell>
        <TableCell className="hidden sm:table-cell">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(!hasActions && "flex lg:hidden")}
              >
                <MoreVertical className="size-4" />
                <span className="sr-only">open actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {canCancel && (
                <DropdownMenuItem
                  onClick={handleCancel}
                  disabled={cancelStatus.isLoading}
                >
                  {t("order.cancel")}
                </DropdownMenuItem>
              )}
              {canPay && (
                <DropdownMenuItem asChild>
                  <a href={o.stripeUrl}>{t("order.pay")}</a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="lg:hidden">
                {t("order.more")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <span className={cn("hidden h-9", !hasActions && "lg:block")} />
        </TableCell>
      </tr>
      {isExpanded && (
        <tr className="border-b lg:hidden">
          <TableCell colSpan={4} className="p-0">
            <ul className="divide-y">
              <li className="flex justify-between gap-4 p-2 transition-colors hover:bg-muted/50">
                <p>{t("order.date")}</p>
                <p>{formatStringDate(o.createdAt)}</p>
              </li>
              <li className="flex justify-between gap-4 p-2 transition-colors hover:bg-muted/50">
                <p>{t("order.items-total-title")}</p>
                <p>
                  {t("order.items-total", {
                    count: o.itemsCount,
                    sum: formatMoney(o.total),
                  })}
                </p>
              </li>
              <li className="flex justify-between gap-4 p-2 transition-colors hover:bg-muted/50">
                <p>{t("checkout.delivery")}</p>
                <p>
                  {o.deliveryType === "delivery"
                    ? o.deliveryAddress
                    : t("checkout.takeout")}
                </p>
              </li>
              <li className="flex justify-between gap-4 p-2 transition-colors hover:bg-muted/50">
                <p>{t("checkout.payment")}</p>
                <p>
                  <OrderPayment order={o} />
                </p>
              </li>
              <li className="flex justify-between gap-4 p-2 transition-colors hover:bg-muted/50">
                <p>{t("order.status.status")}</p>
                <p>
                  <OrderStatus order={o} />
                </p>
              </li>
              {hasActions && (
                <li className="flex gap-4 p-2">
                  {canCancel && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleCancel}
                      disabled={cancelStatus.isLoading}
                    >
                      {t("order.cancel")}
                    </Button>
                  )}
                  {canPay && (
                    <Button size="sm" asChild>
                      <a href={o.stripeUrl}>{t("order.pay")}</a>
                    </Button>
                  )}
                </li>
              )}
            </ul>
          </TableCell>
        </tr>
      )}
    </>
  );
};

const OrderPayment = ({ order }: { order: Order }) => {
  const { t } = useTranslation();

  if (order.payType === "pay_receive") {
    return (
      <span className="w-fit min-w-10 rounded-md bg-muted px-2.5 py-0.5 text-sm font-semibold">
        {t("order.payment.receive")}
      </span>
    );
  }

  if (order.paymentTime) {
    return (
      <span className="w-fit min-w-10 rounded-md bg-emerald-100 px-2.5 py-0.5 text-sm font-semibold dark:bg-emerald-700">
        {t("order.payment.payed")}
      </span>
    );
  }

  return (
    <span className="w-fit min-w-10 rounded-md bg-destructive px-2.5 py-0.5 text-sm font-semibold text-destructive-foreground">
      {t("order.payment.pending")}
    </span>
  );
};

const OrderStatus = ({ order }: { order: Order }) => {
  const { t } = useTranslation();
  const { status } = order;

  return (
    <span
      className={cn(
        "w-fit min-w-10 rounded-md px-2.5 py-0.5 text-sm font-semibold",
        status === "processing" && "bg-muted",
        status === "canceled" && "bg-muted text-muted-foreground",
        status === "expired" && "bg-muted/80 text-muted-foreground/80",
        status === "confirmed" && "bg-emerald-100 dark:bg-emerald-700",
        status === "received" && "bg-primary text-primary-foreground",
      )}
    >
      {t(`order.status.${order.status}`)}
    </span>
  );
};
