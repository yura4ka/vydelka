import { useAppSelector } from "@/app/hooks";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Pagination } from "@/components/Pagination";
import { Rating } from "@/components/Rating";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { toCartItem, useCart } from "@/features/cart";
import { ProductImages } from "@/features/products/components/ProductImages";
import { ReviewCard } from "@/features/products/components/ReviewCard";
import { ReviewForm } from "@/features/products/components/ReviewForm";
import {
  useGetProductBySlugQuery,
  useGetProductRouteQuery,
  useGetReviewsQuery,
} from "@/features/products/productsApiSlice";
import { cn, createErrorToast, formatMoney } from "@/lib/utils";
import { Loader2, ShoppingBag, ShoppingCart, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";

const ANCHORS = ["about", "features", "reviews"] as const;

export const ProductPage = () => {
  const { t } = useTranslation();
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = +(searchParams.get("page") ?? 1);

  const { data: product, isError } = useGetProductBySlugQuery(slug ?? "", {
    skip: !slug,
  });
  const { data: routes } = useGetProductRouteQuery(slug ?? "", { skip: !slug });
  const { data: reviews, isFetching: isReviewsFetching } = useGetReviewsQuery(
    { productId: product?.id ?? "", page },
    { skip: !product },
  );

  const cart = useCart();
  const isInCart = !!useAppSelector(() => cart.getItem(product?.id ?? ""));

  const { toast } = useToast();
  const onFormError = () => {
    toast(createErrorToast());
  };

  const onReviewCreated = () => {
    toast({ title: t("success"), description: t("product.reviews.created") });
    setSearchParams(new URLSearchParams());
  };

  const onReviewChanged = () => {
    toast({ title: t("success"), description: t("product.reviews.changed") });
  };

  const onReviewDeleted = () => {
    toast({ title: t("success"), description: t("product.reviews.deleted") });
    setSearchParams(new URLSearchParams());
  };

  if (!slug || isError) return <Navigate to={"/"} />;

  return (
    <main className="container max-w-screen-2xl space-y-8 px-2 py-8 xs:px-4">
      <Breadcrumb routes={routes ?? []} className="-mb-4" />
      <nav className="sticky top-14 z-[5] flex gap-6 border-b-2 bg-background/95 px-1 pb-1 pt-2 text-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {ANCHORS.map((link) => (
          <Link
            key={link}
            to={`#${link}`}
            className="relative transition-colors after:absolute after:-bottom-1 after:block after:h-[2px] after:w-full after:scale-0 after:rounded-sm after:bg-primary after:transition-transform after:duration-300 hover:text-primary hover:after:scale-100"
          >
            {t(`product.navigation.${link}`)}
            {link === "reviews" && <span> {product?.reviews}</span>}
          </Link>
        ))}
      </nav>
      {!product ? (
        <div className="grid place-content-center">
          <Loader2 className="size-8 animate-spin" />
        </div>
      ) : (
        <>
          <section
            id="about"
            className="flex scroll-m-[12rem] flex-col gap-4 md:flex-row"
          >
            <div className="w-full max-w-[calc(100vw-1rem)] shrink-0 xs:max-w-[calc(100vw-2rem)] md:w-1/2">
              <ProductImages images={product?.images} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {product.title}
              </h1>
              <div className="flex items-center gap-2">
                <Rating value={product.rating} readonly />
                <Link to="#reviews" className="text-primary hover:underline">
                  {product.reviews}{" "}
                  {t("product.reviews.reviews", { count: product.reviews })}
                </Link>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-16 gap-y-4 pb-2">
                <div className="text-2xl font-bold tracking-tighter">
                  {formatMoney(product.price)}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="grow"
                    onClick={() =>
                      isInCart
                        ? cart.removeItem(product.id)
                        : cart.addItem(toCartItem(product, 1))
                    }
                  >
                    <ShoppingCart
                      className={cn(
                        "mr-2 size-5",
                        isInCart && "fill-foreground",
                      )}
                    />
                    {isInCart ? t("product.in-cart") : t("product.add-to-cart")}
                  </Button>
                  <Button
                    onClick={() => {
                      if (!isInCart) cart.addItem(toCartItem(product, 1));
                    }}
                    className="grow"
                    variant="secondary"
                    asChild
                  >
                    <Link to={"/checkout"}>
                      <ShoppingBag className="mr-2 size-5" />
                      {t("product.by-now")}
                    </Link>
                  </Button>
                </div>
              </div>
              <p>{product.description}</p>
            </div>
          </section>
          <section id="features" className="scroll-m-[8rem]">
            <h2 className="pb-4 text-xl font-semibold tracking-tight">
              {t("product.navigation.features")}
            </h2>
            <ul className="divide-y text-sm">
              {product.filters.map((f) => (
                <li key={f[0].id} className="flex gap-4 py-2">
                  <p className="shrink-0 basis-1/2">{f[0].title}</p>
                  <p>{f[1].variant}</p>
                </li>
              ))}
            </ul>
          </section>
          <section id="reviews" className="scroll-m-[8rem]">
            <div className="flex items-baseline gap-2 pb-4">
              <h2 className="text-xl font-semibold tracking-tight">
                {t("product.navigation.reviews")}
              </h2>
              <p className="flex items-center gap-px font-medium text-muted-foreground">
                {product.rating.toFixed(1)}
                <Star className="size-4 fill-amber-600 stroke-1" />
              </p>
            </div>
            <div className="space-y-4 md:max-w-screen-sm">
              <ReviewForm
                productId={product.id}
                onSuccess={onReviewCreated}
                onSubmitError={onFormError}
              />
              <div className="grid place-content-center">
                <Loader2
                  className={cn(
                    "-my-2 size-6 animate-spin opacity-0 transition-opacity",
                    isReviewsFetching && "opacity-100",
                  )}
                />
              </div>
              {reviews?.reviews.map((r) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  onEditSuccess={onReviewChanged}
                  onDelete={onReviewDeleted}
                  onError={onFormError}
                />
              ))}
              <Pagination
                page={page}
                totalPages={reviews?.totalPages ?? 1}
                hash="reviews"
                className="max-w-[calc(100vw-1rem)]"
              />
            </div>
          </section>
        </>
      )}
    </main>
  );
};
