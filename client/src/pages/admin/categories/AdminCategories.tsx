import { Link, useSearchParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Category,
  Filter,
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useGetFiltersQuery,
} from "@/features/categories/categoriesApiSlice";
import { CategoryForm } from "@/features/categories/components/CategoryForm";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { CategoryFiltersForm } from "@/features/categories/components/CategoryFiltersForm";
import React, { useState } from "react";
import {
  Product,
  ProductsResponse,
  useGetProductsQuery,
} from "@/features/products/productsApiSlice";
import { ProductForm } from "@/features/products/components/ProductForm";
import { useTranslation } from "react-i18next";
import { Language } from "@/features/translations";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/Pagination";

type CategoriesTableProps = {
  categories: Category[] | undefined;
  isLoading: boolean;
};

const CategoriesTable: React.FC<CategoriesTableProps> = ({
  categories,
  isLoading,
}) => {
  return (
    <>
      <h2 className="text-xl font-bold">Categories</h2>
      <Table>
        {isLoading && (
          <TableCaption className="overflow-y-hidden">
            <Loader2 className="animate-spin" />
          </TableCaption>
        )}
        {!isLoading && categories?.length === 0 && (
          <TableCaption>No categories...</TableCaption>
        )}
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Image</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories?.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Link
                  to={`?id=${c.id}`}
                  className="font-semibold hover:underline"
                >
                  {c.title}
                </Link>
              </TableCell>
              <TableCell>{c.slug}</TableCell>
              <TableCell>{new Date(c.createdAt).toLocaleString()}</TableCell>
              <TableCell>
                {c.imageUrl && (
                  <img
                    src={`${c.imageUrl}-/scale_crop/50x50/center/-/progressive/yes/`}
                    alt="cover"
                    loading="lazy"
                    width={50}
                    height={50}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

type ProductsTableProps = {
  data: ProductsResponse | undefined;
  categoryId: string;
  filters: Filter[];
  onError: (msg: string) => void;
};

const ProductsTable: React.FC<ProductsTableProps> = ({
  data,
  categoryId,
  filters,
  onError,
}) => {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "en") as Language;

  const [params, setParams] = useSearchParams();
  const page = Number(params.get("page")) || 1;

  const [productModal, setProductModal] = useState<{
    isOpen: boolean;
    product?: Product;
  }>(() => ({
    isOpen: false,
  }));

  const changePage = (page: number) => {
    const searchParams = new URLSearchParams(params);
    searchParams.set("page", page.toString());
    setParams(searchParams);
  };

  return (
    <>
      <h2 className="text-xl font-bold">Products</h2>
      <Table>
        {!data && (
          <TableCaption className="overflow-y-hidden">
            <Loader2 className="animate-spin" />
          </TableCaption>
        )}
        {data?.products.length === 0 && (
          <TableCaption>No products...</TableCaption>
        )}
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Image</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className={cn(!data && "hidden")}>
            <TableCell colSpan={6}>
              <button
                onClick={() => setProductModal({ isOpen: true })}
                className="flex w-full items-center justify-center gap-2 font-bold"
              >
                <PlusCircle />
                Add Product
              </button>
            </TableCell>
          </TableRow>
          {data?.products.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.titleTranslations[lang]}</TableCell>
              <TableCell>{p.price / 100}</TableCell>
              <TableCell className="max-w-24">
                <p className="line-clamp-1">
                  {p.descriptionTranslations[lang]}
                </p>
              </TableCell>
              <TableCell>
                <img
                  src={`${p.images[0].imageUrl}-/scale_crop/50x50/center/-/progressive/yes/`}
                  alt="cover"
                  loading="lazy"
                  width={50}
                  height={50}
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setProductModal({ isOpen: true, product: p })}
                >
                  <Pencil className="h-5 w-5 text-muted-foreground" />
                  <span className="sr-only">edit product</span>
                </Button>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-5 w-5 text-destructive" />
                  <span className="sr-only">delete product</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination
        page={page}
        totalPages={data?.totalPages ?? 1}
        onChange={changePage}
      />
      <ProductForm
        isOpen={productModal.isOpen}
        setOpen={(open) => setProductModal({ isOpen: open })}
        filters={filters}
        initialData={productModal.product}
        categoryId={categoryId}
        onError={onError}
      />
    </>
  );
};

export const AdminCategories = () => {
  const [params] = useSearchParams();
  const id = params.get("id") ?? undefined;
  const page = Number(params.get("page")) || 1;

  const { data: categories, isFetching: isCategoriesLoading } =
    useGetCategoriesQuery(id);
  const { data: categoryInfo } = useGetCategoryByIdQuery(id ?? "", {
    skip: !id,
  });
  const { data: filters } = useGetFiltersQuery(
    { categoryId: id ?? "", withTranslations: true },
    { skip: !id || categories?.length !== 0 },
  );
  const { data: productsResponse } = useGetProductsQuery(
    { categoryId: id ?? "", withTranslations: true, page },
    { skip: !id || categories?.length !== 0 },
  );

  const { toast } = useToast();
  const onFormError = (msg: string) => {
    toast({ title: "Error", description: msg, variant: "destructive" });
  };

  const isSubcategoriesAllowed =
    !id ||
    ((!filters || filters.length === 0) &&
      (!productsResponse || productsResponse.products.length === 0));
  const isFinalCategory = !categories || categories.length === 0;

  return (
    <main className="container space-y-10 py-8">
      <div className="flex flex-wrap items-start justify-between gap-8">
        {id && (
          <CategoryForm
            className="w-full md:w-auto md:max-w-[600px] md:grow"
            initialData={categoryInfo}
            onSuccess={() =>
              toast({
                title: "Success",
                description: "Category was successfully changed",
              })
            }
            onError={onFormError}
          />
        )}
        {isSubcategoriesAllowed && (
          <CategoryForm
            className="w-full md:w-auto md:max-w-[600px] md:grow"
            parentId={id}
            onError={onFormError}
          />
        )}
      </div>
      {id && isFinalCategory && (
        <>
          <h2 className="text-xl font-bold">Filters</h2>
          {filters ? (
            <CategoryFiltersForm
              filters={filters}
              categoryId={id}
              onError={onFormError}
            />
          ) : (
            <div className="grid place-content-center">
              <Loader2 className="animate-spin" />
            </div>
          )}
        </>
      )}

      {!isSubcategoriesAllowed && isCategoriesLoading && (
        <div className="grid place-content-center">
          <Loader2 className="animate-spin" />
        </div>
      )}
      {isSubcategoriesAllowed && (
        <CategoriesTable
          categories={categories}
          isLoading={isCategoriesLoading}
        />
      )}

      {id && isFinalCategory && (
        <ProductsTable
          data={productsResponse}
          categoryId={id}
          filters={filters ?? []}
          onError={onFormError}
        />
      )}
    </main>
  );
};
