import { useState } from "react";
import { OutputFileEntry } from "@uploadcare/blocks";
import { createTranslation } from "@/features/translations";
import {
  ChangeCategory,
  useChangeCategoryMutation,
  useCreateCategoryMutation,
} from "../categoriesApiSlice";
import { CustomInput } from "@/components/CustomInput";
import {
  FileUploader,
  UploadTrigger,
  UploaderPreview,
} from "@/components/FileUploader";
import { SubmitButton } from "@/components/SubmitButton";
import { cn, isFetchQueryError } from "@/lib/utils";

const initialForm = (initialData?: ChangeCategory) => ({
  slug: initialData?.slug ?? "",
  photo: (initialData
    ? [{ cdnUrl: initialData.imageUrl }]
    : []) as OutputFileEntry[],
});

type Props = {
  className?: string;
  initialData?: ChangeCategory;
  parentId?: string;
  onSuccess?: () => void;
  onError?: (msg?: string) => void;
};

export const CategoryForm: React.FC<Props> = ({
  className,
  parentId,
  initialData,
  onSuccess,
  onError,
}) => {
  const [translations, setTranslations] = useState(
    () => initialData?.title ?? createTranslation(),
  );
  const [form, setForm] = useState(() => initialForm(initialData));

  const [createCategory, createStatus] = useCreateCategoryMutation();
  const [changeCategory, changeStatus] = useChangeCategoryMutation();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const imageUrl = form.photo[0]?.cdnUrl;
    if (!imageUrl) return;

    const data = {
      title: translations,
      slug: form.slug,
      imageUrl,
    };

    const request = initialData
      ? changeCategory({ ...data, id: initialData.id })
      : createCategory({ ...data, parentId });
    try {
      await request.unwrap();
      onSuccess?.();
      if (!initialData) {
        setForm(initialForm(initialData));
        setTranslations(createTranslation());
      }
    } catch (e) {
      if (isFetchQueryError(e)) onError?.(e.data.message);
      else onError?.();
    }
  };

  return (
    <form onSubmit={onSubmit} className={cn("grid gap-10", className)}>
      <h2 className="text-xl font-bold">
        {initialData ? "Change category" : "Create Category"}
      </h2>
      <div className="ml-4 grid gap-4">
        <h3 className="-ml-4 text-sm font-medium leading-none">Title</h3>
        {Object.entries(translations).map(([key, t]) => (
          <CustomInput
            key={key}
            label={key}
            value={t}
            onChange={(e) =>
              setTranslations((prev) => ({
                ...prev,
                [key]: e.target.value,
              }))
            }
            autoComplete="off"
          />
        ))}
      </div>
      <CustomInput
        label="Slug"
        value={form.slug}
        onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
        autoComplete="off"
      />
      <FileUploader
        files={form.photo}
        onChange={(files) => setForm((prev) => ({ ...prev, photo: files }))}
        multiple={false}
        className="space-y-4"
      >
        <UploadTrigger className="justify-self-start">
          Change cover
        </UploadTrigger>
        <UploaderPreview />
      </FileUploader>

      <SubmitButton
        isLoading={createStatus.isLoading || changeStatus.isLoading}
        disabled={
          form.slug.trim().length === 0 ||
          !form.photo[0]?.cdnUrl ||
          Object.values(translations).some((t) => t.trim().length === 0)
        }
      >
        {initialData ? "Change" : "Create"}
      </SubmitButton>
    </form>
  );
};
