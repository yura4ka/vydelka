import { CustomInput } from "@/components/CustomInput";
import { useDebounce } from "@/hooks";
import { cn, emailRegex, passwordRegex, phoneRegex } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useLazyCheckEmailQuery,
  useLazyCheckPhoneNumberQuery,
  useLoginMutation,
  useRegisterMutation,
} from "../authApiSlice";
import { ConfirmPassword } from "@/components/ConfirmPassword";
import { SubmitButton } from "@/components/SubmitButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { AuthState } from "../authSlice";

const initialForm = () => ({
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  password: "",
});

const initialFormErrors = () => ({
  firstName: true,
  lastName: true,
  email: true,
  phoneNumber: true,
  password: true,
});

type Props = {
  onSuccess?: (user: Required<AuthState>) => void;
  onError?: () => void;
} & React.FormHTMLAttributes<HTMLFormElement>;

export const RegisterForm = ({
  className,
  onSuccess,
  onError,
  ...rest
}: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [register, registerStatus] = useRegisterMutation();
  const [login, loginStatus] = useLoginMutation();
  const [checkEmail, checkEmailStatus] = useLazyCheckEmailQuery();
  const [checkPhone, checkPhoneStatus] = useLazyCheckPhoneNumberQuery();

  const [form, setForm] = useState(() => initialForm());
  const changeForm = (patch: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const [formErrors, setFormErrors] = useState(() => initialFormErrors());
  const changeFormErrors = (patch: Partial<typeof formErrors>) => {
    setFormErrors((prev) => ({ ...prev, ...patch }));
  };

  const debouncedEmail = useDebounce(form.email);
  useEffect(() => {
    const trimmed = debouncedEmail.trim();
    if (!formErrors.email && trimmed.length > 0) checkEmail(trimmed);
  }, [checkEmail, debouncedEmail, formErrors.email]);

  const debouncedPhone = useDebounce(form.phoneNumber);
  useEffect(() => {
    const trimmed = debouncedPhone.trim();
    if (!formErrors.phoneNumber && trimmed.length > 0) checkPhone(trimmed);
  }, [checkPhone, debouncedPhone, formErrors.phoneNumber]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await register(form).unwrap();
    } catch {
      toast({
        variant: "destructive",
        title: t("error.something-wrong"),
        description: t("error.try-again"),
      });
      return;
    }
    try {
      const result = await login({
        emailOrPhone: form.email,
        password: form.password,
      }).unwrap();
      onSuccess?.(result);
    } catch {
      onError?.();
    }
  };

  return (
    <Card className={cn("w-full max-w-[700px]", className)}>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle>{t("auth.sign-up")}</CardTitle>
        <CardDescription>
          <span>{t("auth.have-account")} </span>
          <Link
            to="/auth/sign-in"
            className="font-semibold text-primary transition-colors hover:text-primary/80 hover:underline"
          >
            {t("auth.sign-in").toLowerCase()}
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <form
          onSubmit={onSubmit}
          className="grid gap-x-6 gap-y-10 sm:grid-cols-2"
          {...rest}
        >
          <CustomInput
            value={form.firstName}
            onChange={(e) => changeForm({ firstName: e.target.value })}
            validate={(value) => value.trim().length > 0}
            onValidate={(success) => changeFormErrors({ firstName: !success })}
            isError={formErrors.firstName}
            label={t("auth.first-name")}
            placeholder="Saylor"
            autoComplete="given-name"
          />
          <CustomInput
            value={form.lastName}
            onChange={(e) => changeForm({ lastName: e.target.value })}
            validate={(value) => value.trim().length > 0}
            onValidate={(success) => changeFormErrors({ lastName: !success })}
            isError={formErrors.lastName}
            label={t("auth.last-name")}
            placeholder="Twift"
            autoComplete="family-name"
          />
          <CustomInput
            type="email"
            value={form.email}
            onChange={(e) => changeForm({ email: e.target.value })}
            validate={(value) => emailRegex.test(value.trim())}
            onValidate={(success) => changeFormErrors({ email: !success })}
            isError={formErrors.email || checkEmailStatus.isError}
            isLoading={checkEmailStatus.isFetching}
            label={t("auth.email.label")}
            errorMessage={
              formErrors.email
                ? t("auth.email.wrong-format")
                : t("auth.email.already-taken")
            }
            placeholder="taylor_js@gmail.com"
            autoComplete="email"
          />
          <CustomInput
            type="tel"
            value={form.phoneNumber}
            onChange={(e) => changeForm({ phoneNumber: e.target.value })}
            validate={(value) => phoneRegex.test(value.trim())}
            onValidate={(success) =>
              changeFormErrors({ phoneNumber: !success })
            }
            isError={formErrors.phoneNumber || checkPhoneStatus.isError}
            isLoading={checkPhoneStatus.isFetching}
            label={t("auth.phone.label")}
            errorMessage={
              formErrors.phoneNumber
                ? t("auth.phone.wrong-format")
                : t("auth.phone.already-taken")
            }
            placeholder="+380953333333"
            autoComplete="tel"
          />
          <ConfirmPassword
            description={t("auth.password.description")}
            validate={(value) => passwordRegex.test(value.trim())}
            onChange={(value, isValid) => {
              changeForm({ password: value });
              changeFormErrors({ password: !isValid });
            }}
            placeholder="cool-password-2024"
            autoComplete="new-password"
          />
          <SubmitButton
            className="sm:col-span-2"
            isLoading={registerStatus.isLoading || loginStatus.isLoading}
            disabled={
              checkEmailStatus.isFetching ||
              checkPhoneStatus.isFetching ||
              Object.values(formErrors).some((e) => e === true)
            }
          >
            {t("auth.sign-up")}
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
};
