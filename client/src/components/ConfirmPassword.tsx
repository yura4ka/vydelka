import { FC, useEffect, useState } from "react";
import { PasswordInput } from "./PasswordInput";
import { useTranslation } from "react-i18next";

interface Props
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value"
  > {
  description: string;
  onChange: (value: string, isValid: boolean) => void;
  validate: (value: string) => boolean;
}

const initializePassword = (info: string) => ({
  value: "",
  isError: false,
  info: info,
});

export const ConfirmPassword: FC<Props> = ({
  description,
  onChange,
  validate,
  ...rest
}) => {
  const { t, i18n } = useTranslation();

  const PasswordInfo = {
    CONFIRM: t("auth.password.confirm"),
    NOT_MATCH: t("auth.password.not-match"),
  };

  const [password, setPassword] = useState(() =>
    initializePassword(description),
  );
  const [confirm, setConfirm] = useState(() =>
    initializePassword(PasswordInfo.CONFIRM),
  );

  useEffect(() => {
    onPasswordChange(password.value);
    onConfirmChange(confirm.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const onPasswordChange = (value: string) => {
    const value2 = confirm.value.trim();
    const isValid = validate(value.trim());
    const isEqual = value2 === value.trim();

    setPassword({
      value,
      isError:
        (!isValid && value.trim().length !== 0) ||
        (!isEqual && value2.length !== 0),
      info:
        !isEqual && isValid && value2.length !== 0
          ? PasswordInfo.NOT_MATCH
          : description,
    });

    if (!isEqual) {
      setConfirm((prev) => ({
        ...prev,
        isError: value2.length !== 0,
        info:
          value2.length === 0 ? PasswordInfo.CONFIRM : PasswordInfo.NOT_MATCH,
      }));
    } else {
      setConfirm((prev) => ({
        ...prev,
        isError: false,
        info: PasswordInfo.CONFIRM,
      }));
    }

    onChange(value, isValid && isEqual);
  };

  const onConfirmChange = (value: string) => {
    const original = password.value.trim();

    const isEqual = value.trim() === original;
    const isOriginalValid = validate(original);
    const isValid = isEqual && isOriginalValid;

    if (value.trim().length === 0) {
      setConfirm({ value, isError: false, info: PasswordInfo.CONFIRM });
      setPassword((prev) => ({
        ...prev,
        isError: !isOriginalValid && original.length !== 0,
        info: description,
      }));
      onChange(password.value, false);
      return;
    }

    setConfirm({
      value,
      isError: !isEqual,
      info: isEqual ? PasswordInfo.CONFIRM : PasswordInfo.NOT_MATCH,
    });

    setPassword((prev) => ({
      ...prev,
      isError: !isValid,
      info: !isEqual ? PasswordInfo.NOT_MATCH : description,
    }));

    onChange(original, isValid);
  };

  return (
    <>
      <PasswordInput
        label={t("auth.password.label")}
        value={password.value}
        onChange={(e) => onPasswordChange(e.target.value)}
        description={password.info}
        errorMessage={password.info}
        isError={password.isError}
        {...rest}
      />
      <PasswordInput
        label={t("auth.password.confirm")}
        value={confirm.value}
        onChange={(e) => onConfirmChange(e.target.value)}
        description={confirm.info}
        errorMessage={confirm.info}
        isError={confirm.isError}
        {...rest}
      />
    </>
  );
};
