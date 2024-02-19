import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export type BreadcrumbRoute = {
  title: string;
  slug: string;
};

type Props = {
  routes: BreadcrumbRoute[];
};

export const Breadcrumb: React.FC<Props> = ({ routes }) => {
  const { t } = useTranslation();

  const mobile = (
    <ul className="md:hidden">
      <li className="flex items-center gap-2 text-sm transition-colors hover:text-primary">
        <ChevronLeft className="h-4 w-4" />
        {routes.length <= 1 ? (
          <Link to="/">{t("navigation.home")}</Link>
        ) : (
          <Link to={`/${routes.at(-2)?.slug}`}>{routes.at(-2)?.title}</Link>
        )}
      </li>
    </ul>
  );

  return (
    <nav>
      {mobile}
      <ul className="hidden flex-wrap items-center gap-2 text-sm md:flex">
        <li className="transition-colors hover:text-primary">
          <Link to="/">
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {routes.map((r) => (
          <li
            key={r.slug}
            className="flex items-center gap-2 transition-colors hover:text-primary last:hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4 shrink-0 text-foreground" />
            <Link to={`/${r.slug}`}>{r.title}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};
