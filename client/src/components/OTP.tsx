import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { useRef } from "react";

type Props = Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> & {
  value: string[];
  onChange: (value: string[]) => void;
};

export const OTP: React.FC<Props> = ({
  value,
  onChange,
  className,
  ...rest
}) => {
  const count = value.length;
  const refs = useRef<HTMLInputElement[]>([]);

  const setFocus = (index: number) => {
    refs.current[index].focus();
  };

  const setNextFocus = (index: number, notEmpty = false) => {
    if (index !== count - 1) {
      setFocus(index + 1);
      return;
    }
    if (!notEmpty) setFocus(0);

    const empty = value.findIndex((v, i) => !v && i !== index);
    if (empty !== -1) setFocus(empty);
    else refs.current[index].blur();
  };

  const setPreviousFocus = (index: number, cycle = false) => {
    if (index !== 0) {
      setFocus(index - 1);
      return;
    }
    if (!cycle) setFocus(count - 1);
  };

  const changeValue = (val: string, index: number) => {
    const newValue = [...value];
    newValue[index] = val.slice(0, 1);
    onChange(newValue);
    return newValue;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const newValue = changeValue(e.target.value, index);
    if (newValue[index] !== "") setNextFocus(index, true);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      changeValue("", index);
      setPreviousFocus(index, true);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setNextFocus(index);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPreviousFocus(index);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
    } else if (e.key === value[index]) {
      e.preventDefault();
      setNextFocus(index, true);
    }
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    e.preventDefault();
    let pasted = e.clipboardData.getData("text/plain").split("");
    if (pasted.some((v) => isNaN(+v))) return;

    if (pasted.length === count) {
      onChange(pasted);
      e.currentTarget.blur();
      return;
    }

    pasted = pasted.slice(0, count);

    const newValue = [...value];
    let i = index;
    for (; i < Math.min(count, index + pasted.length); i++) {
      newValue[i] = pasted[i - index];
    }

    onChange(newValue);
    setNextFocus(i - 1);
  };

  return (
    <div className={cn("flex gap-2 xs:gap-4", className)} {...rest}>
      {value.map((v, i) => (
        <Input
          key={i}
          ref={(node) => {
            if (node) refs.current[i] = node;
          }}
          value={v}
          onChange={(e) => handleChange(e, i)}
          onFocus={handleFocus}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={(e) => handlePaste(e, i)}
          autoFocus={i === 0}
          name={"otp" + i}
          type="number"
          autoComplete="one-time-code"
          className="no-arrows h-20 w-full px-0 text-center text-2xl font-bold xs:w-12"
        />
      ))}
    </div>
  );
};
