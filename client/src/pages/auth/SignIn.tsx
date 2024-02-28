import { LoginForm } from "@/features/auth/components/LoginForm";
import { useAuth } from "@/features/auth/useAuth";
import { Navigate, useNavigate } from "react-router-dom";

export const SignIn = () => {
  const { isAuth, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isAuth && !isLoading) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="flex justify-center py-4 xs:items-center">
      <LoginForm
        onSuccess={() => navigate("/")}
        className="max-w-screen-xs border-0 shadow-none xs:border xs:shadow"
      />
    </main>
  );
};
