import { ConfirmPassword } from "@/components/ConfirmPassword";
import { CustomInput } from "@/components/CustomInput";
import { OTP } from "@/components/OTP";
import { SubmitButton } from "@/components/SubmitButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  RestorationCodeResponse,
  useCheckCodeMutation,
  useLoginMutation,
  useRequestCodeMutation,
  useResetPasswordMutation,
} from "@/features/auth/authApiSlice";
import { useAuth } from "@/features/auth/useAuth";
import {
  cn,
  createErrorToast,
  emailRegex,
  isFetchQueryError,
  passwordRegex,
} from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export const RestorePassword = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isLoading, isAuth } = useAuth();

  const [requestCode, requestStatus] = useRequestCodeMutation();
  const [attemptsData, setAttemptsData] =
    useState<RestorationCodeResponse | null>(null);
  const [checkCode, checkStatus] = useCheckCodeMutation();
  const [resetPassword, resetStatus] = useResetPasswordMutation();
  const [login, loginStatus] = useLoginMutation();

  const [dialog, setDialog] = useState(() => ({
    open: false,
    title: "",
    description: "",
  }));

  const [stage, setStage] = useState(0);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(() => new Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [isValidPassword, setIsValidPassword] = useState(false);

  const handleTooManyAttempts = () => {
    setDialog({
      open: true,
      title: t("auth.error.attempts"),
      description: t("auth.error.attempts-description"),
    });
  };

  const handleError = (e: unknown) => {
    if (isFetchQueryError(e)) {
      if (e.status === 429) {
        handleTooManyAttempts();
      } else if (e.status === 403) {
        setDialog({
          open: true,
          title: t("auth.error.expired"),
          description: t("auth.error.expired-description"),
        });
      } else if (e.status === 400) {
        toast(createErrorToast(undefined, t("auth.error.wrong-code")));
      } else {
        toast(createErrorToast());
      }
      return;
    }
    toast(createErrorToast());
  };

  const onEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await requestCode(email.trim()).unwrap();
      setAttemptsData(response);
      setStage(1);
    } catch (e) {
      handleError(e);
    }
  };

  const onCodeSubmit = async (
    e?: React.FormEvent<HTMLFormElement>,
    code = otp,
  ) => {
    e?.preventDefault();
    try {
      const { ok } = await checkCode({
        email,
        code: code.join(""),
      }).unwrap();
      if (!ok) {
        toast(createErrorToast(undefined, t("auth.error.wrong-code")));
        if (attemptsData) {
          setAttemptsData({
            ...attemptsData,
            attempts: attemptsData.attempts + 1,
          });
          if (attemptsData.attempts + 1 === attemptsData.maxAttempts) {
            handleTooManyAttempts();
          }
        }
      } else {
        setStage(2);
      }
    } catch (e) {
      handleError(e);
    }
  };

  const onPasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await resetPassword({
        email,
        newPassword: password,
        code: otp.join(""),
      }).unwrap();
      toast({
        title: t("success"),
        description: t("account.password-changed"),
      });
    } catch (e) {
      handleError(e);
      return;
    }
    try {
      await login({
        emailOrPhone: email,
        password,
      }).unwrap();
    } finally {
      navigate("/");
    }
  };

  if (isLoading) {
    return (
      <main className="grid place-content-center">
        <Loader2 className="animate-spin" />
      </main>
    );
  }

  if (isAuth) {
    navigate("/");
    return null;
  }

  return (
    <main className="flex items-center justify-center sm:px-4">
      <div className="h-full w-full max-w-screen-sm space-y-4 rounded-xl bg-card px-4 py-6 text-card-foreground sm:h-auto sm:border sm:p-6 sm:shadow">
        <h1 className="font-semibold leading-none tracking-tight">
          {t("auth.password-restoration")}
        </h1>
        {stage === 0 && (
          <form onSubmit={onEmailSubmit} className="space-y-4">
            <p className="text-muted-foreground">{t("auth.enter-email")}</p>
            <CustomInput
              label={t("auth.email.label")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="taylor_js@gmail.com"
              autoComplete="username"
              autoFocus={true}
            />
            <SubmitButton
              disabled={!emailRegex.test(email.trim())}
              isLoading={requestStatus.isLoading}
              className="w-full"
            >
              {t("auth.send")}
            </SubmitButton>
          </form>
        )}
        {stage === 1 && (
          <form onSubmit={onCodeSubmit}>
            <p className="pb-4 text-muted-foreground">
              {t("auth.enter-code")}{" "}
              <a
                href={`mailto:${email}`}
                className="break-word text-foreground hover:underline"
              >
                {email}
              </a>
            </p>
            <OTP
              value={otp}
              onChange={(value) => {
                setOtp(value);
                if (
                  attemptsData?.attempts === 0 &&
                  value.every((v) => v !== "")
                )
                  onCodeSubmit(undefined, value);
              }}
              className="justify-center"
            />
            <p
              className={cn(
                "pb-3 text-right text-sm text-muted-foreground opacity-0 transition-opacity",
                attemptsData && attemptsData.attempts > 0 && "opacity-100",
              )}
            >
              {attemptsData?.attempts ?? 0} / {attemptsData?.maxAttempts ?? 5}
            </p>
            {!attemptsData && checkStatus.isLoading && (
              <Loader2 className="mx-auto mb-4 size-8 animate-spin" />
            )}
            {attemptsData &&
              attemptsData.attempts > 0 &&
              attemptsData.attempts < attemptsData.maxAttempts && (
                <SubmitButton
                  disabled={checkStatus.isError}
                  isLoading={checkStatus.isLoading}
                  className="mb-4 w-full"
                >
                  {t("auth.send")}
                </SubmitButton>
              )}
            <button
              className="font-semibold text-primary transition-colors hover:text-primary/80 hover:underline"
              type="button"
              onClick={() => {
                setStage(0);
                setOtp(new Array(6).fill(""));
              }}
            >
              {t("auth.wrong-email")}
            </button>
          </form>
        )}
        {stage === 2 && (
          <form onSubmit={onPasswordSubmit} className="space-y-10">
            <p className="-mb-6 text-muted-foreground">{t("auth.enter-new")}</p>
            <ConfirmPassword
              description={t("auth.password.description")}
              validate={(value) => passwordRegex.test(value.trim())}
              onChange={(value, isValid) => {
                setPassword(value);
                setIsValidPassword(isValid);
              }}
              placeholder="cool-password-2024"
              autoComplete="new-password"
            />
            <SubmitButton
              disabled={!isValidPassword || resetStatus.isError}
              isLoading={resetStatus.isLoading || loginStatus.isLoading}
              className="w-full"
            >
              {t("account.change")}
            </SubmitButton>
          </form>
        )}
      </div>
      <AlertDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => navigate("/")}>
              {t("ok")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};
