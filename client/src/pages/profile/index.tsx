import { ConfirmPassword } from "@/components/ConfirmPassword";
import { CustomInput } from "@/components/CustomInput";
import { PasswordInput } from "@/components/PasswordInput";
import { SubmitButton } from "@/components/SubmitButton";
import { useToast } from "@/components/ui/use-toast";
import {
  useChangeUserMutation,
  useLazyCheckEmailQuery,
  useLazyCheckPhoneNumberQuery,
} from "@/features/auth/authApiSlice";
import { User } from "@/features/auth/authSlice";
import { useAuth } from "@/features/auth/useAuth";
import { useDebounce } from "@/hooks";
import {
  createErrorToast,
  emailRegex,
  isFetchQueryError,
  passwordRegex,
  phoneRegex,
} from "@/lib/utils";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const initialForm = (user: User) => ({
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phoneNumber: user.phoneNumber,
});

const initialFormErrors = () => ({
  firstName: false,
  lastName: false,
  email: false,
  phoneNumber: false,
});

const UserForm = ({ user }: { user: User }) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [changeUser, changeStatus] = useChangeUserMutation();
  const [checkEmail, checkEmailStatus] = useLazyCheckEmailQuery();
  const [checkPhone, checkPhoneStatus] = useLazyCheckPhoneNumberQuery();

  const [form, setForm] = useState(() => initialForm(user));
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
      await changeUser({ user: form }).unwrap();
      toast({
        title: t("success"),
        description: t("account.data-changed"),
      });
    } catch {
      toast(createErrorToast());
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-10">
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
        onValidate={(success) => changeFormErrors({ phoneNumber: !success })}
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
      <SubmitButton
        isLoading={changeStatus.isLoading}
        disabled={
          checkEmailStatus.isFetching ||
          checkPhoneStatus.isFetching ||
          Object.values(formErrors).some((e) => e === true)
        }
      >
        {t("account.change")}
      </SubmitButton>
    </form>
  );
};

const ChangePasswordForm = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [changeUser, changeStatus] = useChangeUserMutation();
  const [form, setForm] = useState(() => ({
    newPassword: "",
    oldPassword: "",
  }));
  const [isError, setIsError] = useState(true);
  const changeForm = (patch: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await changeUser({ password: form }).unwrap();
      toast({
        title: t("success"),
        description: t("account.password-changed"),
      });
      setForm({ newPassword: "", oldPassword: "" });
      setIsError(true);
    } catch (e) {
      if (isFetchQueryError(e)) {
        if (e.status === 400)
          toast(createErrorToast(t("auth.wrong-password"), null));
        else toast(createErrorToast());
        return;
      }
      toast(createErrorToast());
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-10">
      <PasswordInput
        value={form.oldPassword}
        onChange={(e) => changeForm({ oldPassword: e.target.value })}
        label={t("account.old-password")}
        description={t("account.enter-old")}
        placeholder="cool-password-2024"
        autoComplete="current-password"
      />
      <ConfirmPassword
        description={t("auth.password.description")}
        validate={(value) => passwordRegex.test(value.trim())}
        onChange={(value, isValid) => {
          changeForm({ newPassword: value });
          setIsError(!isValid);
        }}
        placeholder="cool-password-2024"
        autoComplete="new-password"
      />
      <SubmitButton
        isLoading={changeStatus.isLoading}
        disabled={isError || !passwordRegex.test(form.oldPassword.trim())}
      >
        {t("account.change")}
      </SubmitButton>
    </form>
  );
};

export const ProfilePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <main className="container space-y-8 px-2 py-8 xs:px-4">
      <h1 className="text-4xl font-extrabold tracking-tight">
        {t("navigation.profile")}
      </h1>
      <section className="max-w-screen-sm">
        <h2 className="pb-8 text-2xl font-bold tracking-tight">
          {t("account.data")}
        </h2>
        <UserForm user={user} />
      </section>
      <section className="max-w-screen-sm">
        <h2 className="pb-8 text-2xl font-bold tracking-tight">
          {t("account.change-password")}
        </h2>
        <ChangePasswordForm />
      </section>
    </main>
  );
};
