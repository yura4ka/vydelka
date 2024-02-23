import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import {
  Review,
  useChangeReviewMutation,
  useCreateReviewMutation,
} from "../productsApiSlice";
import { useAuth } from "@/features/auth/useAuth";
import { CustomTextArea } from "@/components/CustomTextArea";
import { SubmitButton } from "@/components/SubmitButton";
import { Rating } from "@/components/Rating";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = React.FormHTMLAttributes<HTMLFormElement> & {
  productId: string;
  onSuccess?: () => void;
  onSubmitError?: (msg: string) => void;
  onCancel?: () => void;
  initialData?: Review;
};

export const ReviewForm: React.FC<Props> = ({
  productId,
  onSuccess,
  onSubmitError,
  onCancel,
  initialData,
  className,
  ...rest
}) => {
  const { t } = useTranslation();
  const { isLoading, isAuth } = useAuth();
  const [searchParams] = useSearchParams();
  const [content, setContent] = useState(initialData?.content ?? "");
  const [rating, setRating] = useState(initialData?.rating ?? 5);

  const [createReview, { isLoading: isCreating }] = useCreateReviewMutation();
  const [changeReview, { isLoading: isChanging }] = useChangeReviewMutation();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const request = initialData
      ? changeReview({
          content,
          rating,
          productId,
          reviewId: initialData.id,
          page: +(searchParams.get("page") ?? 1),
        })
      : createReview({ productId, content, rating });
    request
      .then(() => {
        onSuccess?.();
        setContent(initialData?.content ?? "");
        setRating(initialData?.rating ?? 5);
      })
      .catch((e) => onSubmitError?.(e.data.message));
  };

  if (!isAuth) {
    return (
      <div className="rounded border p-4">
        <Trans
          i18nKey="product.reviews.auth-required"
          components={{
            1: (
              <Link
                className="text-primary transition-colors hover:text-primary/80 hover:underline"
                to="auth/sign-in"
              />
            ),
            2: (
              <Link
                className="text-primary transition-colors hover:text-primary/80 hover:underline"
                to="auth/sign-up"
              />
            ),
          }}
        />
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn("grid grid-cols-2 gap-4", className)}
      {...rest}
    >
      {isLoading ? (
        <div className="grid h-20 place-content-center rounded-md border">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <>
          <div className="col-span-2">
            <CustomTextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              label={
                initialData
                  ? t("product.reviews.edit-review")
                  : t("product.reviews.create-review")
              }
              className="min-h-20"
              maxLength={10000}
              placeholder={t("product.reviews.placeholder")}
            />
          </div>
          <div className="col-span-2 flex items-center gap-4 text-sm font-medium leading-none sm:col-auto">
            {t("product.reviews.rating")}
            <Rating value={rating} onChange={setRating} size={8} />
          </div>
        </>
      )}

      <div className="col-span-2 flex gap-2 sm:col-auto sm:justify-self-end">
        {initialData && (
          <Button variant="secondary" onClick={onCancel}>
            {t("cancel")}
          </Button>
        )}
        <SubmitButton
          isLoading={isCreating || isChanging}
          disabled={
            isLoading || content.trim().length === 0 || rating < 0 || rating > 5
          }
        >
          {initialData
            ? t("product.reviews.edit")
            : t("product.reviews.create")}
        </SubmitButton>
      </div>
    </form>
  );
};
