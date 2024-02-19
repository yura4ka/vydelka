import { Link } from "react-router-dom";
import { MessageSquareText, ShoppingCart } from "lucide-react";
import { cn, formatMoney } from "@/lib/utils";
import { Product } from "../productsApiSlice";
import { Button } from "@/components/ui/button";
import { Filter } from "@/features/categories/categoriesApiSlice";
import { Rating } from "@/components/Rating";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  product: Product;
  filters?: Filter[];
};

export const ProductCard: React.FC<Props> = ({
  product,
  className,
  filters,
  ...rest
}) => {
  return (
    <div
      className={cn(
        "group/product relative z-[2] space-y-2 hover:z-[3]",
        product.filters.size !== 0 &&
          "before:absolute before:-left-2 before:-right-2 before:-top-2 before:bottom-0 before:z-[-1] before:hidden before:bg-background before:shadow-[0_0_4px_4px] before:shadow-border sm:hover:before:block",
        className,
      )}
      {...rest}
    >
      <Link
        to={`/p/${product.slug}`}
        className="group/img relative block py-[50%]"
      >
        <img
          src={`${product.images[0].imageUrl}-/preview/250x250/-/progressive/yes/`}
          alt={product.title}
          title={product.title}
          className="absolute left-1/2 top-1/2 max-h-full max-w-full -translate-x-1/2 -translate-y-1/2 group-hover/img:hidden"
        />
        <img
          src={`${(product.images[1] ?? product.images[0]).imageUrl}-/preview/250x250/-/progressive/yes/`}
          alt={product.title}
          title={product.title}
          className="absolute left-1/2 top-1/2 hidden max-h-full max-w-full -translate-x-1/2 -translate-y-1/2 group-hover/img:block"
        />
      </Link>
      <Link
        to={`/p/${product.slug}`}
        className="line-clamp-2 min-w-0 text-sm leading-tight"
      >
        {product.title}
      </Link>
      <div className="flex items-center gap-2">
        <Rating value={product.rating} readonly />
        <span className="flex items-center gap-1 text-sm tracking-tight text-muted-foreground">
          <MessageSquareText className="h-4 w-4" />
          {product.reviews}
        </span>
      </div>
      <div className="flex items-center justify-between gap-1 text-lg font-medium sm:text-xl">
        {formatMoney(product.price)}
        <Button variant="ghost" size="icon">
          <ShoppingCart className="size-5 xs:size-6" />
        </Button>
      </div>
      <dl className="absolute left-0 hidden w-full bg-background text-xs after:absolute after:-bottom-2 after:-left-2 after:-right-2 after:top-0 after:-z-[1] after:block after:bg-background after:shadow-[0_4px_4px_0,4px_4px_4px_0,-4px_4px_4px_0] after:shadow-border sm:group-hover/product:block">
        {filters?.map((f) => (
          <div key={f.id} className="line-clamp-1">
            <span className="pr-1 text-muted-foreground">{f.title}:</span>
            <span>{product.filters.get(f.id)?.variant}</span>
          </div>
        ))}
      </dl>
    </div>
  );
};
