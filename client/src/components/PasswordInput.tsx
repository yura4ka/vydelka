import { FC, useState } from "react";
import { CustomInputProps, CustomInput } from "./CustomInput";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export const PasswordInput: FC<CustomInputProps> = (props) => {
  const [isVisible, setIsVisible] = useState(false);
  const placeholder = isVisible
    ? props.placeholder
    : "•".repeat(props.placeholder?.trim().length || 0);
  return (
    <div className="relative">
      <CustomInput
        {...props}
        type={isVisible ? "text" : "password"}
        className={cn(props.className, "pr-[3.25rem]")}
        placeholder={placeholder}
      />
      <Button
        onClick={() => setIsVisible((prev) => !prev)}
        type="button"
        variant="secondary"
        size="icon"
        className={cn(
          "absolute right-0 top-0 translate-y-[55%] rounded-l-none",
          props.isError && "border border-l-0 border-destructive",
        )}
      >
        {isVisible ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};
