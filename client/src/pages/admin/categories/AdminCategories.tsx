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
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useGetFiltersQuery,
} from "@/features/categories/categoriesApiSlice";
import { CategoryForm } from "@/features/categories/components/CategoryForm";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { CategoryFiltersForm } from "@/features/categories/components/CategoryFiltersForm";

export const AdminCategories = () => {
  const [params] = useSearchParams();
  const id = params.get("id") ?? undefined;

  const { data: categories } = useGetCategoriesQuery(id);
  const { data: categoryInfo } = useGetCategoryByIdQuery(id ?? "", {
    skip: !id,
  });
  const { data: filters } = useGetFiltersQuery(
    { categoryId: id ?? "", withTranslations: true },
    { skip: !id || categories?.length !== 0 },
  );

  const { toast } = useToast();
  const onFormError = (msg: string) => {
    toast({ title: "Error", description: msg, variant: "destructive" });
  };

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
        <CategoryForm
          className="w-full md:w-auto md:max-w-[600px] md:grow"
          parentId={id}
          onError={onFormError}
        />
      </div>
      {id && categories?.length === 0 && (
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
      <h2 className="text-xl font-bold">Categories</h2>
      <Table>
        {!categories && (
          <TableCaption className="overflow-y-hidden">
            <Loader2 className="animate-spin" />
          </TableCaption>
        )}
        {categories?.length === 0 && (
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
    </main>
  );
};
