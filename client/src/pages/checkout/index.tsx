import { Fragment, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, CreditCard, Loader2 } from "lucide-react";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { useAuth } from "@/features/auth/useAuth";
import { useCart } from "@/features/cart";
import { useGetProductsQuery } from "@/features/products/productsApiSlice";
import { cn, createErrorToast, formatMoney } from "@/lib/utils";
import { useAppSelector } from "@/app/hooks";
import { CustomInput } from "@/components/CustomInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Link, useNavigate } from "react-router-dom";
import {
  DeliveryType,
  NewOrder,
  PaymentType,
  useCheckoutMutation,
} from "@/features/orders/ordersApiSlice";
import { useToast } from "@/components/ui/use-toast";

const initialForm = (): Omit<Required<NewOrder>, "products"> => ({
  deliveryType: "delivery",
  address: "",
  paymentType: "pay_now",
});

export const CheckoutPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const auth = useAuth();
  const cart = useCart();

  const ids = useAppSelector(() => cart.getIds());
  const entities = useAppSelector(() => cart.getEntities());
  const products = useAppSelector(() => cart.getAll());

  const { data, isFetching } = useGetProductsQuery(
    { ids },
    { skip: ids.length === 0 },
  );
  const [checkout, checkoutStatus] = useCheckoutMutation();

  const [stage, setStage] = useState(0);
  const [form, setForm] = useState(() => initialForm());
  const changeFrom = (patch: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const onError = () => {
    toast(createErrorToast());
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const address = form.address.trim();

    try {
      const { url } = await checkout({
        ...form,
        products,
        address: address.length === 0 ? undefined : address,
      }).unwrap();
      if (form.paymentType === "pay_now") window.location.replace(url);
      else navigate("/orders?confirmed");
    } catch {
      onError();
    }
  };

  const total = useMemo(() => {
    return (
      data?.products.reduce(
        (acc, p) => acc + p.price * (entities[p.id]?.count ?? 1),
        0,
      ) ?? 0
    );
  }, [data?.products, entities]);

  const isWrongDelivery =
    form.deliveryType === "delivery" && form.address.trim().length === 0;

  if (ids.length === 0) {
    return (
      <main className="grid content-center justify-items-center">
        <div className="h-fit w-full max-w-sm space-y-8 rounded-lg bg-card p-4 text-card-foreground sm:border sm:px-6">
          <h1 className="text-center text-2xl font-semibold tracking-tight">
            {t("checkout.checkout")}
          </h1>
          <p className="text-center text-2xl font-bold">{t("cart.empty")}</p>
          <Button asChild className="w-full">
            <Link to={"/"}>{t("cart.continue")}</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container grid content-start justify-center gap-x-8 p-0 sm:gap-y-16 sm:p-4 lg:grid-cols-[60%_1fr]">
      <div className="top-[4.6rem] h-fit w-full rounded-lg bg-card text-card-foreground sm:border lg:sticky">
        <h1 className="px-4 py-6 text-2xl font-semibold tracking-tight sm:p-6">
          {t("checkout.checkout")}
        </h1>
        <nav className="flex items-center justify-stretch px-4 pb-6 sm:px-6">
          {new Array(3).fill(0).map((_, i) => (
            <Fragment key={i}>
              <button
                onClick={() => setStage(i)}
                className={cn(
                  "size-12 shrink-0 rounded-full border-2 text-lg transition-colors delay-0",
                  stage >= i && "delay-350 border-primary text-primary",
                )}
                disabled={
                  (i === 1 && !auth.isAuth) || (i === 2 && isWrongDelivery)
                }
              >
                {i + 1}
              </button>
              <span
                className={cn(
                  "grow-1 after:duration-350 relative h-2 w-full bg-border after:absolute after:block after:h-full after:w-full after:origin-left after:scale-x-0 after:bg-primary after:transition-transform last:hidden",
                  stage > i && "after:scale-x-100",
                )}
              />
            </Fragment>
          ))}
        </nav>
        {stage === 0 && (
          <>
            <h2 className="px-4 text-lg font-semibold tracking-tight sm:px-6">
              {t("checkout.contacts")}
            </h2>
            {auth.isAuth ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setStage((prev) => prev + 1);
                }}
                className="grid gap-4 px-4 py-6 sm:grid-cols-2 sm:p-6"
              >
                <CustomInput
                  label={t("auth.first-name")}
                  defaultValue={auth.user.firstName}
                  disabled={true}
                  readOnly={true}
                />
                <CustomInput
                  label={t("auth.last-name")}
                  defaultValue={auth.user.lastName}
                  disabled={true}
                  readOnly={true}
                />
                <CustomInput
                  label={t("auth.email.label")}
                  defaultValue={auth.user.email}
                  disabled={true}
                  readOnly={true}
                />
                <CustomInput
                  label={t("auth.phone.label")}
                  defaultValue={auth.user.phoneNumber}
                  disabled={true}
                  readOnly={true}
                />
                <Button className="sm:col-span-2">
                  {t("checkout.continue")}
                </Button>
              </form>
            ) : (
              <LoginForm className="max-w-full border-0" />
            )}
          </>
        )}
        {stage === 1 && (
          <>
            <h2 className="px-4 text-lg font-semibold tracking-tight sm:px-6">
              {t("checkout.delivery")}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStage((prev) => prev + 1);
              }}
              className="grid gap-4 px-4 py-6 sm:p-6"
            >
              <RadioGroup
                defaultValue={form.deliveryType}
                name="delivery"
                onValueChange={(value: DeliveryType) =>
                  changeFrom({ deliveryType: value })
                }
              >
                <div className="group flex space-x-2 rounded p-4 ring-border has-[:checked]:ring-1">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label
                    htmlFor="delivery"
                    className="w-full space-y-4 group-has-[:checked]:w-full"
                  >
                    <p>{t("checkout.delivery")}</p>
                    <div className="hidden group-has-[:checked]:block">
                      <CustomInput
                        label={t("checkout.address")}
                        value={form.address}
                        onChange={(e) =>
                          changeFrom({ address: e.target.value })
                        }
                      />
                    </div>
                  </Label>
                </div>
                <div className="flex space-x-2 rounded p-4 ring-border has-[:checked]:ring-1">
                  <RadioGroupItem value="self" id="self" />
                  <Label htmlFor="self" className="w-full">
                    {t("checkout.takeout")}
                  </Label>
                </div>
              </RadioGroup>
              <Button disabled={isWrongDelivery} className="mt-4">
                {t("checkout.continue")}
              </Button>
            </form>
          </>
        )}
        {stage === 2 && (
          <>
            <h2 className="px-4 text-lg font-semibold tracking-tight sm:px-6">
              {t("checkout.payment")}
            </h2>
            <form onSubmit={onSubmit} className="grid gap-4 px-4 py-6 sm:p-6">
              <RadioGroup
                defaultValue="pay_now"
                onValueChange={(value: PaymentType) =>
                  changeFrom({ paymentType: value })
                }
                name="payment"
              >
                <div className="flex items-center space-x-2 rounded p-4 ring-border has-[:checked]:ring-1">
                  <RadioGroupItem value="pay_now" id="pay_now" />
                  <Label className="w-full" htmlFor="pay_now">
                    {t("checkout.pay-now")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded p-4 ring-border has-[:checked]:ring-1">
                  <RadioGroupItem value="pay_receive" id="pay_receive" />
                  <Label className="w-full" htmlFor="pay_receive">
                    {t("checkout.pay-receive")}
                  </Label>
                </div>
              </RadioGroup>
              <Button
                className="mt-4 gap-2"
                disabled={checkoutStatus.isLoading}
              >
                {form.paymentType === "pay_now" && (
                  <>
                    <CreditCard className="size-4" />
                    {t("checkout.pay")}
                  </>
                )}
                {form.paymentType === "pay_receive" && (
                  <>
                    <Check className="size-4" />
                    {t("checkout.confirm")}
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </div>
      <div className="h-fit max-w-screen-sm space-y-6 rounded-lg bg-card px-4 py-6 text-card-foreground sm:border lg:max-w-max">
        <h1 className="flex items-baseline justify-between text-2xl font-semibold tracking-tight">
          <p>{t("checkout.items")}</p>
          <Button variant="link" onClick={() => cart.setOpen(true)}>
            {t("checkout.edit-items")}
          </Button>
        </h1>
        <div className="flex items-center justify-between gap-2 rounded border bg-border p-4 font-bold">
          <p className="text-xl">{t("cart.total")}</p>
          <p className="text-2xl tracking-tight">{formatMoney(total)}</p>
        </div>
        <div className="space-y-4">
          {isFetching && (
            <div className="grid place-content-center">
              <Loader2 className="size-6 animate-spin" />
            </div>
          )}
          {data?.products.map((p) => (
            <div key={p.id} className="flex gap-4">
              <Link to={`/p/${p.slug}`} className="shrink-0">
                <img
                  src={`${p.images[0].imageUrl}-/preview/100x100/-/progressive/yes/`}
                  className="size-[75px] object-contain"
                />
              </Link>
              <div className="flex flex-col justify-between">
                <Link
                  to={`/p/${p.slug}`}
                  className="self-start transition-colors hover:text-primary"
                >
                  {p.title}
                </Link>
                <div className="flex items-end justify-between tracking-tight">
                  <p className="text-sm text-muted-foreground">
                    {entities[p.id]?.count ?? 1} x {formatMoney(p.price)}
                  </p>
                  <p className="font-medium">
                    {formatMoney(p.price * (entities[p.id]?.count ?? 1))}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};
