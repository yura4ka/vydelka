import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MoreHorizontal, UserCheck } from "lucide-react";
import { Review, useDeleteReviewMutation } from "../productsApiSlice";
import { cn, formatStringDate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/Rating";
import { useAuth } from "@/features/auth/useAuth";
import { ReviewForm } from "./ReviewForm";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  review: Review;
  onEditSuccess?: () => void;
  onDelete?: () => void;
  onError?: (msg: string) => void;
};

export const ReviewCard: React.FC<Props> = ({
  review,
  className,
  onEditSuccess,
  onDelete,
  onError,
  ...rest
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const [deleteReview] = useDeleteReviewMutation();
  const handleDelete = () => {
    deleteReview({ productId: review.productId, reviewId: review.id })
      .then(onDelete)
      .catch((e) => onError?.(e.data.message));
  };

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border bg-card p-4 text-card-foreground",
        className,
      )}
      {...rest}
    >
      {user?.id === review.userId && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-44">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              {t("product.reviews.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete}>
              {t("product.reviews.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {isEditing ? (
        <ReviewForm
          productId={review.productId}
          initialData={review}
          onSuccess={() => {
            setIsEditing(false);
            onEditSuccess?.();
          }}
          onCancel={() => setIsEditing(false)}
          onSubmitError={onError}
        />
      ) : (
        <>
          {review.isVerified && (
            <div className="flex items-center gap-1 pb-2 text-xs text-muted-foreground">
              <UserCheck className="size-4" />
              {t("product.reviews.verified")}
            </div>
          )}
          <div className="font-medium">{review.userName}</div>
          <Rating value={review.rating} readonly />
          <p>{review.content}</p>
          <div className="pt-2 text-sm text-muted-foreground">
            <p>
              {`${t("product.reviews.created-at")} ${formatStringDate(review.createdAt)}`}
            </p>
            {review.updatedAt && (
              <p>
                {`${t("product.reviews.edited")} ${formatStringDate(review.updatedAt)}`}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
