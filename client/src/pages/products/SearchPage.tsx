import { Pagination } from "@/components/Pagination";
import { ProductCard } from "@/features/products/components/ProductCard";
import { useGetProductsQuery } from "@/features/products/productsApiSlice";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

export const SearchPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const page = +(searchParams.get("page") ?? 1);
  const search = (searchParams.get("q") ?? "").trim();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const { data, isFetching } = useGetProductsQuery(
    { search, page },
    { skip: !search },
  );

  return (
    <main className="container max-w-screen-2xl space-y-8 px-2 py-8 xs:px-4">
      <h1 className="text-4xl font-extrabold tracking-tight">
        {t("product.search-results")}: {search} {data && `(${data.total})`}
      </h1>
      <section className="relative space-y-4">
        <ul className="grid grid-cols-2 border-l border-t sm:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
          {data?.products.map((p) => (
            <li key={p.id} className="min-w-28 border-b border-r sm:min-w-60">
              <ProductCard product={p} className="p-2 xs:p-4" />
            </li>
          ))}
        </ul>
        {data?.products.length === 0 && (
          <p className="text-center text-xl text-muted-foreground">
            {t("product.not-found")}
          </p>
        )}
        {isFetching && (
          <div className="absolute -top-4 z-[3] flex h-full w-full justify-center bg-black/75">
            <Loader2 className="fixed top-1/2 h-8 w-8 animate-spin" />
          </div>
        )}
        <Pagination page={page} totalPages={data?.totalPages ?? 1} />
      </section>
    </main>
  );
};
