import { useId } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

type Props = {
  label: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const CustomTextArea: React.FC<Props> = ({
  label,
  className,
  onChange,
  ...rest
}) => {
  const createdId = useId();
  const id = "textarea-" + label + (rest.id ?? createdId);

  const resizeTextArea = (element: HTMLTextAreaElement, reset = false) => {
    element.style.height = "";
    if (!reset) element.style.height = element.scrollHeight + "px";
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        {...rest}
        id={id}
        className={cn("scrollbar resize-none", className)}
        onChange={(e) => {
          resizeTextArea(e.target);
          onChange?.(e);
        }}
      />
    </div>
  );
};
