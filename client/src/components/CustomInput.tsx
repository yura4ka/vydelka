import { FC, useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CustomInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  errorMessage?: string;
  isError?: boolean;
  isLoading?: boolean;
  validate?: (value: string) => boolean;
  onValidate?: (success: boolean) => void;
}

export const CustomInput: FC<CustomInputProps> = ({
  label,
  description,
  errorMessage,
  isError,
  isLoading,
  onChange,
  validate,
  onValidate,
  value,
  ...rest
}) => {
  const createdId = useId();
  const id = rest.id || label || "input-" + createdId;
  const nonEmptyError = isError && value?.toString().trim().length !== 0;

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isValid = validate?.(e.target.value);
    onValidate?.(isValid ?? true);
    onChange?.(e);
  };

  return (
    <div className="relative space-y-1.5">
      <Label
        htmlFor={id}
        className={cn(
          "flex items-center gap-1.5",
          nonEmptyError && "text-destructive",
        )}
      >
        {label}
        <Loader2
          className={`h-[0.875rem] w-[0.875rem] animate-spin transition-opacity ${
            isLoading !== true ? "opacity-0" : "opacity-100"
          }`}
        />
      </Label>
      <Input
        {...rest}
        id={id}
        value={value}
        onChange={onInputChange}
        className={cn(
          rest.className,
          nonEmptyError && "border-destructive focus-visible:ring-destructive",
        )}
      />
      <p
        className={cn(
          "absolute text-sm text-muted-foreground opacity-0 transition-all",
          (errorMessage || description) && "opacity-1",
          nonEmptyError && "text-destructive",
        )}
      >
        {nonEmptyError ? errorMessage : description}
      </p>
    </div>
  );
};
