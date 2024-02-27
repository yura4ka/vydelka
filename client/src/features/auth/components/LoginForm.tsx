import { CustomInput } from "@/components/CustomInput";
import { cn, createErrorToast, isFetchQueryError } from "@/lib/utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLoginMutation } from "../authApiSlice";
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
import { PasswordInput } from "@/components/PasswordInput";

type Props = {
  onSuccess?: (user: Required<AuthState>) => void;
} & React.FormHTMLAttributes<HTMLFormElement>;

export const LoginForm = ({ className, onSuccess, ...rest }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [login, loginStatus] = useLoginMutation();

  const [form, setForm] = useState(() => ({ emailOrPhone: "", password: "" }));
  const changeForm = (patch: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const result = await login(form).unwrap();
      onSuccess?.(result);
    } catch (e) {
      if (isFetchQueryError(e) && e.status === 400)
        toast(createErrorToast(t("auth.wrong-all"), null));
      else toast(createErrorToast());
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle>{t("auth.sign-in")}</CardTitle>
        <CardDescription>
          <span>{t("auth.don't-have-account")} </span>
          <Link to="/auth/sign-up" className="link">
            {t("auth.sign-up").toLowerCase()}
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <form onSubmit={onSubmit} className="grid gap-6" {...rest}>
          <CustomInput
            type="text"
            value={form.emailOrPhone}
            onChange={(e) => changeForm({ emailOrPhone: e.target.value })}
            label={t("auth.email-or-phone")}
            placeholder="taylor_js@gmail.com"
            autoComplete="username"
          />
          <PasswordInput
            value={form.password}
            onChange={(e) => changeForm({ password: e.target.value })}
            label={t("auth.password.label")}
            placeholder="cool-password-2024"
            autoComplete="current-password"
          />
          <SubmitButton
            isLoading={loginStatus.isLoading}
            disabled={Object.values(form).some((v) => v.trim().length === 0)}
          >
            {t("auth.sign-in")}
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
};
