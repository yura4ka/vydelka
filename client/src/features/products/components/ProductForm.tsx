import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Product,
  ProductImage,
  ProductFilterVariant,
  useCreateProductMutation,
  useChangeProductMutation,
} from "../productsApiSlice";
import { CustomInput } from "@/components/CustomInput";
import { SubmitButton } from "@/components/SubmitButton";
import { Language, createTranslation } from "@/features/translations";
import React, { Fragment, useEffect, useState } from "react";
import { CustomTextArea } from "@/components/CustomTextArea";
import { Filter } from "@/features/categories/categoriesApiSlice";
import { useTranslation } from "react-i18next";
import {
  FileUploader,
  UploadTrigger,
  UploaderPreview,
} from "@/components/FileUploader";
import { OutputFileEntry } from "@uploadcare/blocks";

const initialForm = (initialData?: Product) => ({
  title: initialData?.titleTranslations ?? createTranslation(),
  description: initialData?.descriptionTranslations ?? createTranslation(),
  slug: initialData?.slug ?? "",
  price: (initialData?.price ?? 0) / 100,
  filters: initialData?.filters ?? new Map<string, ProductFilterVariant>(),
  images: (initialData?.images.map((img) => ({
    uuid: img.id,
    cdnUrl: img.imageUrl,
    imageInfo: {
      width: img.width,
      height: img.height,
    },
  })) ?? []) as OutputFileEntry[],
});

const checkForm = (
  form: ReturnType<typeof initialForm>,
  filterSize: number,
) => {
  for (const v of Object.values(form)) {
    if (typeof v === "string") {
      if (v.trim().length === 0) return false;
      continue;
    }

    if (Array.isArray(v)) {
      if (v.length === 0 || v.some((img) => !img.uuid)) return false;
      continue;
    }

    if (v instanceof Map) {
      if (v.size !== filterSize) return false;
      continue;
    }

    if (typeof v === "object") {
      if (Object.values(v).some((s) => s.trim().length === 0)) return false;
      continue;
    }
  }

  return true;
};

type Props = {
  initialData?: Product;
  categoryId: string;
  filters: Filter[];
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  onError?: (msg: string) => void;
};

export const ProductForm: React.FC<Props> = ({
  initialData,
  categoryId,
  filters,
  isOpen,
  setOpen,
  onError,
}) => {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "en") as Language;

  const [form, setForm] = useState(() => initialForm(initialData));
  useEffect(() => {
    setForm(initialForm(initialData));
  }, [initialData]);

  const [createProduct, createStatus] = useCreateProductMutation();
  const [changeProduct, changeStatus] = useChangeProductMutation();

  const title = Object.entries(form.title);
  const description = Object.entries(form.description);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const filters = [];
    for (const f of form.filters.values()) {
      filters.push(f.id);
    }
    const images = form.images.map((img) => ({
      id: img.uuid,
      imageUrl: img.cdnUrl,
      width: img.imageInfo?.width,
      height: img.imageInfo?.height,
    })) as ProductImage[];

    const price = form.price * 100;

    const request = initialData
      ? changeProduct({ ...form, filters, images, price, id: initialData.id })
      : createProduct({ ...form, filters, images, categoryId, price });
    request
      .unwrap()
      .then(() => {
        setOpen(false);
        setForm(initialForm());
      })
      .catch((e) => {
        console.log(e);
        onError?.(e.data.message);
      });
  };

  const isLoading = createStatus.isLoading || changeStatus.isLoading;
  const disabled = !checkForm(form, filters.length);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen} modal={true}>
      <DialogContent className="scrollbar top-0 max-h-screen max-w-4xl translate-y-0 overflow-y-scroll sm:mt-4 sm:max-h-[calc(100vh-2rem)]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit" : "Add"} product</DialogTitle>
          <DialogDescription>
            {initialData ? "Make changes to the" : "Add a new"} product
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="grid gap-4 py-4">
            <h3 className="text-sm font-medium leading-none">Title</h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
              {title.map(([key, v]) => (
                <CustomInput
                  key={key}
                  label={key}
                  value={v}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      title: {
                        ...prev.title,
                        [key]: e.target.value,
                      },
                    }))
                  }
                  autoComplete="off"
                />
              ))}
            </div>
            <h3 className="text-sm font-medium leading-none">Description</h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
              {description.map(([key, v]) => (
                <CustomTextArea
                  key={key}
                  className="max-h-60"
                  label={key}
                  value={v}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: {
                        ...prev.description,
                        [key]: e.target.value,
                      },
                    }))
                  }
                  autoComplete="off"
                />
              ))}
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
              <CustomInput
                label="Slug"
                value={form.slug}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, slug: e.target.value }))
                }
                autoComplete="off"
              />
              <CustomInput
                label="Price"
                type="number"
                min={0}
                step={0.01}
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    price: e.target.valueAsNumber || 0,
                  }))
                }
                autoComplete="off"
              />
            </div>
            <h3 className="text-sm font-medium leading-none">Filters</h3>
            <div className="space-y-4">
              {filters.map((f) => (
                <Fragment key={f.id}>
                  <h4 className="font-bold">{f.translations[lang]}</h4>
                  <div className="flex flex-wrap gap-2">
                    {f.variants.map((v) => (
                      <label
                        key={v.id}
                        className="group grid min-w-10 cursor-pointer place-content-center rounded-md bg-secondary px-2.5 py-0.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80 has-[:checked]:bg-primary"
                      >
                        <input
                          type="radio"
                          name={f.id}
                          className="appearance-none"
                          checked={form.filters.get(f.id)?.id === v.id}
                          onChange={() =>
                            setForm((prev) => ({
                              ...prev,
                              filters: prev.filters.set(f.id, v),
                            }))
                          }
                        />
                        {v.translations[lang]}
                      </label>
                    ))}
                  </div>
                </Fragment>
              ))}
            </div>
            <h3 className="text-sm font-medium leading-none">Images</h3>
            <FileUploader
              className="space-y-4"
              files={form.images}
              onChange={(files) =>
                setForm((prev) => ({ ...prev, images: files }))
              }
            >
              <UploadTrigger>Product Images</UploadTrigger>
              <UploaderPreview />
            </FileUploader>
          </div>
          <DialogFooter>
            <SubmitButton isLoading={isLoading} disabled={disabled}>
              Save changes
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
