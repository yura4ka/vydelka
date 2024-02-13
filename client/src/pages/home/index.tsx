import { useGetCategoriesQuery } from "@/features/categories/categoriesApiSlice";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const CategoriesSection = () => {
  const { t } = useTranslation();
  const { data: categories, isFetching } = useGetCategoriesQuery();

  return (
    <section className="hidden bg-accent py-8 text-accent-foreground shadow-md shadow-accent sm:block">
      <h1 className="pb-8 text-center text-4xl font-extrabold tracking-tight">
        {t("navigation.categories")}
      </h1>
      {!categories || isFetching ? (
        <div className="container grid h-10 place-content-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <ul className="container grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-8">
          {categories.map((c) => (
            <li key={c.id} className="justify-self-center">
              <Link
                to={c.slug}
                className="flex h-full w-28 flex-col items-center gap-2 transition-colors hover:text-primary"
              >
                <img
                  className="rounded"
                  src={`${c.imageUrl}-/scale_crop/75x75/center/-/progressive/yes/`}
                  width={75}
                  height={75}
                  alt={c.title}
                  title={c.title}
                />
                <h3 className="line-clamp-2 text-center text-sm font-medium leading-tight tracking-tight">
                  {c.title}
                </h3>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const PopularProductsSection = () => {
  const { t } = useTranslation();

  return (
    <section className="container py-8">
      <h1 className="text-2xl font-bold tracking-tight">{t("home.popular")}</h1>
    </section>
  );
};

const RecentProductsSection = () => {
  const { t } = useTranslation();

  return (
    <section className="container py-8">
      <h1 className="text-2xl font-bold tracking-tight">{t("home.recent")}</h1>
    </section>
  );
};

export const Home = () => {
  return (
    <main>
      <CategoriesSection />
      <PopularProductsSection />
      <RecentProductsSection />
    </main>
  );
};
