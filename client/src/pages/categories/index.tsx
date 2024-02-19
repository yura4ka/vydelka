import { Link, useParams } from "react-router-dom";
import {
  CategoryNavigation,
  useGetCategoryBySlugQuery,
  useGetCategoryNavigationQuery,
  useGetCategoryRouteQuery,
  useGetFiltersQuery,
} from "@/features/categories/categoriesApiSlice";
import { cn, sortBySubcategories } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Filter, Loader2 } from "lucide-react";
import {
  ProductsResponse,
  useGetPopularProductsQuery,
  useGetProductsQuery,
} from "@/features/products/productsApiSlice";
import { ProductCard } from "@/features/products/components/ProductCard";
import { Pagination } from "@/components/Pagination";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CategoriesProps = {
  categories: CategoryNavigation[] | undefined;
};

const Categories: React.FC<CategoriesProps> = ({ categories }) => {
  const sorted = categories?.slice().sort(sortBySubcategories);

  return (
    <section>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4 md:gap-x-8">
        {sorted?.map((c) => (
          <div key={c.id} className="flex flex-col gap-2">
            <Link
              to={`/${c.slug}`}
              className="space-y-2 transition-colors hover:text-primary"
            >
              <img
                className="mx-auto aspect-square w-full rounded"
                src={`${c.imageUrl}-/scale_crop/250x250/center/-/progressive/yes/`}
                alt={c.title}
                title={c.title}
              />
              <h3
                className={cn(
                  "line-clamp-2 font-medium",
                  !c.subcategories && "text-center",
                )}
              >
                {c.title}
              </h3>
            </Link>
            <ul>
              {c.subcategories?.map((c2) => (
                <li key={c2.id}>
                  <Link
                    to={`/${c2.slug}`}
                    className="line-clamp-2 text-sm leading-6 transition-colors hover:text-primary"
                  >
                    {c2.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

type ProductSectionProps = {
  data: ProductsResponse;
  isFetching: boolean;
  categoryId: string;
};

const ProductSection: React.FC<ProductSectionProps> = ({
  data,
  isFetching,
  categoryId,
}) => {
  const { data: filters } = useGetFiltersQuery({ categoryId });

  const onChange = (page: number) => {
    console.log(page);
  };

  if (data.products.length === 0) return null;

  return (
    <div className="relative grid grid-cols-[auto_1fr]">
      <div className="col-span-2 flex justify-between py-4 lg:justify-end">
        <Button variant="secondary" size="lg" className="flex lg:hidden">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="By rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="apple">New</SelectItem>
              <SelectItem value="banana">Cheapest</SelectItem>
              <SelectItem value="blueberry">Most expensive</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <aside className="scrollbar sticky top-14 hidden max-h-[calc(100vh-3.5rem)] min-w-64 space-y-4 self-start overflow-y-scroll border-r border-t py-4 lg:block">
        {filters?.map((f) => (
          <div key={f.id}>
            <h3 className="pb-2 font-medium">{f.title}</h3>
            <div className="space-y-1">
              {f.variants.map((v) => (
                <Label key={v.id} className="flex cursor-pointer items-center">
                  <Checkbox className="mr-2" />
                  {v.variant}
                </Label>
              ))}
            </div>
          </div>
        ))}
      </aside>
      <section className="relative col-span-2 space-y-4 lg:col-span-1">
        <ul className="grid grid-cols-2 border-l border-t sm:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
          {data.products.map((p) => (
            <li key={p.id} className="min-w-28 border-b border-r sm:min-w-60">
              <ProductCard
                product={p}
                filters={filters}
                className="p-2 xs:p-4 [&>dl]:px-2 xs:[&>dl]:px-4"
              />
            </li>
          ))}
        </ul>
        <div
          className={cn(
            "flex justify-center opacity-0 transition-opacity",
            isFetching && "opacity-100",
          )}
        >
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <Pagination page={1} totalPages={data.totalPages} onChange={onChange} />
      </section>
    </div>
  );
};

export const CategoryPage = () => {
  const { t } = useTranslation();
  const { slug } = useParams();

  const { data: routes } = useGetCategoryRouteQuery(slug ?? "", {
    skip: !slug,
  });
  const { data, isFetching: isDataFetching } = useGetCategoryBySlugQuery(
    slug ?? "",
    { skip: !slug },
  );
  const { data: categories, isFetching: isCategoryFetching } =
    useGetCategoryNavigationQuery(slug);
  const {
    data: products,
    isFetching: isProductsFetching,
    isLoading: isProductLoading,
  } = useGetProductsQuery(
    { categoryId: data?.id ?? "" },
    { skip: !data || categories?.length !== 0 },
  );
  const { data: popular } = useGetPopularProductsQuery(slug, {
    skip: !categories || categories.length === 0,
  });

  if (isDataFetching || isCategoryFetching || isProductLoading) {
    return (
      <main className="grid place-content-center space-y-8 px-2 py-8 sm:container xs:px-4 sm:max-w-screen-2xl">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    );
  }

  return (
    <main className="px-2 py-8 sm:container xs:px-4 sm:max-w-screen-2xl">
      <Breadcrumb routes={routes ?? []} />
      <h1 className="pt-8 text-4xl font-extrabold tracking-tight">
        {data?.title ?? t("navigation.categories")}
      </h1>
      {!data || !products || categories?.length !== 0 ? (
        <div className="space-y-8 pt-8">
          <Categories categories={categories} />
          <h2 className="text-2xl font-bold tracking-tight">
            {t("home.popular")}
          </h2>
          <div className="scrollbar grid snap-x snap-mandatory auto-cols-[50%] grid-flow-col gap-8 overflow-x-scroll overscroll-x-contain pb-4 sm:auto-cols-[20%]">
            {popular?.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                className="min-w-0 snap-start"
              />
            ))}
          </div>
        </div>
      ) : (
        <ProductSection
          data={products}
          isFetching={isProductsFetching}
          categoryId={data.id}
        />
      )}
    </main>
  );
};
