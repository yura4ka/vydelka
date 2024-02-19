import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

type Props = {
  value: number;
  maxValue?: number;
  size?: number;
  readonly?: boolean;
  onChange?: (value: number) => void;
};

export const Rating: React.FC<Props> = ({
  value,
  maxValue = 5,
  size = 4,
  readonly,
  onChange,
}) => {
  const int = Math.floor(value);
  const float = value - int;
  const width = `${size / 4}rem`;

  const onClick = (value: number) => {
    if (!readonly) onChange?.(value);
  };

  return (
    <div className="inline-flex">
      {new Array(maxValue).fill(0).map((_, i) => (
        <div
          key={i}
          className={cn("group/rating relative", !readonly && "cursor-pointer")}
          onClick={() => onClick(i + 1)}
        >
          <Star
            style={{ width }}
            className={cn(
              "aspect-square stroke-1 text-muted-foreground transition-all",
              !readonly &&
                "group-hover/rating:stroke-2 group-hover/rating:text-amber-600",
            )}
          />
          <span
            style={{
              width:
                i < int ? "100%" : float && i === int ? `${float * 100}%` : "0",
            }}
            className="absolute top-0 overflow-hidden bg-background"
          >
            <Star
              style={{ width }}
              className={cn(
                "aspect-square fill-amber-600 stroke-1 text-muted-foreground",
                !readonly &&
                  "group-hover/rating:stroke-2 group-hover/rating:text-amber-600",
              )}
            />
          </span>
        </div>
      ))}
      <span className="sr-only">
        Rating : {value} / {maxValue}
      </span>
    </div>
  );
};
