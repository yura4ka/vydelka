import { useTranslation } from "react-i18next";
import { Language, createTranslation } from "@/features/translations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChangeFilter,
  ChangeFilterVariant,
  Filter,
  useChangeFilterMutation,
  useChangeFilterVariantMutation,
  useCreateFilterMutation,
  useCreateFilterVariantMutation,
  useDeleteFilterMutation,
  useDeleteFilterVariantMutation,
} from "../categoriesApiSlice";
import { FC, Fragment, useState } from "react";
import { Pencil } from "lucide-react";
import { CustomInput } from "@/components/CustomInput";
import { SubmitButton } from "@/components/SubmitButton";
import { cn, isFetchQueryError } from "@/lib/utils";

const initialForm = () => ({
  translations: createTranslation(),
  slug: "",
});

type EditingFilter = {
  type: "filter" | "variant";
  filterId?: string;
  data?: Filter | Filter["variants"][number];
};

type Props = {
  filters: Filter[];
  categoryId: string;
  onError?: (msg?: string) => void;
};

export const CategoryFiltersForm: FC<Props> = ({
  filters,
  categoryId,
  onError,
}) => {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "en") as Language;

  const [createFilter, createFilterStatus] = useCreateFilterMutation();
  const [createVariant, createVariantStatus] = useCreateFilterVariantMutation();
  const [changeFilter, changeFilterStatus] = useChangeFilterMutation();
  const [changeVariant, changeVariantStatus] = useChangeFilterVariantMutation();
  const [deleteFilter, deleteFilterStatus] = useDeleteFilterMutation();
  const [deleteVariant, deleteVariantStatus] = useDeleteFilterVariantMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<EditingFilter>(() => ({
    type: "filter",
  }));
  const [form, setForm] = useState(() => initialForm());

  const setEdit = (f: EditingFilter) => {
    setCurrentFilter(f);
    setIsModalOpen(true);
    if (!f.data) setForm(initialForm());
    else setForm({ translations: f.data.translations, slug: f.data.slug });
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let request;

    if (currentFilter.type === "filter") {
      const body = {
        categoryId,
        filter: {
          id: currentFilter.data?.id,
          slug: form.slug,
          title: form.translations,
        },
      };
      request = currentFilter.data
        ? changeFilter(body as ChangeFilter)
        : createFilter(body);
    } else {
      const body = {
        categoryId,
        filterId: currentFilter.filterId!,
        variant: {
          id: currentFilter.data?.id,
          slug: form.slug,
          variant: form.translations,
        },
      };
      request = currentFilter.data
        ? changeVariant(body as ChangeFilterVariant)
        : createVariant(body);
    }

    try {
      await request.unwrap();
      setIsModalOpen(false);
    } catch (e) {
      if (isFetchQueryError(e)) onError?.(e.data.message);
      else onError?.();
    }
  };

  const onDelete = async () => {
    let request;
    if (currentFilter.type === "filter")
      request = deleteFilter({ categoryId, id: currentFilter.data!.id });
    else
      request = deleteVariant({
        categoryId,
        filterId: currentFilter.filterId!,
        id: currentFilter.data!.id,
      });

    await request
      .unwrap()
      .then(() => setIsModalOpen(false))
      .catch(() => onError?.());
  };

  const translations = Object.entries(form.translations);
  const isLoading =
    createFilterStatus.isLoading ||
    createVariantStatus.isLoading ||
    changeFilterStatus.isLoading ||
    changeVariantStatus.isLoading ||
    deleteFilterStatus.isLoading ||
    deleteVariantStatus.isLoading;
  const disabled =
    form.slug.trim().length === 0 ||
    translations.some(([, v]) => v.trim().length === 0);

  return (
    <>
      <div className="space-y-4">
        <Button
          size="sm"
          className="block"
          onClick={() => setEdit({ type: "filter" })}
        >
          Add filter
        </Button>
        {filters.map((f) => (
          <Fragment key={f.id}>
            <button
              className="flex items-center justify-center gap-1 font-bold hover:underline"
              onClick={() => setEdit({ type: "filter", data: f })}
            >
              {f.translations[lang]}
              <Pencil className="h-4 w-4" />
            </button>
            <div className="flex flex-wrap gap-2">
              {f.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() =>
                    setEdit({ type: "variant", filterId: f.id, data: v })
                  }
                  className="grid min-w-10 place-content-center rounded-md bg-secondary px-2.5 py-0.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80"
                >
                  {v.translations[lang]}
                </button>
              ))}
              <Button
                onClick={() => setEdit({ type: "variant", filterId: f.id })}
                className="grid h-auto min-w-10 place-content-center rounded-md px-2.5 py-0.5 text-sm font-semibold"
              >
                Add variant
              </Button>
            </div>
          </Fragment>
        ))}
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentFilter.data ? "Edit" : "Create"} {currentFilter.type}
            </DialogTitle>
            <DialogDescription>
              {currentFilter.data ? "Make changes to the" : "Create a new"}{" "}
              {currentFilter.type}
              {currentFilter.data ? ", or delete it." : "."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit}>
            <div className="grid gap-4 py-4">
              <h3 className="text-sm font-medium leading-none">Title</h3>
              {translations.map(([key, t]) => (
                <CustomInput
                  key={key}
                  label={key}
                  value={t}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      translations: {
                        ...prev.translations,
                        [key]: e.target.value,
                      },
                    }))
                  }
                  autoComplete="off"
                />
              ))}
              <CustomInput
                label="Slug"
                value={form.slug}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, slug: e.target.value }))
                }
                autoComplete="off"
              />
            </div>
            <DialogFooter
              className={cn(
                "gap-4 sm:justify-between sm:gap-2",
                !currentFilter.data && "sm:justify-end",
              )}
            >
              {currentFilter.data && (
                <Button onClick={onDelete} type="button" variant="destructive">
                  Delete
                </Button>
              )}
              <SubmitButton isLoading={isLoading} disabled={disabled}>
                Save changes
              </SubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
